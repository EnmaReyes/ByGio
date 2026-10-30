import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import {
  faArrowUpRightFromSquare,
  faCircleQuestion,
  faFileContract,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import "./dashboard.css";

const TELEFONO = import.meta.env.VITE_NUMBER_PHONE;
const WHATSAPP = `https://wa.me/${TELEFONO}?text=${encodeURIComponent(
  "¡Hola ByGio! Necesito ayuda con mi pedido",
)}`;
const INSTAGRAM =
  "https://www.instagram.com/bygiostore.co?utm_source=ig_web_button_share_sheet&srtk=ZDNlZDc0MzIxNw==";

const PREGUNTAS = [
  {
    pregunta: "¿Cómo confirmo el pago de mi pedido?",
    respuesta:
      "Al crear el pedido te contactamos por WhatsApp para coordinar el pago (transferencia o Nequi) y la entrega. Mientras no se confirme el pago, los productos quedan reservados por 30 minutos.",
  },
  {
    pregunta: "¿Cuánto tarda la entrega?",
    respuesta:
      "El envío puede tardar hasta 10 días hábiles después de confirmar el pago. Cuando tu pedido se despache verás la transportadora y el número de guía en el detalle del pedido.",
  },
  {
    pregunta: "¿Puedo cancelar un pedido?",
    respuesta:
      "Puedes cancelar un pedido mientras esté pendiente de pago desde el detalle del pedido. Una vez confirmado el pago, escríbenos por WhatsApp para revisar el caso.",
  },
  {
    pregunta: "¿Cómo funcionan los diseños DTF?",
    respuesta:
      "Subes tu diseño, eliges el tamaño (básico u oversize) y nosotros lo imprimimos sobre la prenda que elijas. Si tienes dudas del formato, escríbenos por WhatsApp.",
  },
];

const Soporte = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="panel-seccion-cabecera">
      <header className="panel-titulo">
        <span className="etiqueta-seccion">Estamos para ayudarte</span>
        <h1 className="panel-titulo-texto">Soporte y ayuda</h1>
        <p className="texto-seccion">
          Resolvemos tus dudas sobre pedidos, pagos y envíos. Elige el canal que
          prefieras.
        </p>
      </header>

      <div className="soporte-canales">
        <a
          className="soporte-canal"
          href={WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="soporte-canal-icono" aria-hidden="true">
            <FontAwesomeIcon icon={faWhatsapp} />
          </span>
          <strong>WhatsApp</strong>
          <span>La vía más rápida para pedidos y dudas de pago.</span>
          <span className="soporte-canal-accion">
            Escribir ahora
            <FontAwesomeIcon
              icon={faArrowUpRightFromSquare}
              aria-hidden="true"
            />
          </span>
        </a>

        <a
          className="soporte-canal"
          href={INSTAGRAM}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="soporte-canal-icono" aria-hidden="true">
            <FontAwesomeIcon icon={faInstagram} />
          </span>
          <strong>Instagram</strong>
          <span>Novedades, lanzamientos y atención por mensaje directo.</span>
          <span className="soporte-canal-accion">
            @bygiostore.co
            <FontAwesomeIcon
              icon={faArrowUpRightFromSquare}
              aria-hidden="true"
            />
          </span>
        </a>

        <Link className="soporte-canal" to="/terminos">
          <span className="soporte-canal-icono" aria-hidden="true">
            <FontAwesomeIcon icon={faFileContract} />
          </span>
          <strong>Términos y condiciones</strong>
          <span>Envíos, pagos, cambios y garantía de tus compras.</span>
          <span className="soporte-canal-accion">Leer</span>
        </Link>

        <Link className="soporte-canal" to="/privacidad">
          <span className="soporte-canal-icono" aria-hidden="true">
            <FontAwesomeIcon icon={faShieldHalved} />
          </span>
          <strong>Política de privacidad</strong>
          <span>Cómo tratamos y protegemos tus datos personales.</span>
          <span className="soporte-canal-accion">Leer</span>
        </Link>
      </div>

      <section className="soporte-faq" aria-labelledby="soporte-faq-titulo">
        <h2 className="soporte-subtitulo" id="soporte-faq-titulo">
          <FontAwesomeIcon icon={faCircleQuestion} aria-hidden="true" />
          Preguntas frecuentes
        </h2>

        <div className="soporte-lista">
          {PREGUNTAS.map((item) => (
            <details className="soporte-item" key={item.pregunta}>
              <summary className="soporte-pregunta">{item.pregunta}</summary>
              <p className="soporte-respuesta parrafos">{item.respuesta}</p>
            </details>
          ))}
        </div>
      </section>
    </section>
  );
};

export default Soporte;
