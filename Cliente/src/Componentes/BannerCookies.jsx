import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getConsent, setConsent, loadMetaPixel } from "../metaPixel";

const BannerCookies = () => {
  const [visible, setVisible] = useState(() => getConsent() === null);

  // Visitantes recurrentes que ya aceptaron: cargar el pixel al montar la app.
  useEffect(() => {
    if (getConsent() === "granted") {
      loadMetaPixel();
    }
  }, []);

  const handleChoice = (choice) => {
    setConsent(choice);
    if (choice === "granted") {
      // Registra init + "PageView" de la pagina actual en el momento del consentimiento.
      loadMetaPixel();
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="position-fixed bottom-0 start-0 end-0 bg-dark text-light p-3 shadow-lg"
      style={{ zIndex: 1080 }}
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
    >
      <div className="container d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
        <p className="mb-0 small">
          Utilizamos cookies propias y de Meta (Facebook Pixel) para analizar el
          trafico y mejorar tu experiencia. Puedes aceptar o rechazar su uso.
          Consulta nuestra{" "}
          <Link
            to="/privacidad"
            className="text-light"
            style={{ textDecoration: "underline", cursor: "pointer" }}
          >
            Politica de Privacidad
          </Link>
          .
        </p>
        <div className="d-flex gap-2 flex-shrink-0">
          <button
            type="button"
            className="btn btn-outline-light btn-sm"
            onClick={() => handleChoice("denied")}
          >
            Rechazar
          </button>
          <button
            type="button"
            className="btn btn-light btn-sm"
            onClick={() => handleChoice("granted")}
          >
            Aceptar cookies
          </button>
        </div>
      </div>
    </div>
  );
};

export default BannerCookies;
