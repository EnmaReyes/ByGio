import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Form } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { API_URL } from "../../config";
import { AuthContext } from "../../context/authContext";
import { DTF_SIZE_LABELS, formatPrice } from "../../Componentes/cartUtils";
import {
  formatDate,
  formatDateTime,
  getApiErrorMessage,
  getChannelLabel,
  getOrderStatusMeta,
  getPaymentMethodLabel,
  ORDER_STATUS_META,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "../../Componentes/orderUtils";
import { notify } from "../../Componentes/toastConfig/toastconfigs";
import "../pedidos.css";
import "./admin.css";

const PAY_METHODS = ["transferencia", "nequi", "efectivo", "tarjeta", "otro"];

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

const AdminPedidoDetalle = () => {
  const { id } = useParams();
  const { currentUser } = useContext(AuthContext);
  const isAdmin = Boolean(currentUser?.admin);

  const { pathname } = useLocation();
  const listBase = pathname.startsWith("/dashboard")
    ? "/dashboard/admin/pedidos"
    : "/admin/pedidos";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nextStatus, setNextStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [savingTracking, setSavingTracking] = useState(false);
  const [payMethod, setPayMethod] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  const applyOrder = useCallback((data) => {
    setOrder(data);
    setCarrier(data.trackingCarrier || "");
    setTrackingNumber(data.trackingNumber || "");

    const next = ORDER_STATUS_TRANSITIONS[data.status] || [];
    setNextStatus(next[0] || "");
    setStatusNote("");
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(`${API_URL}/api/admin/orders/${id}`, {
        withCredentials: true,
      });
      applyOrder(res.data);
    } catch (err) {
      setError(
        getApiErrorMessage(err, "No se pudo cargar el pedido. Intenta de nuevo."),
      );
    } finally {
      setLoading(false);
    }
  }, [id, applyOrder]);

  useEffect(() => {
    if (!isAdmin) return;
    window.scrollTo(0, 0);
    load();
  }, [isAdmin, load]);

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

  const submitStatus = async () => {
    if (!nextStatus) return;
    setSavingStatus(true);

    try {
      const res = await axios.patch(
        `${API_URL}/api/admin/orders/${id}/status`,
        {
          status: nextStatus,
          ...(statusNote.trim() && { note: statusNote.trim() }),
        },
        { withCredentials: true },
      );
      applyOrder(res.data);
      toast.success("Estado actualizado");
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "No se pudo actualizar el estado del pedido"),
      );
    } finally {
      setSavingStatus(false);
    }
  };

  const handleStatusSubmit = (event) => {
    event.preventDefault();

    if (nextStatus === "cancelado") {
      notify(
        submitStatus,
        "¿Cancelar este pedido? Se libera el stock de los productos.",
      );
      return;
    }

    submitStatus();
  };

  const handleTrackingSubmit = async (event) => {
    event.preventDefault();
    setSavingTracking(true);

    try {
      const res = await axios.patch(
        `${API_URL}/api/admin/orders/${id}/tracking`,
        { trackingCarrier: carrier, trackingNumber },
        { withCredentials: true },
      );
      applyOrder(res.data);
      toast.success("Datos de envío actualizados");
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "No se pudieron guardar los datos de envío"),
      );
    } finally {
      setSavingTracking(false);
    }
  };

  if (loading) {
    return (
      <>
        <header className="catalogo-hero">
          <div className="contenedor">
            <h1 className="catalogo-hero-titulo">Pedido</h1>
          </div>
        </header>
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
        <header className="catalogo-hero">
          <div className="contenedor">
            <h1 className="catalogo-hero-titulo">Pedido</h1>
          </div>
        </header>
        <div className="checkout-page">
          <div className="estado">
            <h2 className="estado-titulo">No pudimos abrir este pedido</h2>
            <p className="estado-texto">{error || "Pedido no encontrado"}</p>
            <div className="checkout-gate-actions">
              <button
                type="button"
                className="btn-tema btn-tema--primario"
                onClick={load}
              >
                Reintentar
              </button>
              <Link to={listBase} className="checkout-secondary-link">
                Volver a pedidos
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const status = getOrderStatusMeta(order.status);
  const transitions = ORDER_STATUS_TRANSITIONS[order.status] || [];
  const items = order.items || [];
  const history = order.history || [];
  const payments = order.payments || [];
  const isCancelled = order.status === "cancelado";

  // Pago aprobado vigente (el indice unico garantiza que hay como maximo uno).
  const approvedPayment = payments.find(
    (payment) => payment.status === "aprobado",
  );
  const canConfirmPayment = !isCancelled && !approvedPayment;
  const canRefundPayment =
    Boolean(approvedPayment) && order.paymentStatus !== "reembolsado";

  const sendPaymentChange = async ({ url, method, body, success }) => {
    setSavingPayment(true);

    try {
      const res = await axios[method](url, body, { withCredentials: true });
      applyOrder(res.data);
      setPaymentNote("");
      toast.success(success);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "No se pudo actualizar el pago"));
    } finally {
      setSavingPayment(false);
    }
  };

  const confirmPayment = () =>
    sendPaymentChange({
      url: `${API_URL}/api/admin/orders/${id}/payments`,
      method: "post",
      body: {
        status: "aprobado",
        paymentMethodType:
          payMethod || order.paymentMethod || "transferencia",
        ...(paymentNote.trim() && { note: paymentNote.trim() }),
      },
      success: "Pago confirmado",
    });

  const refundPayment = () => {
    if (!approvedPayment) return;

    notify(
      () =>
        sendPaymentChange({
          url: `${API_URL}/api/admin/orders/${id}/payments/${approvedPayment.id}`,
          method: "patch",
          body: {
            status: "reembolsado",
            ...(paymentNote.trim() && { note: paymentNote.trim() }),
          },
          success: "Reembolso registrado",
        }),
      "¿Registrar el reembolso de este pago? El pedido quedará como reembolsado.",
    );
  };

  return (
    <>
      <header className="catalogo-hero">
        <div className="contenedor">
          <h1 className="catalogo-hero-titulo">{order.orderNumber}</h1>
          <p className="catalogo-hero-texto">
            Creado el {formatDateTime(order.createdAt)} ·{" "}
            {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}
            {order.channel ? ` · ${getChannelLabel(order.channel)}` : ""}
          </p>
        </div>
      </header>

      <div className="checkout-page admin-page">
        <div className="order-detail-head">
          <Link to={listBase} className="checkout-back-link parrafos">
            ← Pedidos
          </Link>
          <div className="order-detail-badges">
            <span className={`canal-badge canal-${order.channel || "otro"}`}>
              {getChannelLabel(order.channel)}
            </span>
            <span className={`order-badge ${status.tone}`}>{status.label}</span>
          </div>
        </div>

      <div className="order-detail-grid">
        <div>
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
              {Number(order.discountTotal) > 0 && (
                <div className="checkout-total-row parrafos">
                  <span>Descuento</span>
                  <strong>- {formatPrice(order.discountTotal)}</strong>
                </div>
              )}
              <div className="checkout-total-row grand titulos">
                <span>Total</span>
                <strong>{formatPrice(order.total)}</strong>
              </div>
            </div>
          </section>

          <section className="checkout-card">
            <h2 className="checkout-section-title titulos">Historial</h2>
            <ul className="order-history">
              {history.map((entry) => {
                const to = getOrderStatusMeta(entry.toStatus);
                const from = entry.fromStatus
                  ? getOrderStatusMeta(entry.fromStatus)
                  : null;
                const author =
                  entry.changedBy?.username || entry.changedBy?.email;

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
                        {author ? ` · ${author}` : ""}
                      </small>
                      {entry.note && (
                        <small className="parrafos">{entry.note}</small>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {payments.length > 0 && (
            <section className="checkout-card">
              <h2 className="checkout-section-title titulos">Pagos</h2>
              <ul className="order-history">
                {payments.map((payment) => (
                  <li key={payment.id} className="order-history-item">
                    <span className="order-history-dot" aria-hidden="true" />
                    <div>
                      <strong className="parrafos">
                        {PAYMENT_STATUS_LABELS[payment.status] || payment.status}{" "}
                        · {formatPrice(Number(payment.amountInCents) / 100)}
                      </strong>
                      <small className="parrafos">
                        {payment.provider}
                        {payment.reference ? ` · ${payment.reference}` : ""}
                      </small>
                      <small className="parrafos">
                        {formatDateTime(payment.processedAt || payment.createdAt)}
                      </small>
                      {payment.statusMessage && (
                        <small className="parrafos">
                          {payment.statusMessage}
                        </small>
                      )}
                      {payment.failureCode && (
                        <small className="parrafos">
                          Código de fallo: {payment.failureCode}
                        </small>
                      )}
                      {payment.wompiStatus && (
                        <small className="parrafos">
                          Wompi: {payment.wompiStatus}
                          {payment.providerTransactionId
                            ? ` · ${payment.providerTransactionId}`
                            : ""}
                        </small>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="order-side">
          <section className="checkout-card">
            <h2 className="checkout-section-title titulos">
              Acciones del pedido
            </h2>

            {transitions.length === 0 ? (
              <p className="parrafos">
                Este pedido no tiene más transiciones disponibles.
              </p>
            ) : (
              <Form onSubmit={handleStatusSubmit}>
                <Form.Group controlId="nextStatus" className="mb-2">
                  <Form.Label className="parrafos">Nuevo estado</Form.Label>
                  <Form.Select
                    value={nextStatus}
                    onChange={(event) => setNextStatus(event.target.value)}
                  >
                    {transitions.map((value) => (
                      <option key={value} value={value}>
                        {ORDER_STATUS_META[value]?.label || value}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {nextStatus === "pagado" && (
                  <p className="checkout-help parrafos">
                    Al marcar el pedido como pagado, el estado de pago cambia a
                    aprobado (transferencia o Nequi confirmados a mano).
                  </p>
                )}

                {nextStatus === "enviado" && (
                  <p className="checkout-help parrafos">
                    Guarda la transportadora y la guía antes o después de
                    despachar.
                  </p>
                )}

                <Form.Group controlId="statusNote" className="mt-2">
                  <Form.Label className="parrafos">
                    Nota interna (opcional)
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    maxLength={1000}
                    value={statusNote}
                    onChange={(event) => setStatusNote(event.target.value)}
                  />
                </Form.Group>

                <button
                  type="submit"
                  className={`btn-tema w-100 mt-3 ${
                    nextStatus === "cancelado"
                      ? "btn-tema--contorno"
                      : "btn-tema--primario"
                  }`}
                  disabled={savingStatus}
                >
                  {savingStatus ? "Guardando…" : "Actualizar estado"}
                </button>
              </Form>
            )}
          </section>

          <section className="checkout-card">
            <h2 className="checkout-section-title titulos">Pago</h2>

            <p className="parrafos order-data">
              Estado:{" "}
              <strong>
                {PAYMENT_STATUS_LABELS[order.paymentStatus] ||
                  order.paymentStatus}
              </strong>
              {order.paymentApprovedAt && (
                <>
                  <br />
                  Aprobado el {formatDateTime(order.paymentApprovedAt)}
                </>
              )}
            </p>

            {approvedPayment?.paymentMethodType && (
              <p className="checkout-help parrafos">
                Método:{" "}
                {getPaymentMethodLabel(approvedPayment.paymentMethodType)}
              </p>
            )}

            {isCancelled ? (
              <p className="checkout-help parrafos">
                Pedido cancelado: no se registran pagos nuevos.
              </p>
            ) : (
              <>
                {!approvedPayment && (
                  <p className="checkout-help parrafos">
                    Confirma aquí una transferencia o Nequi recibidos. Los pagos
                    con Wompi se aprueban solos con el webhook.
                  </p>
                )}

                {(canConfirmPayment || canRefundPayment) && (
                  <>
                    {canConfirmPayment && (
                      <Form.Group controlId="payMethod" className="mb-2">
                        <Form.Label className="parrafos">
                          Método de pago
                        </Form.Label>
                        <Form.Select
                          value={
                            payMethod || order.paymentMethod || "transferencia"
                          }
                          onChange={(event) =>
                            setPayMethod(event.target.value)
                          }
                        >
                          {PAY_METHODS.map((method) => (
                            <option key={method} value={method}>
                              {PAYMENT_METHOD_LABELS[method] || method}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    )}

                    <Form.Group controlId="paymentNote" className="mb-2">
                      <Form.Label className="parrafos">
                        Nota interna (opcional)
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        maxLength={500}
                        value={paymentNote}
                        onChange={(event) =>
                          setPaymentNote(event.target.value)
                        }
                      />
                    </Form.Group>

                    {canConfirmPayment && (
                      <button
                        type="button"
                        className="btn-tema btn-tema--primario w-100"
                        disabled={savingPayment}
                        onClick={confirmPayment}
                      >
                        {savingPayment ? "Guardando..." : "Confirmar pago"}
                      </button>
                    )}

                    {canRefundPayment && (
                      <button
                        type="button"
                        className="btn-tema btn-tema--contorno w-100"
                        disabled={savingPayment}
                        onClick={refundPayment}
                      >
                        {savingPayment
                          ? "Guardando..."
                          : "Registrar reembolso"}
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </section>

          <section className="checkout-card">
            <h2 className="checkout-section-title titulos">Envío</h2>

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
                <strong>
                  {order.channel === "web"
                    ? "Notas del cliente:"
                    : "Observaciones internas:"}
                </strong>{" "}
                {order.notes}
              </p>
            )}

            {isCancelled ? (
              <p className="checkout-help parrafos">
                Pedido cancelado: no se puede editar el envío.
              </p>
            ) : (
              <Form onSubmit={handleTrackingSubmit}>
                <Form.Group controlId="trackingCarrier" className="mb-2">
                  <Form.Label className="parrafos">Transportadora</Form.Label>
                  <Form.Control
                    value={carrier}
                    maxLength={100}
                    placeholder="Interrapidísimo, Servientrega…"
                    onChange={(event) => setCarrier(event.target.value)}
                  />
                </Form.Group>

                <Form.Group controlId="trackingNumber" className="mb-2">
                  <Form.Label className="parrafos">Número de guía</Form.Label>
                  <Form.Control
                    value={trackingNumber}
                    maxLength={100}
                    onChange={(event) => setTrackingNumber(event.target.value)}
                  />
                </Form.Group>

                <button
                  type="submit"
                  className="btn-tema btn-tema--contorno w-100"
                  disabled={
                    savingTracking || (!carrier.trim() && !trackingNumber.trim())
                  }
                >
                  {savingTracking ? "Guardando…" : "Guardar envío"}
                </button>
              </Form>
            )}

            {order.shippedAt && (
              <p className="checkout-help parrafos">
                Despachado el {formatDate(order.shippedAt)}
              </p>
            )}
            {order.deliveredAt && (
              <p className="checkout-help parrafos">
                Entregado el {formatDate(order.deliveredAt)}
              </p>
            )}
          </section>

          <section className="checkout-card">
            <h2 className="checkout-section-title titulos">
              {order.user ? "Cuenta" : "Venta externa"}
            </h2>
            {order.user ? (
              <p className="parrafos order-data">
                {order.user.username || "Sin usuario"} ·{" "}
                {order.user.email || "Sin correo"}
              </p>
            ) : (
              <p className="parrafos order-data">
                Registrada manualmente por un administrador.
                <br />
                Canal: {getChannelLabel(order.channel)}
                <br />
                Pago: {getPaymentMethodLabel(order.paymentMethod)}
              </p>
            )}
            {order.stockReservedUntil && (
              <p className="checkout-help parrafos">
                Reserva de stock activa hasta{" "}
                {formatDateTime(order.stockReservedUntil)}
              </p>
            )}
          </section>
        </div>
        </div>
      </div>
    </>
  );
};

export default AdminPedidoDetalle;
