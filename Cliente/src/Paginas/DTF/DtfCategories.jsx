import { useEffect, useMemo, useRef, useState } from "react";

import { useContextProvaider } from "../../context/ContextProvaider";
import DtfCard from "./DtfCard";

import "./DtfCategories.css";

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

  const [selectedCategory, setSelectedCategory] = useState("");
  const [loadError, setLoadError] = useState(false);
  const initializedRef = useRef(false);

  const categoryList = useMemo(() => {
    return Array.isArray(categories) ? categories : [];
  }, [categories]);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    setSelectedCategory("all");
    setLoadError(false);
    getDtf().catch(() => setLoadError(true));
  }, [getDtf]);

  /*
   * Seleccionar una categoría.
   */
  const handleCategorySelect = async (categoryId) => {
    if (categoryId === selectedCategory) {
      return;
    }

    setSelectedCategory(categoryId);

    setLoadError(false);
    await getDtfByCategory(categoryId).catch(() => setLoadError(true));
  };

  /*
   * Seleccionar todos.
   */
  const handleAllSelect = async () => {
    if (selectedCategory === "all") {
      return;
    }

    setSelectedCategory("all");

    setLoadError(false);
    await getDtf().catch(() => setLoadError(true));
  };

  /*
   * Determinamos qué lista mostrar.
   */
  const visibleDtf = selectedCategory === "all" ? dtf : dtfCategory;

  /*
   * Loading correspondiente a la selección actual.
   */
  const isLoading =
    selectedCategory === "all" ? loadingDtf : loadingDtfCategory;

  return (
    <section className="dtf-categories mt-5">
      <div className="dtf-categories-header">
        <h2 className="titulos">Diseños DTF</h2>

        <p className="parrafos">
          Selecciona una categoría para ver nuestros diseños disponibles.
        </p>
      </div>

      <div className="dtf-category-grid">
        {/* TODOS */}
        <button
          type="button"
          className={`dtf-category-card ${
            selectedCategory === "all" ? "active" : ""
          }`}
          onClick={handleAllSelect}
          aria-pressed={selectedCategory === "all"}
        >
          <div className="dtf-category-content">
            <span className="dtf-category-name bygiotext">Todos</span>
          </div>
        </button>

        {/* CATEGORÍAS */}
        {categoryList.map((category) => {
          const isActive = selectedCategory === category.id;

          return (
            <button
              type="button"
              key={category.id}
              className={`dtf-category-card ${isActive ? "active" : ""}`}
              onClick={() => handleCategorySelect(category.id)}
              aria-pressed={isActive}
            >
              <div className="dtf-category-content">
                <span className="dtf-category-name bygiotext">
                  {category.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* RESULTADOS DTF */}
      <div className="dtf-category-results">
        {isLoading ? (
          <div className="dtf-empty">
            <p className="parrafos">Cargando diseños...</p>
          </div>
        ) : loadError ? (
          <div className="dtf-empty" role="alert">
            <p className="parrafos">
              No se pudieron cargar los diseños. Revisa la conexión con el
              servidor.
            </p>
          </div>
        ) : Array.isArray(visibleDtf) && visibleDtf.length > 0 ? (
          <div className="dtf-grid">
            <DtfCard items={visibleDtf} />
          </div>
        ) : (
          <div className="dtf-empty">
            <p className="parrafos">
              No hay diseños disponibles en esta categoría.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default DtfCategories;
