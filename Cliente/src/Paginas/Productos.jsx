import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useContextProvaider } from "../context/ContextProvaider.jsx";
import RejillaProductos from "../Componentes/RejillaProductos";
import RejillaEsqueleto from "../Componentes/RejillaEsqueleto";
import DtfCard from "./DTF/DtfCard";
import "./DTF/DtfCategories.css";

const COLECCIONES = [
  { id: "todas", etiqueta: "Todas" },
  { id: "basicas", etiqueta: "Básicas" },
  { id: "oversize", etiqueta: "Oversize" },
  { id: "dtf", etiqueta: "DTF" },
];

const IDS_COLECCION = COLECCIONES.map((coleccion) => coleccion.id);

const normalizarColeccion = (valor) =>
  IDS_COLECCION.includes(valor) ? valor : "todas";

const TEXTOS = {
  todas: {
    etiqueta: "Catálogo",
    titulo: "Todos los productos",
    descripcion:
      "Camisetas básicas y oversize de ByGio. Filtra por colección para encontrar tu próxima pieza favorita.",
  },
  basicas: {
    etiqueta: "Colección 01",
    titulo: "Básicas",
    descripcion:
      "Cortes clásicos y cómodos para el día a día. Disponibles en varias tallas.",
  },
  oversize: {
    etiqueta: "Colección 02",
    titulo: "Oversize",
    descripcion:
      "Silueta amplia y caída relajada. Una sola talla pensada para quedar holgada.",
  },
  dtf: {
    etiqueta: "Colección 03",
    titulo: "Diseños DTF",
    descripcion:
      "Diseños listos para estampar sobre tu camiseta favorita. Elige una categoría para ver los disponibles.",
  },
};

const Cargando = ({ mensaje }) => (
  <div className="estado" role="status" aria-live="polite">
    <span className="cargador" aria-hidden="true" />
    <p className="estado-texto">{mensaje}</p>
  </div>
);

const Vacio = ({ mensaje }) => (
  <div className="estado" role="status">
    <p className="estado-texto">{mensaje}</p>
  </div>
);

const ErrorCarga = () => (
  <div className="estado" role="alert">
    <h2 className="estado-titulo">No pudimos cargar los diseños</h2>
    <p className="estado-texto">
      Revisa la conexión con el servidor e inténtalo de nuevo.
    </p>
  </div>
);

const Productos = () => {
  const [parametros, setParametros] = useSearchParams();

  const coleccion = normalizarColeccion(parametros.get("coleccion"));
  const categoriaId = parametros.get("categoria") || "";

  const {
    articulos,
    dtf,
    dtfCategory,
    categories,
    getDtf,
    getDtfByCategory,
    loadingArticulos,
    loadingDtf,
    loadingDtfCategory,
  } = useContextProvaider();

  const [errorDtf, setErrorDtf] = useState(false);
  const [categoriaResuelta, setCategoriaResuelta] = useState(null);
  /* Evita el parpadeo de "no hay diseños": mientras el efecto no haya
     pedido la lista general, la tratamos como carga en curso. */
  const [solicitudDtf, setSolicitudDtf] = useState(false);

  /*
   * Carga de DTF:
   * - Sin categoría seleccionada -> listado general (getDtf, cacheado).
   * - Con categoría -> getDtfByCategory (también cacheado por id).
   * No se duplican peticiones: ambas funciones del contexto son idempotentes.
   */
  useEffect(() => {
    if (coleccion !== "dtf" || categoriaId) return undefined;

    let activo = true;
    setErrorDtf(false);
    setSolicitudDtf(true);

    getDtf().catch(() => {
      if (activo) setErrorDtf(true);
    });

    return () => {
      activo = false;
    };
  }, [coleccion, categoriaId, getDtf]);

  useEffect(() => {
    if (coleccion !== "dtf" || !categoriaId) {
      setCategoriaResuelta(null);
      return undefined;
    }

    let activo = true;
    setCategoriaResuelta(null);
    setErrorDtf(false);

    getDtfByCategory(categoriaId)
      .then(() => {
        if (activo) setCategoriaResuelta(categoriaId);
      })
      .catch(() => {
        if (activo) setErrorDtf(true);
      });

    return () => {
      activo = false;
    };
  }, [coleccion, categoriaId, getDtfByCategory]);

  const articulosFiltrados = useMemo(() => {
    if (coleccion === "basicas") {
      return articulos.filter((articulo) => !articulo.oversize);
    }
    if (coleccion === "oversize") {
      return articulos.filter((articulo) => articulo.oversize);
    }
    return articulos;
  }, [articulos, coleccion]);

  const disenosVisibles = categoriaId ? dtfCategory : dtf;

  const cargandoCategoria =
    Boolean(categoriaId) && categoriaResuelta !== categoriaId;

  const cargando =
    coleccion === "dtf"
      ? categoriaId
        ? loadingDtfCategory || cargandoCategoria
        : loadingDtf || !solicitudDtf
      : loadingArticulos;

  const totalMostrado =
    coleccion === "dtf"
      ? Array.isArray(disenosVisibles)
        ? disenosVisibles.length
        : 0
      : articulosFiltrados.length;

  const cambiarColeccion = (nuevaColeccion) => {
    const siguientes = new URLSearchParams(parametros);
    siguientes.set("coleccion", nuevaColeccion);
    // Al cambiar de colección se limpia la categoría DTF.
    siguientes.delete("categoria");
    setParametros(siguientes);
  };

  const cambiarCategoria = (nuevaCategoria) => {
    const siguientes = new URLSearchParams(parametros);
    siguientes.set("coleccion", "dtf");
    if (nuevaCategoria) {
      siguientes.set("categoria", nuevaCategoria);
    } else {
      siguientes.delete("categoria");
    }
    setParametros(siguientes);
  };

  const texto = TEXTOS[coleccion];
  const tituloId = "productos-titulo";

  const renderizarResultados = () => {
    if (coleccion === "dtf") {
      if (errorDtf) return <ErrorCarga />;

      if (cargando) {
        return <Cargando mensaje="Cargando diseños…" />;
      }

      if (!Array.isArray(disenosVisibles) || disenosVisibles.length === 0) {
        return (
          <Vacio
            mensaje={
              categoriaId
                ? "No hay diseños disponibles en esta categoría."
                : "Todavía no hay diseños DTF disponibles."
            }
          />
        );
      }

      return (
        <div className="dtf-grid">
          <DtfCard items={disenosVisibles} />
        </div>
      );
    }

    if (cargando) {
      return <RejillaEsqueleto mensaje="Cargando productos…" />;
    }

    if (articulosFiltrados.length === 0) {
      return (
        <Vacio
          mensaje={
            coleccion === "todas"
              ? "Todavía no hay productos disponibles."
              : "Todavía no hay productos en esta colección."
          }
        />
      );
    }

    return <RejillaProductos key={coleccion} articulos={articulosFiltrados} />;
  };

  return (
    <div className="catalogo">
      {/* Cabecera de página titular grande y centrado. */}
      <header className="catalogo-hero">
        <div className="contenedor">
          <h1 className="catalogo-hero-titulo">Hecho para ti</h1>
          <p className="catalogo-hero-texto">
            Básicas, oversize y diseños DTF: ropa cómoda para el día a día y
            piezas para crear las tuyas.
          </p>
        </div>
      </header>

      <section
        className="seccion catalogo-contenido"
        aria-labelledby={tituloId}
      >
        <div className="contenedor">
          <div className="catalogo-intro">
            <div>
              <span className="etiqueta-seccion">{texto.etiqueta}</span>
              <h2 id={tituloId} className="catalogo-titulo">
                {texto.titulo}
              </h2>
              <p className="catalogo-descripcion">{texto.descripcion}</p>
            </div>

            <p className="catalogo-conteo" aria-live="polite">
              {totalMostrado} {totalMostrado === 1 ? "resultado" : "resultados"}
            </p>
          </div>

          {/* Filtros en banda horizontal: el filete inferior los separa
              de la rejilla (nada de columna lateral). */}
          <div className="catalogo-filtros">
            <div
              className="filtros-grupo"
              role="group"
              aria-label="Filtrar por colección"
            >
              <span className="filtros-etiqueta">Colección</span>
              {COLECCIONES.map((opcion) => {
                const activa = coleccion === opcion.id;
                return (
                  <button
                    key={opcion.id}
                    type="button"
                    className={`filtro-chip ${activa ? "activo" : ""}`}
                    aria-pressed={activa}
                    onClick={() => cambiarColeccion(opcion.id)}
                  >
                    {opcion.etiqueta}
                  </button>
                );
              })}
            </div>

            {coleccion === "dtf" && (
              <div
                className="filtros-grupo"
                role="group"
                aria-label="Filtrar por categoría de diseño"
              >
                <span className="filtros-etiqueta">Categoría</span>

                <button
                  type="button"
                  className={`filtro-chip ${!categoriaId ? "activo" : ""}`}
                  aria-pressed={!categoriaId}
                  onClick={() => cambiarCategoria("")}
                >
                  Todas
                </button>

                {Array.isArray(categories) &&
                  categories.map((categoria) => {
                    const activa = String(categoria.id) === String(categoriaId);
                    return (
                      <button
                        key={categoria.id}
                        type="button"
                        className={`filtro-chip ${activa ? "activo" : ""}`}
                        aria-pressed={activa}
                        onClick={() => cambiarCategoria(String(categoria.id))}
                      >
                        {categoria.name}
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          <div className="catalogo-resultados">{renderizarResultados()}</div>
        </div>
      </section>
    </div>
  );
};

export default Productos;
