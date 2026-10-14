import axios from "axios";
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  createContext,
} from "react";
import { API_URL } from "../config.js";

export const AuthContext = createContext();

const LOGOUT_DELAY = 3600000; // 1 hora de inactividad
const ACTIVITY_THROTTLE = 60000; // reiniciar el timer como maximo 1 vez/minuto

// B.5: lectura tolerante a datos corruptos en localStorage
const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

export const AuthContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(readStoredUser);
  // B.1/B.2/B.4: el timer vive en una ref (no en estado) -> un solo timer
  // real, sin re-renderizar la app en cada evento de actividad.
  const logoutTimerRef = useRef(null);
  const lastActivityRef = useRef(0);

  const login = async (inputs) => {
    const res = await axios.post(`${API_URL}/api/auth/login`, inputs, {
      withCredentials: true,
    });
    setCurrentUser(res.data);
  };

  // Inicio de sesion social: el endpoint ya devolvio el usuario; aqui solo
  // se refleja en el estado (misma cookie httpOnly que el login tradicional).
  const loginWithSocial = (userData) => {
    setCurrentUser(userData);
  };

  // B.6: el estado local se limpia SIEMPRE, aunque falle la peticion al
  // servidor (evita sesiones zombie si no hay red).
  const logout = useCallback(async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, null, {
        withCredentials: true,
      });
    } catch (error) {
      console.error("No se pudo notificar el cierre de sesión:", error);
    } finally {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
      setCurrentUser(null);
      window.location.href = "/";
    }
  }, []);

  // B.1: siempre cancela el timer anterior; usa ref estable, sin closures viejas.
  const resetLogoutTimer = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    logoutTimerRef.current = setTimeout(logout, LOGOUT_DELAY);
  }, [logout]);

  // B.8: endpoint corregido (/api/auth/me) y sin logout forzado en caso de
  // error de red; solo cierra sesion si el servidor responde 401/404.
  const refreshUserData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true,
      });
      setCurrentUser(res.data);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 404) {
        setCurrentUser(null);
      } else {
        console.error("Error al refrescar los datos del usuario:", err);
      }
    }
  };

  useEffect(() => {
    if (currentUser) {
      resetLogoutTimer();
    }
    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
    };
  }, [currentUser, resetLogoutTimer]);

  // B.7: null se elimina de localStorage en vez de guardar el string "null"
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem("user", JSON.stringify(currentUser));
      } else {
        localStorage.removeItem("user");
      }
    } catch {
      /* almacenamiento no disponible */
    }
  }, [currentUser]);

  // B.2/B.3: la actividad NO actualiza estado; solo reinicia el timer,
  // con throttle para no crear timers en cada mousemove.
  useEffect(() => {
    const handleUserActivity = () => {
      if (!logoutTimerRef.current) return; // sin sesion activa no hay timer
      const now = Date.now();
      if (now - lastActivityRef.current < ACTIVITY_THROTTLE) return;
      lastActivityRef.current = now;
      resetLogoutTimer();
    };

    const events = ["mousedown", "mousemove", "keydown", "touchstart"];
    events.forEach((event) =>
      document.addEventListener(event, handleUserActivity, { passive: true }),
    );
    return () => {
      events.forEach((event) =>
        document.removeEventListener(event, handleUserActivity),
      );
    };
  }, [resetLogoutTimer]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        loginWithSocial,
        logout,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
