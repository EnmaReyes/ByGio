import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useContextProvaider } from "../../context/ContextProvaider.jsx";
import RejillaProductos from "../../Componentes/RejillaProductos";
import RejillaEsqueleto from "../../Componentes/RejillaEsqueleto";

const LIMITE = 4;

/*
 * "También te puede gustar" del detalle de artículo (como en Sabina):
 * la misma rejilla del catálogo con los productos que no son el actual.
 * Las destacadas van primero; el resto conserva el orden del catálogo.
 * Si el catálogo todavía no cargó, se muestra el esqueleto con la
 * geometría real para que el cambio no mueva nada.
 */
const ArticulosSimilares = ({ actualId = "" }) => {
  const { articulos, loadingArticulos } = useContextProvaider();

  const similares = useMemo(() => {
    const otros = articulos.filter(
      (articulo) => String(articulo.id) !== String(actualId),
    );
    const destacadas = otros.filter((articulo) => articulo.destacadas);
    const resto = otros.filter((articulo) => !articulo.destacadas);

    return [...destacadas, ...resto].slice(0, LIMITE);
  }, [articulos, actualId]);

  if (!loadingArticulos && similares.length === 0) return null;

  return (
    <section className="seccion similares" aria-labelledby="similares-titulo">
      <div className="contenedor">
        <div className="seccion-cabecera">
          <div>
            <span className="etiqueta-seccion">Sigue mirando</span>
            <h2 id="similares-titulo" className="titulo-seccion">
              También te puede gustar
            </h2>
            <p className="texto-seccion">
              Otras piezas de la colección que combinan con esta.
            </p>
          </div>

          <Link to="/productos" className="enlace-seccion">
            Ver todos
          </Link>
        </div>

        {loadingArticulos ? (
          <RejillaEsqueleto mensaje="Cargando productos…" cantidad={LIMITE} />
        ) : (
          <RejillaProductos articulos={similares} />
        )}
      </div>
    </section>
  );
};

export default ArticulosSimilares;
