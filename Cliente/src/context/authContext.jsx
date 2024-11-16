import axios from "axios";
import React, { useEffect, useState, createContext } from "react";
import { API_URL } from "../config.js";

const URL = API_URL;
export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );
  const [isUserActive, setIsUserActive] = useState(false);
  const [logoutTimer, setLogoutTimer] = useState(null);

  const login = async (inputs) => {
    const res = await axios.post(`${URL}/api/auth/login`, inputs, {
      withCredentials: true,
    });
    setCurrentUser(res.data);
  };

  const logout = async () => {
    await axios.post(`${URL}/api/auth/logout`, null, { withCredentials: true });
    setCurrentUser(null);
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const refreshUserData = async () => {
    try {
      const res = await axios.get(`${URL}/api/auth/user`, {
        withCredentials: true,
      });
      setCurrentUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch (err) {
      console.error("Error al refrescar los datos del usuario:", err);
      logout(); // Si falla la solicitud, cerrar sesión
    }
  };

  // Función para reiniciar el temporizador de cierre de sesión
  const resetLogoutTimer = () => {
    if (logoutTimer) {
      clearTimeout(logoutTimer); // Asegúrate de usar clearTimeout en lugar de clearInterval
    }
    // Establecer un nuevo temporizador de 1 hora (3600000 ms)
    const timer = setTimeout(() => {
      logout();
    }, 3600000);
    setLogoutTimer(timer);
  };

  // Función para manejar la actividad del usuario
  const handleUserActivity = () => {
    setIsUserActive(true);
    resetLogoutTimer();
  };

  useEffect(() => {
    if (currentUser) {
      // Solo reinicia el temporizador si el usuario está logueado
      resetLogoutTimer();
    }
  }, [currentUser]); // Esto se ejecuta cuando cambia el usuario actual

  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    // Agregar los eventos para detectar actividad del usuario
    document.addEventListener("mousedown", handleUserActivity);
    document.addEventListener("mousemove", handleUserActivity);
    document.addEventListener("keydown", handleUserActivity);
    document.addEventListener("keypress", handleUserActivity);
    document.addEventListener("touchstart", handleUserActivity); // Para móviles
    document.addEventListener("touchmove", handleUserActivity); // Para móviles
    return () => {
      // Limpiar los eventos cuando el componente se desmonte
      document.removeEventListener("mousedown", handleUserActivity);
      document.removeEventListener("mousemove", handleUserActivity);
      document.removeEventListener("keydown", handleUserActivity);
      document.removeEventListener("keypress", handleUserActivity);
      document.removeEventListener("touchstart", handleUserActivity);
      document.removeEventListener("touchmove", handleUserActivity);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
