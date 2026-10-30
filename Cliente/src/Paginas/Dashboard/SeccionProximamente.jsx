import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHourglassHalf } from "@fortawesome/free-solid-svg-icons";

/*
 * Marcador de sección para las áreas del panel que se construyen en las
 * fases siguientes (perfil, notificaciones, soporte, usuarios, ventas,
 * resumen administrativo). Mantiene el panel navegable y honesto con el
 * usuario: no muestra datos falsos, solo un estado "en preparación".
 */
const SeccionProximamente = ({ titulo, descripcion, etiqueta }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="panel-seccion-cabecera">
      <header className="panel-titulo">
        <span className="etiqueta-seccion">{etiqueta || "Panel ByGio"}</span>
        <h1 className="panel-titulo-texto">{titulo}</h1>
        {descripcion && <p className="texto-seccion">{descripcion}</p>}
      </header>

      <div className="estado">
        <span className="panel-proximamente-icono" aria-hidden="true">
          <FontAwesomeIcon icon={faHourglassHalf} />
        </span>
        <h2 className="estado-titulo">Sección en preparación</h2>
        <p className="estado-texto">
          Estamos construyendo esta sección. La verás aquí muy pronto.
        </p>
      </div>
    </section>
  );
};

export default SeccionProximamente;
