import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { resetConsent } from "../metaPixel";
import logo from "../assets/Logo/logo_blanco.png";

const Footer = () => {
  const PhoneNumber = import.meta.env.VITE_NUMBER_PHONE;
  const anioActual = new Date().getFullYear();

  return (
    <footer className="pie">
      <div className="pie-inner">
        <div className="pie-marca">
          <img src={logo} alt="ByGio" className="pie-logo" />
          <p className="pie-texto">
            Camisetas básicas, oversize y diseños originales en DTF, creados
            para expresar tu estilo cada día. Hechas en Colombia, pensadas para
            ti.
          </p>
          <div className="pie-redes">
            <a
              className="pie-red"
              href="https://www.instagram.com/bygiostore.co?utm_source=ig_web_button_share_sheet&srtk=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de ByGio"
            >
              <FontAwesomeIcon icon={faInstagram} aria-hidden="true" />
            </a>
            <a
              className="pie-red"
              href={`https://wa.me/${PhoneNumber}?text=%C2%A1Hola%20byGio!%20Quiero%20hacer%20un%20pedido`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp de ByGio"
            >
              <FontAwesomeIcon icon={faWhatsapp} aria-hidden="true" />
            </a>
          </div>
        </div>

        <nav aria-label="Navegación del sitio">
          <h2 className="pie-titulo">Explora</h2>
          <ul className="pie-lista">
            <li>
              <Link to="/" className="pie-enlace">
                Inicio
              </Link>
            </li>
            <li>
              <Link to="/productos" className="pie-enlace">
                Productos
              </Link>
            </li>
            <li>
              <Link to="/productos?coleccion=dtf" className="pie-enlace">
                Diseños DTF
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="pie-titulo">Atención</h2>
          <ul className="pie-lista">
            <li>
              <a
                className="pie-enlace"
                href={`https://wa.me/${PhoneNumber}?text=%C2%A1Hola%20byGio!%20Quiero%20hacer%20un%20pedido`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FontAwesomeIcon icon={faWhatsapp} aria-hidden="true" />
                Escríbenos por WhatsApp
              </a>
            </li>
            <li>
              <a
                className="pie-enlace"
                href="https://www.instagram.com/bygiostore.co?utm_source=ig_web_button_share_sheet&srtk=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
              >
                <FontAwesomeIcon icon={faInstagram} aria-hidden="true" />
                @byGio | Camisetas & DTF
              </a>
            </li>
            <li>
              <Link to="/login" className="pie-enlace">
                Mi cuenta
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="pie-legal">
        <Link to="/privacidad" className="pie-legal-enlace">
          Política de privacidad
        </Link>
        <Link to="/terminos" className="pie-legal-enlace">
          Términos y condiciones
        </Link>
        <button
          type="button"
          className="pie-legal-enlace"
          onClick={() => {
            resetConsent();
            window.location.reload();
          }}
        >
          Preferencias de cookies
        </button>
        <span className="pie-copy">© {anioActual} ByGio</span>
      </div>
    </footer>
  );
};

export default Footer;
