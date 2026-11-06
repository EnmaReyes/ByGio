import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { API_URL } from "../config";
import { AuthContext } from "../context/authContext";
import { DTF_SIZE_LABELS, formatPrice } from "../Componentes/cartUtils";
import {
  formatDate,
  formatDateTime,
  getApiErrorMessage,
  getOrderStatusMeta,
  ORDER_STATUS_FLOW,
  PAYMENT_STATUS_LABELS,
} from "../Componentes/orderUtils";
import { notify } from "../Componentes/toastConfig/toastconfigs";
import {
  notifyOrderUpdated,
  subscribeOrderRefresh,
} from "../Componentes/orderSync";
import "./pedidos.css";

// (La deteccion de cambios de estado se hace en el backend, que crea
// la notificacion correspondiente al cambiar el estado del pedido.)

// Cabecera de pagina del sistema de diseno (misma pieza que /productos).
const PageHero = ({ title, subtitle }) => (
  <header className="catalogo-hero">
    <div className="contenedor">
      <h1 className="catalogo-hero-titulo">{title}</h1>
      {subtitle && <p className="catalogo-hero-texto">{subtitle}</p>}
    </div>
  </header>
);

const itemVariant = (item) => {
  if (item.productType === "dtf") {
    const size =
      DTF_SIZE_LABELS[item.dtfSize] || item.dtfSize || "Tamaño no definido";
    return [item.shirtName && `Franela ${item.shirtName}`, size]
      .filter(Boolean)
      .join(" · ");
  }

  const label = item.oversize
    ? "Talla Over Size"
    : item.size
      ? `Talla ${item.size}`
      : "";
  return [item.productSnapshot?.combo ? "Combo" : "", label]
    .filter(Boolean)
    .join(" · ");
};

const StatusSteps = ({ status }) => {
  const currentIndex = ORDER_STATUS_FLOW.indexOf(status);
  if (currentIndex === -1) return null;

  return (
    <ol className="order-steps">
      {ORDER_STATUS_FLOW.map((step, index) => {
        const meta = getOrderStatusMeta(step);
        const state =
          index < currentIndex
            ? "done"
            : index === currentIndex
              ? "current"
              : "todo";

        return (
          <li key={step} className={`order-step ${state}`}>
            <span className="order-step-dot" aria-hidden="true">
              {index < currentIndex ? "✓" : index + 1}
            </span>
            <span className="parrafos">{meta.label}</span>
          </li>
        );
      })}
    </ol>
  );
};

const PedidoDetalle = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { currentUser } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);
  const verifiedRef = useRef(false);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError("");

      try {
        const res = await axios.get(`${API_URL}/api/orders/${id}`, {
          withCredentials: true,
        });
        setOrder(res.data);
      } catch (err) {
        setError(
          getApiErrorMessage(
            err,
            "No pudimos cargar este pedido. Intenta de nuevo.",
          ),
        );
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    if (!currentUser) return;
    window.scrollTo(0, 0);
    load();
  }, [currentUser, load]);

  // Vuelta desde Wompi: Wompi agrega ?id=<transacción> a la URL de retorno. Se
  // consulta el estado real en el servidor (nunca se confía en los parámetros
  // de la URL) y se recarga el pedido. El webhook sigue siendo la fuente de
  // verdad; esto solo evita que el comprador vea "pendiente" cuando el cobro ya
  // se hizo.
  useEffect(() => {
    if (!currentUser || verifiedRef.current) return;

    const transactionId = searchParams.get("id") || undefined;
    // ?pago=wompi se mantiene por compatibilidad con enlaces antiguos.
    if (!transactionId && searchParams.get("pago") !== "wompi") return;

    verifiedRef.current = true;

    if (!transactionId) {
      load();
      return;
    }

    (async () => {
      try {
        await axios.post(
          `${API_URL}/api/orders/${id}/payment/verify`,
          { transactionId },
          { withCredentials: true },
        );
        toast.success("Actualizamos el estado de tu pago");
        // Avisa a la pestaña del sitio (la que abrió Wompi) para que refresque.
        notifyOrderUpdated(id);
      } catch {
        toast.info("Todavía estamos confirmando tu pago. Actualiza en unos segundos.");
      } finally {
        await load();
      }
    })();
  }, [currentUser, id, load, searchParams]);

  // Refresca el pedido cuando se paga en otra pestaña (pestaña nueva de Wompi) o
  // al recuperar el foco, sin que el usuario tenga que recargar a mano.
  useEffect(() => {
    if (!currentUser || !id) return;

    return subscribeOrderRefresh(id, () => {
      load({ silent: true });
    });
  }, [currentUser, id, load]);

  if (!currentUser) {
    return (
      <>
        <PageHero title="Inicia sesión para ver tu pedido" />
        <div className="checkout-page">
          <div className="checkout-gate-actions checkout-gate-actions--centrada">
            <Link
              to={`/login?redirect=${encodeURIComponent(`/mis-pedidos/${id}`)}`}
              className="checkout-primary-link"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </>
    );
  }

  const cancelOrder = async () => {
    setCancelling(true);

    try {
      await axios.post(
        `${API_URL}/api/orders/${id}/cancel`,
        null,
        { withCredentials: true },
      );
      toast.success("Pedido cancelado");
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "No pudimos cancelar el pedido"));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHero title="Tu pedido" />
        <div className="checkout-page">
          <div className="checkout-loading">
            <span className="cargador" aria-hidden="true" />
            <p className="parrafos">Cargando pedido…</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <PageHero title="Tu pedido" />
        <div className="checkout-page">
          <div className="estado">
            <h2 className="estado-titulo">No pudimos abrir este pedido</h2>
            <p className="estado-texto">{error || "Pedido no encontrado"}</p>
            <div className="checkout-gate-actions">
              <button
                type="button"
                className="btn-tema btn-tema--primario"
                onClick={() => load()}
              >
                Reintentar
              </button>
              <Link to="/mis-pedidos" className="checkout-secondary-link">
                Volver a mis pedidos
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const status = getOrderStatusMeta(order.status);
  const canCancel = order.status === "pendiente_pago";
  const canPay =
    order.status === "pendiente_pago" &&
    ["pendiente", "rechazado", "error"].includes(order.paymentStatus);
  const items = order.items || [];
  const history = order.history || [];

  const payOnline = async () => {
    setPaying(true);

    // Se abre la pestaña en el gesto del usuario (antes del await) para que el
    // bloqueador de ventanas emergentes no la frene.
    const tab = window.open("", "_blank");

    try {
      const res = await axios.post(
        `${API_URL}/api/orders/${id}/payment`,
        null,
        { withCredentials: true },
      );

      // Wompi Web Checkout se abre en una pestaña nueva; esta queda en el sitio.
      if (tab && !tab.closed) {
        tab.opener = null;
        tab.location.href = res.data.url;
      } else {
        // El navegador bloqueó la pestaña: se navega en la actual.
        window.location.href = res.data.url;
      }
    } catch (err) {
      if (tab && !tab.closed) tab.close();
      if (err.response?.status === 503) {
        toast.info(
          "El pago en línea todavía no está disponible. Escríbenos por WhatsApp para coordinar el pago.",
        );
      } else {
        toast.error(
          getApiErrorMessage(err, "No pudimos iniciar el pago en línea"),
        );
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      <PageHero
        title={order.orderNumber}
        subtitle={`Creado el ${formatDateTime(order.createdAt)} · ${
          PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus
        }`}
      />

      <div className="checkout-page">
        <div className="order-detail-head">
          <Link to="/mis-pedidos" className="checkout-back-link parrafos">
            ← Mis pedidos
          </Link>
          <span className={`order-badge ${status.tone}`}>{status.label}</span>
        </div>

      {order.status !== "cancelado" && <StatusSteps status={order.status} />}

      {order.status === "cancelado" && (
        <p className="order-cancelled parrafos">
          Este pedido fue cancelado
          {order.cancelledAt
            ? ` el ${formatDateTime(order.cancelledAt).replace(/\.$/, "")}`
            : ""}
          . Si tienes dudas, escríbenos por WhatsApp.
        </p>
      )}

      <div className="order-detail-grid">
        <section className="checkout-card">
          <h2 className="checkout-section-title titulos">Productos</h2>

          <ul className="checkout-items">
            {items.map((item) => (
              <li key={item.id} className="checkout-item">
                {item.imageUrl && (
                  <div className="checkout-item-image">
                    <img src={item.imageUrl} alt="" />
                  </div>
                )}
                <div className="checkout-item-info">
                  <strong className="parrafos">
                    {item.quantity} × {item.title}
                  </strong>
                  <small className="parrafos">{itemVariant(item)}</small>
                  <small className="parrafos">
                    {formatPrice(item.unitPrice)} c/u
                  </small>
                </div>
                <strong className="checkout-item-total titulos">
                  {formatPrice(item.lineTotal)}
                </strong>
              </li>
            ))}
          </ul>

          <div className="checkout-totals">
            <div className="checkout-total-row parrafos">
              <span>Subtotal</span>
              <strong>{formatPrice(order.subtotal)}</strong>
            </div>
            <div className="checkout-total-row parrafos">
              <span>Envío</span>
              <strong>{formatPrice(order.shippingCost)}</strong>
            </div>
            <div className="checkout-total-row grand titulos">
              <span>Total</span>
              <strong>{formatPrice(order.total)}</strong>
            </div>
          </div>

          {canPay && (
            <button
              type="button"
              className="btn-tema btn-tema--primario order-pay-button"
              disabled={paying}
              onClick={payOnline}
            >
              {paying ? "Abriendo Wompi…" : "Pagar en línea"}
            </button>
          )}

          {canCancel && (
            <button
              type="button"
              className="btn-tema btn-tema--contorno order-cancel-button"
              disabled={cancelling}
              onClick={() =>
                notify(cancelOrder, "¿Deseas cancelar este pedido?")
              }
            >
              {cancelling ? "Cancelando…" : "Cancelar pedido"}
            </button>
          )}
        </section>

        <div className="order-side">
          <section className="checkout-card">
            <h2 className="checkout-section-title titulos">Entrega</h2>
            <p className="parrafos order-data">
              <strong>{order.recipientName}</strong>
              <br />
              {order.address}
              <br />
              {order.city}, {order.department}
              {order.postalCode ? ` · ${order.postalCode}` : ""}
            </p>
            <p className="parrafos order-data">
              {order.phone}
              <br />
              {order.email}
            </p>
            {order.notes && (
              <p className="parrafos order-data">
                <strong>Notas:</strong> {order.notes}
              </p>
            )}
            <p className="checkout-help parrafos">
              {order.estimatedDeliveryDays
                ? `Entrega estimada: hasta ${order.estimatedDeliveryDays} días hábiles después de confirmar el pago.`
                : "Entrega estimada: te confirmamos el plazo al validar el pago."}
            </p>
          </section>

          {(order.trackingNumber ||
            order.trackingCarrier ||
            order.shippedAt) && (
            <section className="checkout-card">
              <h2 className="checkout-section-title titulos">Seguimiento</h2>
              {order.trackingCarrier && (
                <p className="parrafos order-data">
                  Transportadora: <strong>{order.trackingCarrier}</strong>
                </p>
              )}
              {order.trackingNumber && (
                <p className="parrafos order-data">
                  Guía: <strong>{order.trackingNumber}</strong>
                </p>
              )}
              {order.shippedAt && (
                <p className="parrafos order-data">
                  Despachado el {formatDate(order.shippedAt)}
                </p>
              )}
              {order.deliveredAt && (
                <p className="parrafos order-data">
                  Entregado el {formatDate(order.deliveredAt)}
                </p>
              )}
            </section>
          )}

          <section className="checkout-card">
            <h2 className="checkout-section-title titulos">Historial</h2>

            {history.length === 0 ? (
              <p className="parrafos">Todavía no hay movimientos registrados.</p>
            ) : (
              <ul className="order-history">
                {history.map((entry) => {
                  const to = getOrderStatusMeta(entry.toStatus);
                  const from = entry.fromStatus
                    ? getOrderStatusMeta(entry.fromStatus)
                    : null;

                  return (
                    <li key={entry.id} className="order-history-item">
                      <span className="order-history-dot" aria-hidden="true" />
                      <div>
                        <strong className="parrafos">
                          {entry.kind === "pago" ? "Pago" : "Logística"}:{" "}
                          {from && entry.fromStatus !== entry.toStatus
                            ? `${from.label} → ${to.label}`
                            : to.label}
                        </strong>
                        <small className="parrafos">
                          {formatDateTime(entry.createdAt)}
                        </small>
                        {entry.note && (
                          <small className="parrafos">{entry.note}</small>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
        </div>
      </div>
    </>
  );
};

export default PedidoDetalle;
