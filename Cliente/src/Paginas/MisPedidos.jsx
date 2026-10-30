import { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";
import { AuthContext } from "../context/authContext";
import { formatPrice } from "../Componentes/cartUtils";
import {
  formatDateTime,
  getApiErrorMessage,
  getOrderStatusMeta,
  PAYMENT_STATUS_LABELS,
} from "../Componentes/orderUtils";
import "./pedidos.css";

const LIMIT = 10;

// Agrupación de estados para "diferenciar" los pedidos en la vista.
// `status` es la lista que entiende el endpoint (coma-separada).
const FILTROS = [
  { id: "todos", label: "Todos", status: "" },
  { id: "proceso", label: "En proceso", status: "pendiente_pago,pagado,en_preparacion" },
  { id: "enviados", label: "Enviados", status: "enviado" },
  { id: "completados", label: "Completados", status: "entregado" },
  { id: "cancelados", label: "Cancelados", status: "cancelado" },
];

// Cabecera de pagina del sistema de diseno (misma pieza que /productos).
const PageHero = ({ title, subtitle }) => (
  <header className="catalogo-hero">
    <div className="contenedor">
      <h1 className="catalogo-hero-titulo">{title}</h1>
      {subtitle && <p className="catalogo-hero-texto">{subtitle}</p>}
    </div>
  </header>
);

const OrdersGate = () => {
  const redirect = encodeURIComponent("/mis-pedidos");

  return (
    <>
      <PageHero
        title="Inicia sesión para ver tus pedidos"
        subtitle="Consulta el estado, el historial y el seguimiento de tus compras."
      />
      <div className="checkout-page">
        <div className="checkout-gate-actions checkout-gate-actions--centrada">
          <Link
            to={`/login?redirect=${redirect}`}
            className="checkout-primary-link"
          >
            Iniciar sesión
          </Link>
          <Link
            to={`/register?redirect=${redirect}`}
            className="checkout-secondary-link"
          >
            Crear cuenta
          </Link>
        </div>
      </div>
    </>
  );
};

const OrderCard = ({ order }) => {
  const status = getOrderStatusMeta(order.status);
  const items = order.items || [];
  const count = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const summary = items
    .map((item) => `${item.quantity}× ${item.title}`)
    .join(" · ");

  return (
    <article className="order-card">
      <header className="order-card-head">
        <div>
          <span className="order-card-number titulos">{order.orderNumber}</span>
          <span className="order-card-date parrafos">
            {formatDateTime(order.createdAt)}
          </span>
        </div>
        <span className={`order-badge ${status.tone}`}>{status.label}</span>
      </header>

      <p className="order-card-items parrafos">{summary}</p>

      <footer className="order-card-foot">
        <div className="order-card-meta">
          <span className="parrafos">
            {count} {count === 1 ? "artículo" : "artículos"} ·{" "}
            {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}
          </span>
          <strong className="titulos">{formatPrice(order.total)}</strong>
        </div>
        <Link
          to={`/mis-pedidos/${order.id}`}
          className="order-card-link titulos"
        >
          Ver detalle
        </Link>
      </footer>
    </article>
  );
};

const MisPedidos = () => {
  const { currentUser } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const filtroActivo = FILTROS.find((opcion) => opcion.id === filtro) || FILTROS[0];

  const load = useCallback(
    async (offset = 0) => {
      const isFirstPage = offset === 0;

      if (isFirstPage) {
        setLoading(true);
        setError("");
      } else {
        setLoadingMore(true);
      }

      try {
        const res = await axios.get(`${API_URL}/api/orders`, {
          params: {
            limit: LIMIT,
            offset,
            ...(filtroActivo.status && { status: filtroActivo.status }),
          },
          withCredentials: true,
        });

        const data = res.data || {};
        const nextOrders = Array.isArray(data.orders) ? data.orders : [];

        setOrders((prev) =>
          isFirstPage ? nextOrders : [...prev, ...nextOrders],
        );
        setTotal(Number(data.total) || 0);
      } catch (err) {
        setError(
          getApiErrorMessage(
            err,
            "No pudimos cargar tus pedidos. Intenta de nuevo.",
          ),
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filtroActivo.status],
  );

  useEffect(() => {
    if (!currentUser) return;
    window.scrollTo(0, 0);
    load(0);
  }, [currentUser, load]);

  if (!currentUser) return <OrdersGate />;

  return (
    <>
      <PageHero
        title="Mis pedidos"
        subtitle="Estos son los pedidos registrados con tu cuenta. La entrega puede tardar hasta 10 días hábiles."
      />

      <div className="checkout-page">
        {!loading && (
          <div className="catalogo-filtros pedidos-filtros">
            <div
              className="filtros-grupo"
              role="group"
              aria-label="Filtrar pedidos por estado"
            >
              {FILTROS.map((opcion) => {
                const activo = filtro === opcion.id;
                return (
                  <button
                    key={opcion.id}
                    type="button"
                    className={`filtro-chip ${activo ? "activo" : ""}`}
                    aria-pressed={activo}
                    onClick={() => setFiltro(opcion.id)}
                  >
                    {opcion.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {loading ? (
          <div className="checkout-loading">
            <span className="cargador" aria-hidden="true" />
            <p className="parrafos">Cargando tus pedidos…</p>
          </div>
        ) : error ? (
          <div className="estado">
            <h2 className="estado-titulo">No pudimos cargar tus pedidos</h2>
            <p className="estado-texto">{error}</p>
            <button
              type="button"
              className="btn-tema btn-tema--contorno"
              onClick={() => load(0)}
            >
              Reintentar
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="estado">
            <h2 className="estado-titulo">
              {filtro === "todos"
                ? "Aún no tienes pedidos"
                : "No hay pedidos con este estado"}
            </h2>
            <p className="estado-texto">
              {filtro === "todos"
                ? "Cuando confirmes tu primera compra aparecerá aquí con su estado y seguimiento."
                : "Prueba con otro estado o vuelve a “Todos” para ver tu historial completo."}
            </p>
            {filtro === "todos" ? (
              <Link to="/" className="checkout-primary-link">
                Ver catálogo
              </Link>
            ) : (
              <button
                type="button"
                className="btn-tema btn-tema--contorno"
                onClick={() => setFiltro("todos")}
              >
                Ver todos
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="orders-list">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>

            {orders.length < total && (
              <div className="orders-more">
                <button
                  type="button"
                  className="btn-tema btn-tema--contorno"
                  onClick={() => load(orders.length)}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Cargando…" : "Cargar más pedidos"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default MisPedidos;
