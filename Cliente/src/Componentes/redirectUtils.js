// Ruta interna a la que volver despues de iniciar sesion o registrarse.
// Solo se aceptan rutas relativas al sitio: "//sitio-externo" y URLs
// absolutas se descartan para no abrir un redirect abierto.
export const safeRedirectPath = (value, fallback = "/") => {
  if (typeof value !== "string") return fallback;
  const ruta = value.trim();
  if (!ruta.startsWith("/") || ruta.startsWith("//")) return fallback;
  return ruta;
};
