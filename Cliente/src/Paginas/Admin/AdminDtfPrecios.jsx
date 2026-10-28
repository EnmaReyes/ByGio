import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Form } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { API_URL } from "../../config";
import { AuthContext } from "../../context/authContext";
import { formatPrice } from "../../Componentes/cartUtils";
import { getApiErrorMessage } from "../../Componentes/orderUtils";
import "../pedidos.css";
import "./admin.css";

const DTf_LABELS = {
  basico: "Básico",
  oversize: "Oversize",
};

const parseImage = (value) => {
  if (typeof value !== "string") return value?.[0] || "";
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed[0] || "" : value;
  } catch {
    return value;
  }
};

const priceKey = (dtfId, variantId) => `${dtfId}:${variantId}`;

const AdminDtfPrecios = () => {
  const { currentUser } = useContext(AuthContext);
  const isAdmin = Boolean(currentUser?.admin);

  const [items, setItems] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);

  const hydratePrices = (list) => {
    const map = {};
    list.forEach((dtf) => {
      (dtf.priceVariants || []).forEach((variant) => {
        map[priceKey(dtf.id, variant.id)] = String(variant.precio ?? "");
      });
    });
    setPrices(map);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(`${API_URL}/api/dtf`);
      const list = Array.isArray(res.data) ? res.data : [];
      setItems(list);
      hydratePrices(list);
    } catch (err) {
      setError(
        getApiErrorMessage(err, "No se pudieron cargar los diseños DTF."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    window.scrollTo(0, 0);
    load();
  }, [isAdmin, load]);

  const totals = useMemo(() => {
    const count = items.length;
    const missing = items.filter((dtf) =>
      (dtf.priceVariants || []).some(
        (variant) => !(Number(prices[priceKey(dtf.id, variant.id)]) > 0),
      ),
    ).length;

    return { count, missing };
  }, [items, prices]);

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

  const setPrice = (dtfId, variantId, value) => {
    setPrices((prev) => ({
      ...prev,
      [priceKey(dtfId, variantId)]: value,
    }));
  };

  const isDirty = (dtf) =>
    (dtf.priceVariants || []).some(
      (variant) =>
        String(variant.precio) !==
        String(prices[priceKey(dtf.id, variant.id)] ?? ""),
    );

  const savePrices = async (dtf) => {
    const variants = dtf.priceVariants || [];
    const invalid = variants.some((variant) => {
      const value = Number(prices[priceKey(dtf.id, variant.id)]);
      return !Number.isFinite(value) || value <= 0;
    });

    if (invalid) {
      toast.error("Cada variante necesita un precio mayor a cero");
      return;
    }

    setSavingId(dtf.id);

    try {
      await axios.put(
        `${API_URL}/api/dtf/${dtf.id}`,
        {
          priceVariants: variants.map((variant) => ({
            id: variant.id,
            tipo: variant.tipo,
            precio: Number(prices[priceKey(dtf.id, variant.id)]),
            medidas: variant.medidas,
            color: variant.color,
            activo: variant.activo,
          })),
        },
        { withCredentials: true },
      );

      setItems((prev) =>
        prev.map((item) =>
          item.id === dtf.id
            ? {
                ...item,
                priceVariants: item.priceVariants.map((variant) => ({
                  ...variant,
                  precio: Number(prices[priceKey(dtf.id, variant.id)]),
                })),
              }
            : item,
        ),
      );
      toast.success("Precios actualizados");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "No se pudieron guardar los precios"));
    } finally {
      setSavingId(null);
    }
  };

  const toggleStock = async (dtf) => {
    setSavingId(dtf.id);

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
      setSavingId(null);
    }
  };

  return (
    <>
      <header className="catalogo-hero">
        <div className="contenedor">
          <h1 className="catalogo-hero-titulo">Precios DTF</h1>
          <p className="catalogo-hero-texto">
            Ajusta el precio de cada tamaño y la disponibilidad de los diseños.
            Los cambios aplican de inmediato en el catálogo y el checkout.
          </p>
        </div>
      </header>

      <div className="checkout-page admin-page">
        {!loading && !error && (
        <p className="parrafos admin-muted">
          {totals.count} {totals.count === 1 ? "diseño" : "diseños"}
          {totals.missing > 0
            ? ` · ${totals.missing} sin precio completo`
            : " · todos con precio configurado"}
        </p>
      )}

      {loading ? (
        <div className="checkout-loading">
          <span className="cargador" aria-hidden="true" />
          <p className="parrafos">Cargando diseños…</p>
        </div>
      ) : error ? (
        <div className="estado">
          <h2 className="estado-titulo">No pudimos cargar los diseños</h2>
          <p className="estado-texto">{error}</p>
          <button
            type="button"
            className="btn-tema btn-tema--contorno"
            onClick={load}
          >
            Reintentar
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="estado">
          <h2 className="estado-titulo">Todavía no hay diseños DTF</h2>
          <p className="estado-texto">
            Crea un diseño desde “Crear DTF” para configurar sus precios.
          </p>
        </div>
      ) : (
        <div className="admin-price-grid">
          {items.map((dtf) => {
            const image = parseImage(dtf.img);
            const category =
              typeof dtf.category === "string"
                ? dtf.category
                : dtf.category?.name || "Sin categoría";
            const variants = dtf.priceVariants || [];
            const dirty = isDirty(dtf);
            const saving = savingId === dtf.id;

            return (
              <article key={dtf.id} className="checkout-card admin-price-card">
                <div className="admin-price-head">
                  {image ? (
                    <img src={image} alt="" className="admin-price-image" />
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
                      {dtf.stock === false ? "Agotado" : "Disponible"}
                    </span>
                  </div>
                </div>

                {variants.length === 0 ? (
                  <p className="checkout-help parrafos">
                    Este diseño no tiene variantes de precio.
                  </p>
                ) : (
                  <div className="admin-price-fields">
                    {variants
                      .slice()
                      .sort((a, b) => a.tipo.localeCompare(b.tipo))
                      .map((variant) => {
                        const key = priceKey(dtf.id, variant.id);
                        const value = prices[key] ?? "";

                        return (
                          <Form.Group key={variant.id} controlId={key}>
                            <Form.Label className="parrafos">
                              {DTf_LABELS[variant.tipo] || variant.tipo}
                            </Form.Label>
                            <Form.Control
                              type="number"
                              min="0"
                              step="500"
                              inputMode="numeric"
                              value={value}
                              onChange={(event) =>
                                setPrice(dtf.id, variant.id, event.target.value)
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
                        );
                      })}
                  </div>
                )}

                <div className="admin-price-actions">
                  <button
                    type="button"
                    className="btn-tema btn-tema--primario"
                    disabled={saving || !dirty}
                    onClick={() => savePrices(dtf)}
                  >
                    {saving ? "Guardando…" : "Guardar precios"}
                  </button>
                  <button
                    type="button"
                    className="btn-tema btn-tema--contorno"
                    disabled={saving}
                    onClick={() => toggleStock(dtf)}
                  >
                    {dtf.stock === false ? "Marcar disponible" : "Marcar agotado"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      </div>
    </>
  );
};

export default AdminDtfPrecios;
