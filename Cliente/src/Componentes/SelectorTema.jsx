import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { useTema } from "../tema/TemaProvider";

/*
 * Botón de cambio de tema claro/oscuro.
 * Es un control accesible: aria-pressed indica el estado actual.
 * Los dos iconos viven apilados y se intercambian con la receta
 * icon-swap (estilos/movimiento.css): el que sale se encoge y se
 * desenfoca mientras el que entra aparece.
 */
const SelectorTema = ({ className = "" }) => {
  const { esOscuro, alternarTema } = useTema();

  return (
    <button
      type="button"
      className={`btn-tema-toggle ${className}`.trim()}
      onClick={alternarTema}
      aria-pressed={esOscuro}
      aria-label={esOscuro ? "Activar tema claro" : "Activar tema oscuro"}
      title={esOscuro ? "Tema claro" : "Tema oscuro"}
    >
      <span
        className="icono-intercambio"
        data-estado={esOscuro ? "b" : "a"}
        aria-hidden="true"
      >
        <FontAwesomeIcon icon={faMoon} data-icono="a" />
        <FontAwesomeIcon icon={faSun} data-icono="b" />
      </span>
    </button>
  );
};

export default SelectorTema;
