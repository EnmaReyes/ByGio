import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useContextProvaider } from "../../context/ContextProvaider";
import useEnVista from "../../hooks/useEnVista";
import DtfCard from "./DtfCard";
import DtfEsqueleto from "./DtfEsqueleto";

import "./DtfCategories.css";

/*
 * Catálogo DTF independiente.
 *
 * Reutiliza el patrón visual y funcional del catálogo de productos
 * (/productos): cabecera centrada, filtros en banda horizontal de
 * chips y estado del filtro en la URL. Aquí solo hay categorías de
 * diseños DTF: no se mezclan colecciones de artículos.
 */
const DtfCategories = () => {
  const {
    categories,
    dtf,
    dtfCategory,
    getDtf,
    getDtfByCategory,
    loadingDtf,
    loadingDtfCategory,
  } = useContextProvaider();

  const [parametros, setParametros] = useSearchParams();

  const categoriaId = parametros.get("categoria") || "";

  const [loadError, setLoadError] = useState(false);
  const [categoriaResuelta, setCategoriaResuelta] = useState(null);
  /* Evita el parpadeo de "no hay diseños" mientras el efecto pide
     la lista general (misma estrategia que Productos). */
  const [solicitudGeneral, setSolicitudGeneral] = useState(false);

  const [refRevelar, enVista] = useEnVista();

  const categoryList = useMemo(
    () => (Array.isArray(categories) ? categories : []),
    [categories],
  );

  /*
   * Listado general (sin categoría). getDtf es idempotente y cachea,
   * así que no se duplican peticiones al volver a "Todas".
   */
  useEffect(() => {
    if (categoriaId) return undefined;

    let activo = true;
    setLoadError(false);
    setSolicitudGeneral(true);

    getDtf().catch(() => {
      if (activo) setLoadError(true);
    });

    return () => {
      activo = false;
    };
  }, [categoriaId, getDtf]);

  /*
   * Listado por categoría (cacheado por id en el contexto).
   */
  useEffect(() => {
    if (!categoriaId) {
      setCategoriaResuelta(null);
      return undefined;
    }

    let activo = true;
    setCategoriaResuelta(null);
    setLoadError(false);

    getDtfByCategory(categoriaId)
      .then(() => {
        if (activo) setCategoriaResuelta(categoriaId);
      })
      .catch(() => {
        if (activo) setLoadError(true);
      });

    return () => {
      activo = false;
    };
  }, [categoriaId, getDtfByCategory]);

  const visibleDtf = categoriaId ? dtfCategory : dtf;

  const cargandoCategoria =
    Boolean(categoriaId) && categoriaResuelta !== categoriaId;

  const cargando = categoriaId
    ? loadingDtfCategory || cargandoCategoria
    : loadingDtf || !solicitudGeneral;

  const totalMostrado = Array.isArray(visibleDtf) ? visibleDtf.length : 0;

  const cambiarCategoria = (nuevaCategoria) => {
    const siguientes = new URLSearchParams(parametros);

    if (nuevaCategoria) {
      siguientes.set("categoria", nuevaCategoria);
    } else {
      siguientes.delete("categoria");
    }

    setParametros(siguientes);
  };

  return (
    <div className="catalogo">
      {/* Misma cabecera que el catálogo de productos. */}
      <header className="catalogo-hero">
        <div className="contenedor">
          <h1 className="catalogo-hero-titulo">Crea tu diseño</h1>
          <p className="catalogo-hero-texto">
            Diseños DTF listos para estampar sobre tu camiseta favorita.
            Filtra por categoría y previsualiza cada diseño sobre franela.
          </p>
        </div>
      </header>

      <section
        ref={refRevelar}
        className={`seccion catalogo-contenido revelar${
          enVista ? " is-visible" : ""
        }`}
        aria-labelledby="dtf-titulo"
      >
        <div className="contenedor">
          <div className="catalogo-intro">
            <div>
              <span
                className="etiqueta-seccion revelar-linea"
                style={{ "--i": 0 }}
              >
                Catálogo DTF
              </span>
              <h2
                id="dtf-titulo"
                className="catalogo-titulo revelar-linea"
                style={{ "--i": 1 }}
              >
                Escoge tu diseño
              </h2>
              <p
                className="catalogo-descripcion revelar-linea"
                style={{ "--i": 2 }}
              >
                Selecciona una categoría para ver nuestros diseños
                disponibles.
              </p>
            </div>

            <p
              className="catalogo-conteo revelar-linea"
              style={{ "--i": 3 }}
              aria-live="polite"
            >
              {totalMostrado}{" "}
              {totalMostrado === 1 ? "resultado" : "resultados"}
            </p>
          </div>

          {/* Filtros en banda horizontal, igual que en Productos. */}
          <div className="catalogo-filtros">
            <div
              className="filtros-grupo"
              role="group"
              aria-label="Filtrar diseños por categoría"
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

              {categoryList.map((categoria) => {
                const activa =
                  String(categoria.id) === String(categoriaId);

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
          </div>

          <div className="catalogo-resultados">
            {cargando ? (
              <DtfEsqueleto />
            ) : loadError ? (
              <div className="estado" role="alert">
                <h2 className="estado-titulo">
                  No pudimos cargar los diseños
                </h2>
                <p className="estado-texto">
                  Revisa la conexión con el servidor e inténtalo de nuevo.
                </p>
              </div>
            ) : !Array.isArray(visibleDtf) || visibleDtf.length === 0 ? (
              <div className="estado" role="status">
                <h2 className="estado-titulo">Sin diseños disponibles</h2>
                <p className="estado-texto">
                  {categoriaId
                    ? "No hay diseños disponibles en esta categoría."
                    : "Todavía no hay diseños DTF disponibles."}
                </p>
              </div>
            ) : (
              /*
               * `is-visible` va fijo: la rejilla se monta cuando llegan
               * los datos y la `key` la vuelve a montar al cambiar de
               * categoría para reproducir la entrada escalonada.
               */
              <div
                key={categoriaId || "all"}
                className="dtf-grid rejilla-entrada is-visible"
              >
                <DtfCard items={visibleDtf} />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DtfCategories;