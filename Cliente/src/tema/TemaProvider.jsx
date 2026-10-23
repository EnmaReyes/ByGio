import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/*
 * =========================================================
 * TEMA CLARO / OSCURO
 * =========================================================
 *
 * El tema se resuelve con el atributo data-theme en <html>.
 * La clave de localStorage (bygio_theme) es compartida con el
 * script inline de index.html, que aplica el tema antes de que
 * React monte para evitar el "flash".
 *
 * Este archivo vive fuera de src/context/ a propósito: la carpeta
 * de contextos de negocio no debe modificarse para cambios visuales.
 */

export const TEMA_STORAGE_KEY = "bygio_theme";

export const TemaContext = createContext(null);

const normalizarTema = (valor) => (valor === "dark" ? "dark" : "light");

const leerPreferenciaSistema = () => {
  try {
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
  } catch {
    /* Sin soporte de matchMedia: se usa el tema claro. */
  }
  return "light";
};

export const leerTemaInicial = () => {
  try {
    const guardado = localStorage.getItem(TEMA_STORAGE_KEY);
    if (guardado === "light" || guardado === "dark") {
      return guardado;
    }
  } catch {
    /* localStorage bloqueado: se cae a la preferencia del sistema. */
  }
  return leerPreferenciaSistema();
};

const aplicarTemaEnDocumento = (tema) => {
  const root = document.documentElement;
  if (!root) return;
  root.setAttribute("data-theme", tema);
  root.style.colorScheme = tema;
};

export const TemaProvider = ({ children }) => {
  const [tema, setTema] = useState(leerTemaInicial);

  // Sincroniza el atributo del documento con el estado de React.
  useEffect(() => {
    aplicarTemaEnDocumento(tema);
  }, [tema]);

  // Si el usuario no ha elegido manualmente, seguimos al sistema.
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const manejarCambio = (evento) => {
      let eleccionManual = null;
      try {
        eleccionManual = localStorage.getItem(TEMA_STORAGE_KEY);
      } catch {
        eleccionManual = null;
      }
      if (eleccionManual === "light" || eleccionManual === "dark") return;
      setTema(evento.matches ? "dark" : "light");
    };

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", manejarCambio);
      return () => media.removeEventListener("change", manejarCambio);
    }

    // Navegadores antiguos.
    media.addListener(manejarCambio);
    return () => media.removeListener(manejarCambio);
  }, []);

  const establecerTema = useCallback((nuevo) => {
    setTema((previo) => {
      const valor = typeof nuevo === "function" ? nuevo(previo) : nuevo;
      const siguiente = normalizarTema(valor);
      try {
        localStorage.setItem(TEMA_STORAGE_KEY, siguiente);
      } catch {
        /* Sin persistencia: el tema igual cambia en esta sesión. */
      }
      return siguiente;
    });
  }, []);

  const alternarTema = useCallback(() => {
    setTema((previo) => {
      const siguiente = previo === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(TEMA_STORAGE_KEY, siguiente);
      } catch {
        /* Sin persistencia: el tema igual cambia en esta sesión. */
      }
      return siguiente;
    });
  }, []);

  const valor = useMemo(
    () => ({
      tema,
      esOscuro: tema === "dark",
      establecerTema,
      alternarTema,
    }),
    [tema, establecerTema, alternarTema],
  );

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
};

export const useTema = () => {
  const contexto = useContext(TemaContext);

  if (!contexto) {
    throw new Error("useTema debe utilizarse dentro de TemaProvider");
  }

  return contexto;
};

export default TemaProvider;
