//! SDK oficial de Facebook Login (integracion directa, sin librerias externas)\\
// Mismo patron de carga que src/metaPixel.js: loader idempotente y asincrono.

const FB_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;
// Version del Graph API usada por el SDK. Verificar/actualizar periodicamente:
// https://developers.facebook.com/docs/graph-api/changelog
const GRAPH_VERSION = "v21.0";

let sdkPromise = null;

// Devuelve una promesa que resuelve con window.FB cuando el SDK esta listo.
// Rechaza si no hay app ID configurado o si falla la descarga (bloqueadores).
export const loadFacebookSdk = () => {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    if (!FB_APP_ID) {
      reject(new Error("VITE_FACEBOOK_APP_ID no está configurado"));
      return;
    }
    if (typeof window === "undefined" || typeof document === "undefined") {
      reject(new Error("Entorno sin window/document"));
      return;
    }
    if (window.FB) {
      resolve(window.FB);
      return;
    }

    window.fbAsyncInit = () => {
      window.FB.init({
        appId: FB_APP_ID,
        cookie: false, // la sesion la gestiona ByGio (cookie httpOnly propia)
        xfbml: false,
        version: GRAPH_VERSION,
      });
      resolve(window.FB);
    };

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.src = "https://connect.facebook.net/es_LA/sdk.js";
    script.onerror = () => {
      sdkPromise = null; // permite reintentar
      reject(new Error("No se pudo cargar el SDK de Facebook"));
    };
    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      (document.head || document.documentElement).appendChild(script);
    }
  });

  return sdkPromise;
};

// Ejecuta el flujo de login y devuelve el accessToken de corta duracion.
// El backend lo valida contra el Graph API antes de crear la sesion local.
export const requestFacebookAccessToken = async () => {
  const FB = await loadFacebookSdk();
  return new Promise((resolve, reject) => {
    FB.login(
      (response) => {
        if (response?.authResponse?.accessToken) {
          resolve(response.authResponse.accessToken);
        } else {
          reject(new Error("Inicio de sesión cancelado o no autorizado"));
        }
      },
      { scope: "public_profile,email" },
    );
  });
};
