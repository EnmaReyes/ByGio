import { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Form } from "react-bootstrap";
import axios from "axios";
import { API_URL } from "../../config";
import { AuthContext } from "../../context/authContext";
import { formatPrice } from "../../Componentes/cartUtils";
import {
  formatDateTime,
  getApiErrorMessage,
  getOrderStatusMeta,
  ORDER_STATUS_META,
  PAYMENT_STATUS_LABELS,
} from "../../Componentes/orderUtils";
import "../pedidos.css";
import "./admin.css";

const LIMIT = 20;

const STATUS_OPTIONS = Object.keys(ORDER_STATUS_META);
const PAYMENT_OPTIONS = Object.keys(PAYMENT_STATUS_LABELS);

const EMPTY_FILTERS = {
  status: "",
  paymentStatus: "",
  q: "",
  from: "",
  to: "",
};

const AdminGate = () => (
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

const StatsCards = ({ stats }) => {
  if (!stats) return null;

  const pendingPayment = stats.byStatus?.pendiente_pago?.count || 0;
  const toShip =
    (stats.byStatus?.pagado?.count || 0) +
    (stats.byStatus?.en_preparacion?.count || 0);

  return (
    <div className="admin-stats">
      <div className="admin-stat">
        <span className="parrafos">Pedidos hoy</span>
        <strong className="titulos">{stats.ordersToday}</strong>
        <small className="parrafos">{stats.totalOrders} en total</small>
      </div>
      <div className="admin-stat">
        <span className="parrafos">Pendientes de pago</span>
        <strong className="titulos">{pendingPayment}</strong>
        <small className="parrafos">Requieren confirmación</small>
      </div>
      <div className="admin-stat">
        <span className="parrafos">Por despachar</span>
        <strong className="titulos">{toShip}</strong>
        <small className="parrafos">Pagados o en preparación</small>
      </div>
      <div className="admin-stat">
        <span className="parrafos">Ingresos aprobados</span>
        <strong className="titulos">{formatPrice(stats.approvedRevenue)}</strong>
        <small className="parrafos">Pagos confirmados</small>
      </div>
    </div>
  );
};

const OrderRow = ({ order }) => {
  const status = getOrderStatusMeta(order.status);
  const items = order.items || [];
  const count = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const customer = order.user
    ? order.user.username || order.user.email
    : order.email;

  return (
    <tr>
      <td>
        <Link to={`/admin/pedidos/${order.id}`} className="admin-link titulos">
          {order.orderNumber}
        </Link>
        <small className="parrafos admin-muted">
          {count} {count === 1 ? "artículo" : "artículos"}
        </small>
      </td>
      <td className="parrafos admin-nowrap">{formatDateTime(order.createdAt)}</td>
      <td className="parrafos">
        {order.recipientName}
        <small className="parrafos admin-muted">{customer}</small>
      </td>
      <td>
        <span className={`order-badge ${status.tone}`}>{status.label}</span>
      </td>
      <td className="parrafos">
        {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}
      </td>
      <td className="parrafos admin-nowrap">
        <strong>{formatPrice(order.total)}</strong>
      </td>
      <td>
        <Link
          to={`/admin/pedidos/${order.id}`}
          className="admin-table-link titulos"
        >
          Abrir
        </Link>
      </td>
    </tr>
  );
};

const AdminPedidos = () => {
  const { currentUser } = useContext(AuthContext);
  const isAdmin = Boolean(currentUser?.admin);

  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchTerm, setSearchTerm] = useState("");

  // Debounce del buscador para no consultar en cada tecla.
  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(filters.q.trim()), 400);
    return () => clearTimeout(timer);
  }, [filters.q]);

  const loadOrders = useCallback(
    async ({ offset = 0 } = {}) => {
      const firstPage = offset === 0;
      if (firstPage) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError("");

      try {
        const res = await axios.get(`${API_URL}/api/admin/orders`, {
          params: {
            limit: LIMIT,
            offset,
            ...(filters.status && { status: filters.status }),
            ...(filters.paymentStatus && {
              paymentStatus: filters.paymentStatus,
            }),
            ...(searchTerm && { q: searchTerm }),
            ...(filters.from && { from: filters.from }),
            ...(filters.to && { to: filters.to }),
          },
          withCredentials: true,
        });

        const data = res.data || {};
        const next = Array.isArray(data.orders) ? data.orders : [];

        setOrders((prev) => (firstPage ? next : [...prev, ...next]));
        setTotal(Number(data.total) || 0);
      } catch (err) {
        setError(
          getApiErrorMessage(err, "No se pudieron cargar los pedidos."),
        );
        if (firstPage) setOrders([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters.status, filters.paymentStatus, filters.from, filters.to, searchTerm],
  );

  useEffect(() => {
    if (!isAdmin) return;

    loadOrders({ offset: 0 });
  }, [isAdmin, loadOrders]);

  useEffect(() => {
    if (!isAdmin) return;

    axios
      .get(`${API_URL}/api/admin/orders/stats`, { withCredentials: true })
      .then((res) => setStats(res.data))
      .catch((err) => {
        console.error("No se pudo cargar el resumen:", err);
      });
  }, [isAdmin]);

  if (!isAdmin) return <AdminGate />;

  const updateFilter = (field) => (event) => {
    setFilters((prev) => ({ ...prev, [field]: event.target.value }));
  };

  return (
    <>
      <header className="catalogo-hero">
        <div className="contenedor">
          <h1 className="catalogo-hero-titulo">Pedidos</h1>
          <p className="catalogo-hero-texto">
            Revisa, confirma pagos y actualiza el envío de cada pedido.
          </p>
        </div>
      </header>

      <div className="checkout-page admin-page">
        <StatsCards stats={stats} />

      <section className="checkout-card admin-filters">
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            loadOrders({ offset: 0 });
          }}
        >
          <div className="admin-filters-grid">
            <Form.Group controlId="adminSearch">
              <Form.Label className="parrafos">Buscar</Form.Label>
              <Form.Control
                placeholder="Pedido, nombre, correo o teléfono"
                value={filters.q}
                onChange={updateFilter("q")}
              />
            </Form.Group>

            <Form.Group controlId="adminStatus">
              <Form.Label className="parrafos">Estado</Form.Label>
              <Form.Select
                value={filters.status}
                onChange={updateFilter("status")}
              >
                <option value="">Todos</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {ORDER_STATUS_META[status].label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group controlId="adminPaymentStatus">
              <Form.Label className="parrafos">Pago</Form.Label>
              <Form.Select
                value={filters.paymentStatus}
                onChange={updateFilter("paymentStatus")}
              >
                <option value="">Todos</option>
                {PAYMENT_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {PAYMENT_STATUS_LABELS[status]}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group controlId="adminFrom">
              <Form.Label className="parrafos">Desde</Form.Label>
              <Form.Control
                type="date"
                value={filters.from}
                onChange={updateFilter("from")}
              />
            </Form.Group>

            <Form.Group controlId="adminTo">
              <Form.Label className="parrafos">Hasta</Form.Label>
              <Form.Control
                type="date"
                value={filters.to}
                onChange={updateFilter("to")}
              />
            </Form.Group>
          </div>

          <div className="admin-filters-actions">
            <button
              type="submit"
              className="btn-tema btn-tema--primario"
            >
              Filtrar
            </button>
            <button
              type="button"
              className="btn-tema btn-tema--contorno"
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              Limpiar
            </button>
            <span className="parrafos admin-muted">
              {total} {total === 1 ? "pedido" : "pedidos"}
            </span>
          </div>
        </Form>
      </section>

      {error && (
        <div className="estado">
          <h2 className="estado-titulo">No se pudieron cargar los pedidos</h2>
          <p className="estado-texto">{error}</p>
          <button
            type="button"
            className="btn-tema btn-tema--contorno"
            onClick={() => loadOrders({ offset: 0 })}
          >
            Reintentar
          </button>
        </div>
      )}

      {!error &&
        (loading ? (
          <div className="checkout-loading">
            <span className="cargador" aria-hidden="true" />
            <p className="parrafos">Cargando pedidos…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="estado">
            <h2 className="estado-titulo">No hay pedidos con esos filtros</h2>
            <p className="estado-texto">
              Prueba con otro estado o limpia los filtros.
            </p>
          </div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="parrafos">Pedido</th>
                    <th className="parrafos">Fecha</th>
                    <th className="parrafos">Cliente</th>
                    <th className="parrafos">Estado</th>
                    <th className="parrafos">Pago</th>
                    <th className="parrafos">Total</th>
                    <th aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <OrderRow key={order.id} order={order} />
                  ))}
                </tbody>
              </table>
            </div>

            {orders.length < total && (
              <div className="orders-more">
                <button
                  type="button"
                  className="btn-tema btn-tema--contorno"
                  disabled={loadingMore}
                  onClick={() => loadOrders({ offset: orders.length })}
                >
                  {loadingMore ? "Cargando…" : "Cargar más"}
                </button>
              </div>
            )}
          </>
        ))}
      </div>
    </>
  );
};

export default AdminPedidos;
