import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeadset,
  faShieldHalved,
  faTruckFast,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import useEnVista from "../hooks/useEnVista";

/*
 * Banda de beneficios: franja de cierre antes del pie (la misma
 * pieza de Sabina). Cuatro apoyos reales de ByGio, no promesas
 * genéricas.
 *
 * Entrada: `.rejilla-entrada` escalona las cuatro columnas cuando
 * la franja entra en pantalla; sin observador, entran de una.
 */
const BENEFICIOS = [
  {
    icono: faTruckFast,
    titulo: "Envío nacional",
    texto: "Despachamos a toda Colombia",
  },
  {
    icono: faHeadset,
    titulo: "Atención directa",
    texto: "Te respondemos por WhatsApp",
  },
  {
    icono: faWandMagicSparkles,
    titulo: "Diseño DTF",
    texto: "Sube tu diseño y lo preparamos",
  },
  {
    icono: faShieldHalved,
    titulo: "Compra segura",
    texto: "Tus datos, protegidos",
  },
];

const BandaBeneficios = () => {
  const [ref, enVista] = useEnVista();

  return (
    <section className="banda-beneficios" aria-labelledby="banda-beneficios-titulo">
      <h2 id="banda-beneficios-titulo" className="solo-lector">
        Beneficios de comprar en ByGio
      </h2>

      <ul
        ref={ref}
        className={`contenedor banda-beneficios-lista rejilla-entrada${
          enVista ? " is-visible" : ""
        }`}
      >
        {BENEFICIOS.map((beneficio, indice) => (
          <li
            key={beneficio.titulo}
            className="banda-beneficios-item"
            style={{ "--i": indice }}
          >
            <FontAwesomeIcon icon={beneficio.icono} aria-hidden="true" />
            <strong>{beneficio.titulo}</strong>
            <span>{beneficio.texto}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default BandaBeneficios;
