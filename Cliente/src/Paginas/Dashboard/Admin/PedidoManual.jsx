import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../../config";
import {
  DTF_SIZE_LABELS,
  formatPrice,
  getDtfVariant,
} from "../../../Componentes/cartUtils";
import { getApiErrorMessage } from "../../../Componentes/orderUtils";
import useEnVista from "../../../hooks/useEnVista";
import "../dashboard.css";
import "./PedidoManual.css";

const MAX_QTY = 20;

const CANALES = [
  { value: "presencial", label: "Presencial (mostrador)" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "otro", label: "Otro canal" },
];

const METODOS_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "nequi", label: "Nequi" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "otro", label: "Otro" },
];

const ESTADOS_PAGO = [
  { value: "aprobado", label: "Pagado" },
  { value: "pendiente", label: "Pendiente de pago" },
];

const CHANNEL_LABELS = {
  web: "Tienda web",
  presencial: "Presencial",
  whatsapp: "WhatsApp",
  otro: "Otro canal",
};

const PAYMENT_METHOD_LABELS = {
  efectivo: "Efectivo",
  nequi: "Nequi",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  otro: "Otro",
};

// `sizes` puede llegar como array o como JSON en texto.
const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const dtfLabel = (dtf) =>
  `Diseño DTF · ${dtf?.category?.name || "Sin categoría"}`;

const availableDtfSizes = (dtf) =>
  toArray(dtf?.priceVariants).filter(
    (variant) => variant.activo !== false && Number(variant?.precio) > 0,
  );

const variantLabel = (item) => {
  if (item.productType === "dtf") {
    const size = DTF_SIZE_LABELS[item.dtfSize] || item.dtfSize;
    return [
      `DTF ${size}`,
      item.shirtName && `Franela ${item.shirtName}`,
      item.shirtColor,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  return item.oversize ? "Talla Over Size" : `Talla ${item.size}`;
};

const PedidoManual = () => {
  const [refContenido, enVista] = useEnVista();

  const [articulos, setArticulos] = useState([]);
  const [dtfs, setDtfs] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  const [tipoProducto, setTipoProducto] = useState("articulo");
  const [productoId, setProductoId] = useState("");
  const [talla, setTalla] = useState("");
  const [dtfSize, setDtfSize] = useState("");
  const [shirtColor, setShirtColor] = useState("");
  const [shirtName, setShirtName] = useState("");
  const [cantidad, setCantidad] = useState(1);

  const [items, setItems] = useState([]);

  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryType, setDeliveryType] = useState("envio");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [department, setDepartment] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notas, setNotas] = useState("");

  const [channel, setChannel] = useState("presencial");
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [paymentStatus, setPaymentStatus] = useState("aprobado");
  const [discount, setDiscount] = useState("");

  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [draftError, setDraftError] = useState("");
  const [createdOrder, setCreatedOrder] = useState(null);

  const quoteRequest = useRef(0);
  const errorRef = useRef(null);
  const successRef = useRef(null);
  // Guard sincrono: evita un segundo envio aunque React aun no haya
  // deshabilitado el boton (doble clic rapido).
  const submittingRef = useRef(false);

  // Gestion de foco: tras un envio fallido se enfoca el resumen de error;
  // al registrar la venta, el titulo de exito.
  useEffect(() => {
    if (formError) errorRef.current?.focus();
  }, [formError]);

  useEffect(() => {
    if (createdOrder) successRef.current?.focus();
  }, [createdOrder]);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError("");
    try {
      const [artsRes, dtfsRes] = await Promise.all([
        axios.get(`${API_URL}/api/posts`, { withCredentials: true }),
        axios.get(`${API_URL}/api/dtf`, { withCredentials: true }),
      ]);
      const arts = Array.isArray(artsRes.data) ? artsRes.data : [];
      const dtfList = Array.isArray(dtfsRes.data) ? dtfsRes.data : [];
      setArticulos(arts.filter((a) => a.stock && Number(a.precio) > 0));
      setDtfs(
        dtfList.filter((d) => d.stock && availableDtfSizes(d).length > 0),
      );
    } catch (err) {
      setCatalogError(
        getApiErrorMessage(err, "No pudimos cargar el catálogo."),
      );
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadCatalog();
  }, [loadCatalog]);

  const productos = tipoProducto === "articulo" ? articulos : dtfs;
  const productoSeleccionado = useMemo(
    () => productos.find((p) => p.id === productoId) || null,
    [productos, productoId],
  );

  const tallasDisponibles =
    tipoProducto === "articulo" && productoSeleccionado
      ? toArray(productoSeleccionado.sizes)
      : [];

  const dtfSizesDisponibles =
    tipoProducto === "dtf" && productoSeleccionado
      ? availableDtfSizes(productoSeleccionado)
      : [];

  const draftUnitPrice = useMemo(() => {
    if (!productoSeleccionado) return 0;
    if (tipoProducto === "dtf") {
      return Number(getDtfVariant(productoSeleccionado, dtfSize)?.precio) || 0;
    }
    return Number(productoSeleccionado.precio) || 0;
  }, [productoSeleccionado, tipoProducto, dtfSize]);

  // Cotiza el envio (con debounce) cuando hay direccion y la entrega es a domicilio.
  useEffect(() => {
    if (deliveryType !== "envio" || !department.trim() || !city.trim()) {
      setQuote(null);
      setQuoteError("");
      setQuoting(false);
      return undefined;
    }

    const requestId = quoteRequest.current + 1;
    quoteRequest.current = requestId;
    setQuoting(true);
    setQuoteError("");

    const timer = setTimeout(async () => {
      try {
        const res = await axios.post(
          `${API_URL}/api/shipping/quote`,
          { department: department.trim(), city: city.trim() },
          { withCredentials: true },
        );
        if (quoteRequest.current === requestId) setQuote(res.data);
      } catch (err) {
        if (quoteRequest.current === requestId) {
          setQuote(null);
          setQuoteError(
            getApiErrorMessage(err, "No se pudo calcular el envío."),
          );
        }
      } finally {
        if (quoteRequest.current === requestId) setQuoting(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [deliveryType, department, city]);

  const resetDraft = () => {
    setProductoId("");
    setTalla("");
    setDtfSize("");
    setShirtColor("");
    setShirtName("");
    setCantidad(1);
    setDraftError("");
  };

  const onTipoChange = (value) => {
    setTipoProducto(value);
    resetDraft();
  };

  const onProductoChange = (value) => {
    setProductoId(value);
    setDraftError("");
    setTalla("");
    setDtfSize("");
    const producto = productos.find((p) => p.id === value) || null;
    if (!producto) return;
    if (tipoProducto === "articulo" && !producto.oversize) {
      setTalla(toArray(producto.sizes)[0] || "");
    }
    if (tipoProducto === "dtf") {
      setDtfSize(availableDtfSizes(producto)[0]?.tipo || "");
    }
  };

  const agregarItem = () => {
    setDraftError("");
    if (!productoSeleccionado) {
      setDraftError("Selecciona un producto para agregar.");
      return;
    }

    let size = null;
    if (tipoProducto === "articulo") {
      if (!productoSeleccionado.oversize) {
        if (!talla) {
          setDraftError("Selecciona una talla.");
          return;
        }
        if (!tallasDisponibles.includes(talla)) {
          setDraftError("La talla seleccionada no está disponible.");
          return;
        }
        size = talla;
      }
    } else if (!dtfSize) {
      setDraftError("Selecciona el tamaño del DTF.");
      return;
    }

    if (draftUnitPrice <= 0) {
      setDraftError("Ese producto no tiene un precio configurado.");
      return;
    }

    const qty = Math.min(
      Math.max(Number.parseInt(cantidad, 10) || 1, 1),
      MAX_QTY,
    );

    const item = {
      key:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
      productType: tipoProducto,
      productId: productoSeleccionado.id,
      title:
        tipoProducto === "dtf"
          ? dtfLabel(productoSeleccionado)
          : productoSeleccionado.title,
      oversize:
        tipoProducto === "articulo"
          ? Boolean(productoSeleccionado.oversize)
          : false,
      size,
      dtfSize: tipoProducto === "dtf" ? dtfSize : null,
      shirtColor: tipoProducto === "dtf" ? shirtColor.trim() : "",
      shirtName: tipoProducto === "dtf" ? shirtName.trim() : "",
      unitPrice: draftUnitPrice,
      quantity: qty,
    };

    setItems((prev) => [...prev, item]);
    resetDraft();
  };

  const quitarItem = (key) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items],
  );

  const discountNum = useMemo(() => {
    if (discount === "") return 0;
    const parsed = Number.parseInt(discount, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [discount]);

  const shippingCost = deliveryType === "envio" ? Number(quote?.cost) || 0 : 0;
  const total = Math.max(subtotal - discountNum + shippingCost, 0);

  const buildPayload = () => ({
    items: items.map((item) => ({
      productType: item.productType,
      productId: item.productId,
      quantity: item.quantity,
      ...(item.productType === "articulo"
        ? { size: item.size || undefined }
        : {
            dtfSize: item.dtfSize,
            shirtColor: item.shirtColor || undefined,
            shirtName: item.shirtName || undefined,
          }),
    })),
    shipping: {
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      ...(deliveryType === "envio"
        ? {
            address: address.trim(),
            city: city.trim(),
            department: department.trim(),
            postalCode: postalCode.trim() || undefined,
          }
        : {}),
    },
    channel,
    paymentMethod,
    paymentStatus,
    deliveryType,
    discount: discountNum,
    notes: notas.trim() || undefined,
  });

  const validate = () => {
    if (items.length === 0) return "Agrega al menos un producto al pedido.";
    if (recipientName.trim().length < 3) {
      return "Escribe el nombre del comprador.";
    }
    if (phone.replace(/\D/g, "").length < 7) {
      return "Escribe un teléfono válido (mínimo 7 dígitos).";
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return "El correo electrónico no es válido.";
    }
    if (deliveryType === "envio") {
      if (!address.trim()) return "Escribe la dirección de envío.";
      if (!city.trim()) return "Escribe la ciudad o municipio.";
      if (!department.trim()) return "Escribe el departamento.";
      if (!quote) {
        return "No se pudo calcular el envío. Revisa la dirección o cambia a entrega en persona.";
      }
    }
    if (!paymentMethod) return "Selecciona un método de pago.";
    if (discountNum > subtotal) {
      return "El descuento no puede superar el subtotal.";
    }
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const message = validate();
    if (message) {
      setFormError(message);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFormError("");
    try {
      const res = await axios.post(
        `${API_URL}/api/admin/orders/manual`,
        buildPayload(),
        { withCredentials: true },
      );
      setCreatedOrder(res.data);
      window.scrollTo(0, 0);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "No se pudo registrar la venta."));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setCreatedOrder(null);
    setItems([]);
    resetDraft();
    setRecipientName("");
    setPhone("");
    setEmail("");
    setDeliveryType("envio");
    setAddress("");
    setCity("");
    setDepartment("");
    setPostalCode("");
    setNotas("");
    setChannel("presencial");
    setPaymentMethod("efectivo");
    setPaymentStatus("aprobado");
    setDiscount("");
    setQuote(null);
    setQuoteError("");
    setFormError("");
    setTipoProducto("articulo");
  };

  if (createdOrder) {
    return (
      <section
        ref={refContenido}
        className={`panel-seccion-cabecera revelar${enVista ? " is-visible" : ""}`}
      >
        <header className="panel-titulo revelar-linea" style={{ "--i": 0 }}>
          <span className="etiqueta-seccion">Panel de administración</span>
          <h1 className="panel-titulo-texto">Venta registrada</h1>
        </header>

        <div
          className="checkout-card pedido-manual-success revelar-linea"
          style={{ "--i": 1 }}
        >
          <span className="order-badge paid">Registrada</span>
          <h2
            ref={successRef}
            tabIndex={-1}
            className="checkout-section-title titulos"
          >
            Pedido {createdOrder.orderNumber}
          </h2>
          <p className="parrafos">
            {formatPrice(createdOrder.total)} ·{" "}
            {CHANNEL_LABELS[createdOrder.channel] || createdOrder.channel} ·{" "}
            {PAYMENT_METHOD_LABELS[createdOrder.paymentMethod] ||
              createdOrder.paymentMethod ||
              "Sin método"}
          </p>
          <div className="pedido-manual-acciones pedido-manual-acciones--centrada">
            <Link
              to={`/dashboard/admin/pedidos/${createdOrder.id}`}
              className="btn-tema btn-tema--primario"
            >
              Ver pedido
            </Link>
            <button
              type="button"
              className="btn-tema btn-tema--contorno"
              onClick={resetAll}
            >
              Registrar otra venta
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={refContenido}
      className={`panel-seccion-cabecera revelar${enVista ? " is-visible" : ""}`}
    >
      <header className="panel-titulo revelar-linea" style={{ "--i": 0 }}>
        <span className="etiqueta-seccion">Panel de administración</span>
        <h1 className="panel-titulo-texto">Registrar venta</h1>
        <p className="texto-seccion">
          Registra una venta presencial, por WhatsApp u otro canal externo. El
          pedido queda en el mismo historial que los pedidos web.
        </p>
      </header>

      <Form
        onSubmit={handleSubmit}
        className="order-detail-grid"
        aria-busy={submitting}
      >
        <div>
          <section className="checkout-card revelar-linea" style={{ "--i": 1 }}>
            <h2 className="checkout-section-title titulos">Productos</h2>

            <div className="pedido-manual-catalogo">
              {catalogLoading ? (
                <div className="checkout-loading">
                  <span className="cargador" aria-hidden="true" />
                  <p className="parrafos">Cargando catálogo...</p>
                </div>
              ) : catalogError ? (
                <div className="estado">
                  <h3 className="estado-titulo">
                    No pudimos cargar el catálogo
                  </h3>
                  <p className="estado-texto">{catalogError}</p>
                  <button
                    type="button"
                    className="btn-tema btn-tema--contorno"
                    onClick={loadCatalog}
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <>
                  <div className="pedido-manual-picker">
                    <Form.Group controlId="pmTipo">
                      <Form.Label className="parrafos">Tipo</Form.Label>
                      <Form.Select
                        value={tipoProducto}
                        onChange={(e) => onTipoChange(e.target.value)}
                      >
                        <option value="articulo">Artículo</option>
                        <option value="dtf">Crea DTF</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group controlId="pmProducto">
                      <Form.Label className="parrafos">Producto</Form.Label>
                      <Form.Select
                        value={productoId}
                        onChange={(e) => onProductoChange(e.target.value)}
                      >
                        <option value="">
                          {productos.length === 0
                            ? "Sin productos disponibles"
                            : "Selecciona un producto"}
                        </option>
                        {productos.map((producto) => (
                          <option key={producto.id} value={producto.id}>
                            {tipoProducto === "dtf"
                              ? dtfLabel(producto)
                              : producto.title}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    {tipoProducto === "articulo" &&
                      productoSeleccionado &&
                      !productoSeleccionado.oversize && (
                        <Form.Group controlId="pmTalla">
                          <Form.Label className="parrafos">Talla</Form.Label>
                          <Form.Select
                            value={talla}
                            onChange={(e) => setTalla(e.target.value)}
                          >
                            <option value="">Selecciona una talla</option>
                            {tallasDisponibles.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      )}

                    {tipoProducto === "articulo" &&
                      productoSeleccionado &&
                      productoSeleccionado.oversize && (
                        <div className="pedido-manual-nota">
                          <span className="parrafos">Talla Over Size</span>
                        </div>
                      )}

                    {tipoProducto === "dtf" && productoSeleccionado && (
                      <>
                        <Form.Group controlId="pmDtfSize">
                          <Form.Label className="parrafos">
                            Tamaño DTF
                          </Form.Label>
                          <Form.Select
                            value={dtfSize}
                            onChange={(e) => setDtfSize(e.target.value)}
                          >
                            <option value="">Selecciona el tamaño</option>
                            {dtfSizesDisponibles.map((variant) => (
                              <option key={variant.tipo} value={variant.tipo}>
                                {DTF_SIZE_LABELS[variant.tipo] || variant.tipo}{" "}
                                · {formatPrice(variant.precio)}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>

                        <Form.Group controlId="pmShirtName">
                          <Form.Label className="parrafos">
                            Nombre en la franela (opcional)
                          </Form.Label>
                          <Form.Control
                            value={shirtName}
                            maxLength={100}
                            onChange={(e) => setShirtName(e.target.value)}
                          />
                        </Form.Group>

                        <Form.Group controlId="pmShirtColor">
                          <Form.Label className="parrafos">
                            Color de franela (opcional)
                          </Form.Label>
                          <Form.Control
                            value={shirtColor}
                            maxLength={50}
                            onChange={(e) => setShirtColor(e.target.value)}
                          />
                        </Form.Group>
                      </>
                    )}

                    <Form.Group controlId="pmCantidad">
                      <Form.Label className="parrafos">Cantidad</Form.Label>
                      <Form.Control
                        type="number"
                        min={1}
                        max={MAX_QTY}
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                      />
                    </Form.Group>
                  </div>

                  <div className="pedido-manual-acciones">
                    <button
                      type="button"
                      className="btn-tema btn-tema--primario btn-tema--pequeno"
                      onClick={agregarItem}
                    >
                      Agregar producto
                    </button>
                    <span className="parrafos admin-muted">
                      {draftUnitPrice > 0
                        ? `Precio unitario: ${formatPrice(draftUnitPrice)}`
                        : "Selecciona un producto para ver el precio"}
                    </span>
                  </div>

                  {draftError && (
                    <p className="pedido-manual-error" role="alert">
                      {draftError}
                    </p>
                  )}

                  {items.length === 0 ? (
                    <div className="pedido-manual-vacio">
                      Todavía no has agregado productos a esta venta.
                    </div>
                  ) : (
                    <div className="admin-table-wrap pedido-manual-tabla">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th className="parrafos">Producto</th>
                            <th className="parrafos">Variante</th>
                            <th className="parrafos">Cant.</th>
                            <th className="parrafos">Precio</th>
                            <th className="parrafos">Total</th>
                            <th aria-label="Quitar" />
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => (
                            <tr key={item.key}>
                              <td className="parrafos">{item.title}</td>
                              <td className="parrafos admin-muted">
                                {variantLabel(item)}
                              </td>
                              <td className="parrafos">{item.quantity}</td>
                              <td className="parrafos admin-nowrap">
                                {formatPrice(item.unitPrice)}
                              </td>
                              <td className="parrafos admin-nowrap">
                                <strong>
                                  {formatPrice(item.unitPrice * item.quantity)}
                                </strong>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn-tema btn-tema--contorno btn-tema--pequeno"
                                  onClick={() => quitarItem(item.key)}
                                  aria-label={`Quitar ${item.title}`}
                                >
                                  Quitar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          <section className="checkout-card revelar-linea" style={{ "--i": 2 }}>
            <h2 className="checkout-section-title titulos">
              Comprador y entrega
            </h2>

            <div className="pedido-manual-grid">
              <Form.Group controlId="pmNombre">
                <Form.Label className="parrafos">
                  Nombre del comprador{" "}
                  <span className="pedido-manual-req" aria-hidden="true">
                    *
                  </span>
                </Form.Label>
                <Form.Control
                  value={recipientName}
                  maxLength={150}
                  aria-required="true"
                  autoComplete="name"
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nombre y apellido"
                />
              </Form.Group>

              <Form.Group controlId="pmTelefono">
                <Form.Label className="parrafos">
                  Teléfono{" "}
                  <span className="pedido-manual-req" aria-hidden="true">
                    *
                  </span>
                </Form.Label>
                <Form.Control
                  type="tel"
                  value={phone}
                  maxLength={30}
                  aria-required="true"
                  aria-describedby="pmTelefonoAyuda"
                  autoComplete="tel"
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="300 000 0000"
                />
                <Form.Text id="pmTelefonoAyuda" className="parrafos">
                  Mínimo 7 dígitos.
                </Form.Text>
              </Form.Group>

              <Form.Group controlId="pmEmail" className="span-2">
                <Form.Label className="parrafos">
                  Correo electrónico (opcional)
                </Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  maxLength={255}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="comprador@correo.com"
                />
              </Form.Group>

              <Form.Group controlId="pmEntrega" className="span-2">
                <Form.Label className="parrafos">Entrega</Form.Label>
                <Form.Select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value)}
                >
                  <option value="envio">Envío a domicilio</option>
                  <option value="pickup">
                    Recoge en tienda / entrega en mano
                  </option>
                </Form.Select>
              </Form.Group>

              {deliveryType === "envio" && (
                <>
                  <Form.Group controlId="pmDireccion" className="span-2">
                    <Form.Label className="parrafos">Dirección</Form.Label>
                    <Form.Control
                      value={address}
                      maxLength={255}
                      autoComplete="street-address"
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Calle, carrera, número..."
                    />
                  </Form.Group>

                  <Form.Group controlId="pmDepartamento">
                    <Form.Label className="parrafos">Departamento</Form.Label>
                    <Form.Control
                      value={department}
                      maxLength={100}
                      autoComplete="address-level1"
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Antioquia"
                    />
                  </Form.Group>

                  <Form.Group controlId="pmCiudad">
                    <Form.Label className="parrafos">
                      Ciudad / municipio
                    </Form.Label>
                    <Form.Control
                      value={city}
                      maxLength={100}
                      autoComplete="address-level2"
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Medellín"
                    />
                  </Form.Group>

                  <Form.Group controlId="pmCodigoPostal">
                    <Form.Label className="parrafos">
                      Código postal (opcional)
                    </Form.Label>
                    <Form.Control
                      value={postalCode}
                      maxLength={20}
                      autoComplete="postal-code"
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </Form.Group>
                </>
              )}

              <Form.Group controlId="pmNotas" className="span-2">
                <Form.Label className="parrafos">
                  Observaciones internas (opcional)
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  maxLength={1000}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Detalles de la venta, acuerdos, etc."
                />
              </Form.Group>
            </div>

            {deliveryType === "envio" && (
              <p
                className="checkout-help parrafos"
                role="status"
                aria-live="polite"
              >
                {quoting
                  ? "Calculando envío..."
                  : quote
                    ? `Envío ${formatPrice(quote.cost)} · ${quote.label || quote.zone}`
                    : quoteError ||
                      "Completa departamento y ciudad para calcular el envío."}
              </p>
            )}
          </section>

          <section className="checkout-card revelar-linea" style={{ "--i": 3 }}>
            <h2 className="checkout-section-title titulos">Pago y canal</h2>

            <div className="pedido-manual-grid">
              <Form.Group controlId="pmCanal">
                <Form.Label className="parrafos">Canal de venta</Form.Label>
                <Form.Select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                >
                  {CANALES.map((opcion) => (
                    <option key={opcion.value} value={opcion.value}>
                      {opcion.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group controlId="pmMetodoPago">
                <Form.Label className="parrafos">Método de pago</Form.Label>
                <Form.Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  {METODOS_PAGO.map((opcion) => (
                    <option key={opcion.value} value={opcion.value}>
                      {opcion.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group controlId="pmEstadoPago">
                <Form.Label className="parrafos">Estado del pago</Form.Label>
                <Form.Select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  {ESTADOS_PAGO.map((opcion) => (
                    <option key={opcion.value} value={opcion.value}>
                      {opcion.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group controlId="pmDescuento">
                <Form.Label className="parrafos">
                  Descuento (COP, opcional)
                </Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  step={100}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                />
              </Form.Group>
            </div>
          </section>
        </div>

        <aside className="order-side">
          <section
            className="checkout-summary revelar-linea"
            style={{ "--i": 2 }}
          >
            <h2 className="checkout-section-title titulos">Resumen</h2>

            <div className="checkout-totals">
              <div className="checkout-total-row parrafos">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div className="checkout-total-row parrafos">
                <span>Envío</span>
                <strong>
                  {deliveryType === "envio" ? formatPrice(shippingCost) : "—"}
                </strong>
              </div>
              <div className="checkout-total-row parrafos">
                <span>Descuento</span>
                <strong>- {formatPrice(discountNum)}</strong>
              </div>
              <div className="checkout-total-row grand titulos">
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </div>
            </div>

            {formError && (
              <p
                ref={errorRef}
                tabIndex={-1}
                className="pedido-manual-error"
                role="alert"
              >
                {formError}
              </p>
            )}

            <button
              type="submit"
              className="btn-tema btn-tema--primario w-100 pedido-manual-submit"
              disabled={submitting || items.length === 0}
            >
              {submitting ? "Registrando..." : "Registrar venta"}
            </button>
            <p className="checkout-help parrafos">
              El stock y los precios se validan en el servidor al confirmar.
            </p>
          </section>
        </aside>
      </Form>
    </section>
  );
};

export default PedidoManual;
