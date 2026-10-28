import { useMemo } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { useContextProvaider } from "../context/ContextProvaider.jsx";
import RejillaProductos from "./RejillaProductos";
import RejillaEsqueleto from "./RejillaEsqueleto";

/*
 * Sección "Destacados".
 * Usa la misma rejilla y las mismas tarjetas que el catálogo (estilo
 * "New Arrivals" de Sabina): hasta 6 piezas marcadas como destacadas.
 * Si no hay ninguna, no se renderiza para no dejar un hueco vacío.
 */
const CartaInicial = () => {
  const { articulos, loadingArticulos } = useContextProvaider();

  const destacados = useMemo(
    () =>
      articulos
        .filter((articulo) => articulo.destacadas === true && !articulo.combo)
        .slice(0, 6),
    [articulos],
  );

  if (!loadingArticulos && destacados.length === 0) {
    return null;
  }

  return (
    <section
      className="seccion destacados"
      id="destacados"
      aria-labelledby="destacados-titulo"
    >
      <div className="contenedor">
        <div className="seccion-cabecera">
          <div>
            <span className="etiqueta-seccion">Selección ByGio</span>
            <h2 id="destacados-titulo" className="titulo-seccion">
              Destacados
            </h2>
            <p className="texto-seccion">
              Las piezas que más nos piden, elegidas para ti.
            </p>
          </div>

          <Link to="/productos" className="enlace-seccion">
            Ver todos
            <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
          </Link>
        </div>

        {loadingArticulos ? (
          <RejillaEsqueleto mensaje="Cargando destacados…" />
        ) : (
          <RejillaProductos articulos={destacados} mostrarDescuento />
        )}
      </div>
    </section>
  );
};

export default CartaInicial;
