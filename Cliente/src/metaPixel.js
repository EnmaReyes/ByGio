//! Meta Pixel con consentimiento previo (Ley 1581 de 2012 - Colombia)\\
// El pixel NO se carga hasta que el usuario acepta las cookies en
// `Componentes/BannerCookies.jsx`. No re-anadir el snippet a index.html.

export const PIXEL_ID = "1417915269868850";

const CONSENT_KEY = "meta_pixel_consent";
const CONSENT_GRANTED = "granted";
const CONSENT_DENIED = "denied";
const CONSENT_VALUES = [CONSENT_GRANTED, CONSENT_DENIED];

const log = (level, message, error) => {
  if (typeof console !== "undefined" && typeof console[level] === "function") {
    console[level](`[MetaPixel] ${message}`, error ?? "");
  }
};

// Devuelve el consentimiento almacenado ("granted" | "denied") o null si no
// hay una decision valida registrada.
export const getConsent = () => {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return CONSENT_VALUES.includes(value) ? value : null;
  } catch (error) {
    log(
      "warn",
      "localStorage no disponible; se truncara la lectura del consentimiento.",
      error,
    );
    return null;
  }
};

const clearPixelCookies = () => {
  try {
    for (const name of ["_fbp", "_fbc"]) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  } catch (error) {
    log(
      "warn",
      "No fue posible eliminar las cookies del pixel (_fbp/_fbc).",
      error,
    );
  }
};

export const setConsent = (value) => {
  if (!CONSENT_VALUES.includes(value)) {
    log(
      "error",
      `Valor de consentimiento invalido: "${String(value)}". Usa "granted" o "denied".`,
    );
    return false;
  }
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch (error) {
    log(
      "error",
      "No fue posible persistir el consentimiento (storage lleno, modo privado o politicas del navegador). El estado solo aplicara a esta sesion.",
      error,
    );
  }
  if (value === CONSENT_DENIED) {
    clearPixelCookies();
  }
  return true;
};

export const resetConsent = () => {
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch (error) {
    log(
      "warn",
      "No fue posible restablecer el consentimiento en localStorage.",
      error,
    );
  }
};

let pixelRequested = false;

// Carga el script oficial de Meta de forma asincrona, inicializa el pixel
// y registra el "PageView" inicial. Idempotente: segura en StrictMode y
// ante llamadas repetidas. Si la descarga del script falla, el estado se
// restablece para permitir un reintento posterior.
export const loadMetaPixel = () => {
  if (
    pixelRequested ||
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    window.fbq
  ) {
    return;
  }
  pixelRequested = true;

  // Stub oficial de Meta: encola los eventos mientras el script termina de cargar.
  const n = (window.fbq = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  });
  if (!window._fbq) window._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];

  try {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.onerror = (error) => {
      // Los eventos encolados se descartan y se permite reintentar la carga.
      log(
        "error",
        "Fallo la descarga de fbevents.js (red o bloqueador). Se habilita el reintento.",
        error,
      );
      delete window.fbq;
      delete window._fbq;
      pixelRequested = false;
    };

    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      (document.head || document.documentElement).appendChild(script);
    }

    window.fbq("init", PIXEL_ID);
    window.fbq("track", "PageView");
  } catch (error) {
    log(
      "error",
      "Error inesperado al inyectar el script de Meta Pixel.",
      error,
    );
    delete window.fbq;
    delete window._fbq;
    pixelRequested = false;
  }
};
