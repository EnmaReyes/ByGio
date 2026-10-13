import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Meta Pixel se carga SOLO tras el consentimiento del usuario
// (ver `src/metaPixel.js` y `Componentes/BannerCookies.jsx`), que registra el
// "PageView" inicial. Este componente registra un "PageView" adicional por cada
// cambio de ruta de la navegacion SPA, omitiendo el primer render para evitar
// duplicados (incluida la doble ejecucion de efectos de StrictMode).
// Si el usuario rechaza las cookies, `window.fbq` no existe y no se envia nada.
const PixelPageViewTracker = () => {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [location.pathname, location.search]);

  return null;
};

export default PixelPageViewTracker;
