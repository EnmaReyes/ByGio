import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Form } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { API_URL } from "../../config";
import { AuthContext } from "../../context/authContext";
import { formatPrice } from "../../Componentes/cartUtils";
import { getApiErrorMessage } from "../../Componentes/orderUtils";
import useEnVista from "../../hooks/useEnVista";
import "../pedidos.css";
import "./admin.css";

const PRICE_FIELDS = [
  { productType: "articulo", tipo: "basico", label: "Artículos · Básico" },
  { productType: "articulo", tipo: "oversize", label: "Artículos · Oversize" },
  { productType: "dtf", tipo: "basico", label: "DTF · Básico" },
  { productType: "dtf", tipo: "oversize", label: "DTF · Oversize" },
];

const priceKey = (productType, tipo) => `${productType}:${tipo}`;

const parseImage = (value) => {
  if (typeof value !== "string") return value?.[0] || "";
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed[0] || "" : value;
  } catch {
    return value;
  }
};

const pricesToMap = (prices) =>
  (prices || []).reduce((acc, price) => {
    acc[priceKey(price.productType, price.tipo)] = {
      precio: String(price.precio ?? ""),
      precioAnterior: String(price.precioAnterior ?? ""),
    };
    return acc;
  }, {});

const AdminPrice = () => {
  const { currentUser } = useContext(AuthContext);
  const isAdmin = Boolean(currentUser?.admin);

  const [items, setItems] = useState([]);
  const [prices, setPrices] = useState({});
  const [initialPrices, setInitialPrices] = useState({});
  const [overrides, setOverrides] = useState({ articulo: 0, dtf: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingStockId, setSavingStockId] = useState(null);
  const [normalizing, setNormalizing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");

  /*
   * El observer se engancha al contenedor exterior porque siempre está
   * montado (también durante la carga). Si se enganchara a las secciones
   * internas, al montar aún no existirían (loading/error) y el efecto,
   * que corre una sola vez, nunca observaría nada: `.revelar-linea`
   * quedaría con opacity 0 aunque los datos ya estuvieran cargados.
   */
  const [refContenido, contenidoEnVista] = useEnVista();

  const applyPricesResponse = useCallback((data) => {
    const map = pricesToMap(data?.prices);
    setPrices(map);
    setInitialPrices(map);
    setOverrides(data?.overrides || { articulo: 0, dtf: 0 });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [pricesRes, dtfRes] = await Promise.all([
        axios.get(`${API_URL}/api/prices`),
        axios.get(`${API_URL}/api/dtf`),
      ]);

      applyPricesResponse(pricesRes.data);
      setItems(Array.isArray(dtfRes.data) ? dtfRes.data : []);
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudieron cargar los precios."));
    } finally {
      setLoading(false);
    }
  }, [applyPricesResponse]);

  useEffect(() => {
    if (!isAdmin) return;
    window.scrollTo(0, 0);
    load();
  }, [isAdmin, load]);

  const changePrice = (productType, tipo, field, value) => {
    const key = priceKey(productType, tipo);
    setPrices((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || { precio: "", precioAnterior: "" }),
        [field]: value,
      },
    }));
  };

  const dirty = useMemo(
    () =>
      PRICE_FIELDS.some(({ productType, tipo }) => {
        const key = priceKey(productType, tipo);
        const current = prices[key] || {};
        const initial = initialPrices[key] || {};
        return (
          String(current.precio ?? "") !== String(initial.precio ?? "") ||
          String(current.precioAnterior ?? "") !==
            String(initial.precioAnterior ?? "")
        );
      }),
    [prices, initialPrices],
  );

  const savePrices = async () => {
    const payload = [];
    let invalid = false;

    PRICE_FIELDS.forEach(({ productType, tipo }) => {
      const key = priceKey(productType, tipo);
      const precio = Number(prices[key]?.precio);
      const precioAnterior = Number(prices[key]?.precioAnterior);

      if (!Number.isInteger(precio) || precio <= 0) {
        invalid = true;
        return;
      }

      if (
        Number.isInteger(precioAnterior) &&
        precioAnterior > 0 &&
        precioAnterior <= precio
      ) {
        invalid = true;
        return;
      }

      payload.push({
        productType,
        tipo,
        precio,
        precioAnterior:
          Number.isInteger(precioAnterior) && precioAnterior > 0
            ? precioAnterior
            : null,
      });
    });

    if (invalid) {
      toast.error(
        "Cada precio debe ser un entero mayor a cero y el precio anterior debe ser mayor al actual.",
      );
      return;
    }

    setSaving(true);

    try {
      const res = await axios.put(
        `${API_URL}/api/prices`,
        { prices: payload },
        { withCredentials: true },
      );

      applyPricesResponse(res.data);
      toast.success("Precios globales actualizados");
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "No se pudieron guardar los precios"),
      );
    } finally {
      setSaving(false);
    }
  };

  const normalizePrices = async () => {
    const confirmed = window.confirm(
      "Esto elimina los precios propios de artículos y DTF. Todos usarán la tarifa global. Los precios de combo se conservan. ¿Continuar?",
    );
    if (!confirmed) return;

    setNormalizing(true);

    try {
      const res = await axios.post(
        `${API_URL}/api/prices/normalize`,
        {},
        { withCredentials: true },
      );

      applyPricesResponse(res.data);
      toast.success(res.data?.message || "Precios normalizados");
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "No se pudieron normalizar los precios"),
      );
    } finally {
      setNormalizing(false);
    }
  };

  const toggleStock = async (dtf) => {
    setSavingStockId(dtf.id);

    try {
      await axios.put(
        `${API_URL}/api/dtf/${dtf.id}`,
        { stock: !dtf.stock },
        { withCredentials: true },
      );

      setItems((prev) =>
        prev.map((item) =>
          item.id === dtf.id ? { ...item, stock: !dtf.stock } : item,
        ),
      );
      toast.success(!dtf.stock ? "Diseño disponible" : "Diseño agotado");
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "No se pudo cambiar la disponibilidad"),
      );
    } finally {
      setSavingStockId(null);
    }
  };

  /*
   * Categorías DTF deducidas de los propios diseños: no hace falta una
   * petición extra y el filtro solo ofrece categorías con contenido.
   * `category` puede llegar como objeto ({ id, name }) o como texto.
   */
  const dtfCategoryOptions = useMemo(() => {
    const mapa = new Map();

    items.forEach((dtf) => {
      const raw = dtf.category;
      const id = typeof raw === "object" && raw !== null ? raw.id : raw;
      const nombre = typeof raw === "object" && raw !== null ? raw.name : raw;

      if (id === undefined || id === null || id === "") return;

      const clave = String(id);
      if (!mapa.has(clave)) {
        mapa.set(clave, { id: clave, nombre: nombre || "Sin categoría" });
      }
    });

    return Array.from(mapa.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es"),
    );
  }, [items]);

  useEffect(() => {
    if (categoryFilter === "all") return;
    const sigueExistiendo = dtfCategoryOptions.some(
      (categoria) => categoria.id === categoryFilter,
    );
    if (!sigueExistiendo) setCategoryFilter("all");
  }, [dtfCategoryOptions, categoryFilter]);

  const itemsVisibles = useMemo(() => {
    if (categoryFilter === "all") return items;

    return items.filter((dtf) => {
      const raw = dtf.category;
      const id = typeof raw === "object" && raw !== null ? raw.id : raw;
      return String(id) === categoryFilter;
    });
  }, [items, categoryFilter]);

  if (!isAdmin) {
    return (
      <>
        <header className="catalogo-hero">
          <div className="contenedor">
            <h1 className="catalogo-hero-titulo">Acceso restringido</h1>
            <p className="catalogo-hero-texto">
              Esta sección es solo para administradores de ByGio.
            </p>
          </div>
        </header>
        <div className="checkout-page">
          <div className="checkout-gate-actions checkout-gate-actions--centrada">
            <Link to="/" className="checkout-primary-link">
              Volver al inicio
            </Link>
          </div>
        </div>
      </>
    );
  }

  const totalOverrides =
    Number(overrides.articulo || 0) + Number(overrides.dtf || 0);

  return (
    <>
      <header className="catalogo-hero">
        <div className="contenedor">
          <h1 className="catalogo-hero-titulo">Precios globales</h1>
          <p className="catalogo-hero-texto">
            Cambia una sola vez el precio de todos los artículos y diseños DTF.
            Los pedidos ya creados conservan el precio con el que se vendieron.
          </p>
        </div>
      </header>

      <div
        ref={refContenido}
        className={`checkout-page admin-page revelar${
          contenidoEnVista ? " is-visible" : ""
        }`}
      >
        {loading ? (
          <div className="checkout-loading">
            <span className="cargador" aria-hidden="true" />
            <p className="parrafos">Cargando precios…</p>
          </div>
        ) : error ? (
          <div className="estado">
            <h2 className="estado-titulo">No pudimos cargar los precios</h2>
            <p className="estado-texto">{error}</p>
            <button
              type="button"
              className="btn-tema btn-tema--contorno"
              onClick={load}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            <section className="checkout-card admin-price-card">
              <div
                className="admin-price-head revelar-linea"
                style={{ "--i": 0 }}
              >
                <div>
                  <strong className="titulos">Tarifa global</strong>
                  <p className="parrafos admin-muted">
                    Aplica a todos los productos sin precio propio.
                  </p>
                </div>
              </div>

              <div
                className="admin-price-grid revelar-linea"
                style={{ "--i": 1 }}
              >
                {PRICE_FIELDS.map(({ productType, tipo, label }) => {
                  const key = priceKey(productType, tipo);
                  const value = prices[key]?.precio ?? "";
                  const previous = prices[key]?.precioAnterior ?? "";

                  return (
                    <article key={key} className="admin-price-card">
                      <strong className="parrafos">{label}</strong>

                      <div className="admin-price-fields">
                        <Form.Group controlId={`${key}-precio`}>
                          <Form.Label className="parrafos">
                            Precio actual
                          </Form.Label>
                          <Form.Control
                            type="number"
                            min="0"
                            step="500"
                            inputMode="numeric"
                            value={value}
                            onChange={(event) =>
                              changePrice(
                                productType,
                                tipo,
                                "precio",
                                event.target.value,
                              )
                            }
                            isInvalid={!(Number(value) > 0)}
                          />
                          <Form.Control.Feedback type="invalid">
                            Precio inválido
                          </Form.Control.Feedback>
                          <span className="parrafos admin-muted">
                            {formatPrice(Number(value) || 0)}
                          </span>
                        </Form.Group>

                        <Form.Group controlId={`${key}-anterior`}>
                          <Form.Label className="parrafos">
                            Precio anterior
                          </Form.Label>
                          <Form.Control
                            type="number"
                            min="0"
                            step="500"
                            inputMode="numeric"
                            value={previous}
                            onChange={(event) =>
                              changePrice(
                                productType,
                                tipo,
                                "precioAnterior",
                                event.target.value,
                              )
                            }
                            isInvalid={
                              Number(previous) > 0 &&
                              Number(previous) <= Number(value)
                            }
                          />
                          <Form.Control.Feedback type="invalid">
                            Debe ser mayor al precio actual
                          </Form.Control.Feedback>
                          <span className="parrafos admin-muted">
                            Opcional · {formatPrice(Number(previous) || 0)}
                          </span>
                        </Form.Group>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="admin-price-actions">
                <button
                  type="button"
                  className="btn-tema btn-tema--primario"
                  disabled={saving || !dirty}
                  onClick={savePrices}
                >
                  {saving ? "Guardando…" : "Guardar tarifa global"}
                </button>
              </div>

              <p className="parrafos admin-muted">
                {totalOverrides > 0
                  ? `${totalOverrides} productos tienen un precio propio (${overrides.articulo || 0} artículos, ${overrides.dtf || 0} DTF).`
                  : "Todos los productos usan la tarifa global."}
              </p>

              {totalOverrides > 0 && (
                <div className="admin-price-actions">
                  <button
                    type="button"
                    className="btn-tema btn-tema--contorno"
                    disabled={normalizing}
                    onClick={normalizePrices}
                  >
                    {normalizing
                      ? "Normalizando…"
                      : "Aplicar tarifa global a todos"}
                  </button>
                </div>
              )}
            </section>

            <section className="admin-page">
              <h2
                className="titulo-seccion mb-3 revelar-linea"
                style={{ "--i": 0 }}
              >
                Disponibilidad de diseños
              </h2>

              {items.length === 0 ? (
                <div className="estado revelar-linea" style={{ "--i": 1 }}>
                  <h2 className="estado-titulo">Todavía no hay diseños DTF</h2>
                  <p className="estado-texto">
                    Crea un diseño desde “Crear DTF” para publicarlo en el
                    catálogo.
                  </p>
                </div>
              ) : (
                <div className="revelar-linea" style={{ "--i": 1 }}>
                  {/* Filtro por categoría DTF: solo aparecen categorías con diseños. */}
                  {dtfCategoryOptions.length > 0 && (
                    <div className="catalogo-filtros admin-price-filtros">
                      <div
                        className="filtros-grupo"
                        role="group"
                        aria-label="Filtrar diseños por categoría DTF"
                      >
                        <span className="filtros-etiqueta">Categoría</span>

                        <button
                          type="button"
                          className={`filtro-chip ${
                            categoryFilter === "all" ? "activo" : ""
                          }`}
                          aria-pressed={categoryFilter === "all"}
                          onClick={() => setCategoryFilter("all")}
                        >
                          Todas
                        </button>

                        {dtfCategoryOptions.map((categoria) => {
                          const activa = categoryFilter === categoria.id;
                          return (
                            <button
                              key={categoria.id}
                              type="button"
                              className={`filtro-chip ${
                                activa ? "activo" : ""
                              }`}
                              aria-pressed={activa}
                              onClick={() => setCategoryFilter(categoria.id)}
                            >
                              {categoria.nombre}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {itemsVisibles.length === 0 ? (
                    <div className="estado">
                      <h2 className="estado-titulo">
                        Sin diseños en esta categoría
                      </h2>
                      <p className="estado-texto">
                        Elige otra categoría o vuelve a “Todas” para ver todos
                        los diseños.
                      </p>
                    </div>
                  ) : (
                    <div className="admin-price-grid">
                      {itemsVisibles.map((dtf) => {
                        const image = parseImage(dtf.img);
                        const category =
                          typeof dtf.category === "string"
                            ? dtf.category
                            : dtf.category?.name || "Sin categoría";
                        const savingStock = savingStockId === dtf.id;

                        return (
                          <article
                            key={dtf.id}
                            className="checkout-card admin-price-card"
                          >
                            <div className="admin-price-head">
                              {image ? (
                                <img
                                  src={image}
                                  alt=""
                                  className="admin-price-image"
                                />
                              ) : (
                                <div className="admin-price-image admin-price-image-empty" />
                              )}
                              <div>
                                <strong className="parrafos">{category}</strong>
                                <span
                                  className={`order-badge ${
                                    dtf.stock === false ? "cancelled" : "paid"
                                  }`}
                                >
                                  {dtf.stock === false
                                    ? "Agotado"
                                    : "Disponible"}
                                </span>
                              </div>
                            </div>

                            <div className="admin-price-actions">
                              <button
                                type="button"
                                className="btn-tema btn-tema--contorno"
                                disabled={savingStock}
                                onClick={() => toggleStock(dtf)}
                              >
                                {savingStock
                                  ? "Guardando…"
                                  : dtf.stock === false
                                    ? "Marcar disponible"
                                    : "Marcar agotado"}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
};

export default AdminPrice;
