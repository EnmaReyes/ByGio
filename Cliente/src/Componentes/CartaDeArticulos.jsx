import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useContextProvaider } from "../context/ContextProvaider.jsx";
import RejillaProductos from "./RejillaProductos";
import RejillaEsqueleto from "./RejillaEsqueleto";

const EstadoCarga = () => <RejillaEsqueleto mensaje="Cargando productos…" />;

const EstadoVacio = ({ mensaje }) => (
  <div className="estado">
    <p className="estado-texto">{mensaje}</p>
  </div>
);

const EncabezadoSeccion = ({
  etiqueta,
  titulo,
  descripcion,
  verTodos,
  idTitulo,
}) => {
  if (!titulo && !descripcion && !verTodos) return null;

  return (
    <div className="seccion-cabecera">
      <div>
        {etiqueta && <span className="etiqueta-seccion">{etiqueta}</span>}
        {titulo && (
          <h2 id={idTitulo} className="titulo-seccion">
            {titulo}
          </h2>
        )}
        {descripcion && <p className="texto-seccion">{descripcion}</p>}
      </div>

      {verTodos && (
        <Link to="/productos" className="enlace-seccion">
          Ver todos
        </Link>
      )}
    </div>
  );
};

/*
 * Sección reutilizable de artículos.
 * - Sin `articulos`: muestra los artículos sin precio anterior (catálogo).
 * - `limite`: recorta la cantidad mostrada.
 * - `verTodos`: añade el enlace al catálogo completo.
 */
export const CartaDeArticulos = ({
  articulos: articulosPropios,
  titulo = "",
  descripcion = "",
  etiqueta = "",
  limite,
  verTodos = false,
  vacio = "Todavía no hay productos disponibles.",
  id,
}) => {
  const { articulos, loadingArticulos } = useContextProvaider();

  const lista = useMemo(() => {
    const base =
      articulosPropios ?? articulos.filter((articulo) => !(articulo.descuento > 0));
    return typeof limite === "number" ? base.slice(0, limite) : base;
  }, [articulosPropios, articulos, limite]);

  const idTitulo = id ? `${id}-titulo` : undefined;

  return (
    <section className="seccion" id={id} aria-labelledby={idTitulo}>
      <div className="contenedor">
        <EncabezadoSeccion
          etiqueta={etiqueta}
          titulo={titulo}
          descripcion={descripcion}
          verTodos={verTodos}
          idTitulo={idTitulo}
        />

        {loadingArticulos && lista.length === 0 ? (
          <EstadoCarga />
        ) : lista.length === 0 ? (
          <EstadoVacio mensaje={vacio} />
        ) : (
          <RejillaProductos articulos={lista} />
        )}
      </div>
    </section>
  );
};

/* Artículos con precio anterior (ofertas). Se mantiene la exportación. */
export const ArtiulosOferta = ({ limite } = {}) => {
  const { articulos, loadingArticulos } = useContextProvaider();

  const ofertas = useMemo(() => {
    const lista = articulos.filter((articulo) => articulo.descuento > 0);
    return typeof limite === "number" ? lista.slice(0, limite) : lista;
  }, [articulos, limite]);

  if (!loadingArticulos && ofertas.length === 0) return null;

  return (
    <section className="seccion" aria-labelledby="ofertas-titulo">
      <div className="contenedor">
        <div className="seccion-cabecera">
          <div>
            <span className="etiqueta-seccion">Promociones</span>
            <h2 id="ofertas-titulo" className="titulo-seccion">
              Ofertas
            </h2>
            <p className="texto-seccion">
              Piezas seleccionadas con precio especial, por tiempo limitado.
            </p>
          </div>
        </div>

        {loadingArticulos ? (
          <EstadoCarga />
        ) : (
          <RejillaProductos articulos={ofertas} mostrarDescuento />
        )}
      </div>
    </section>
  );
};

export default CartaDeArticulos;
