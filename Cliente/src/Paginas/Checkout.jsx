import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Col, Form, Row } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { API_URL } from "../config";
import { AuthContext } from "../context/authContext";
import { useContextProvaider } from "../context/ContextProvaider";
import { useCarrito } from "../carrito/CarritoProvider";
import {
  cartItemDetails,
  cartItemTitle,
  formatPrice,
  getCartItemIdentity,
  getCartTotals,
  getDtfUnitPrice,
  getUnitPrice,
  isDtfProduct,
} from "../Componentes/cartUtils";
import { getApiErrorMessage } from "../Componentes/orderUtils";
import "./pedidos.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NOTES = 300;

const DEPARTMENTS = [
  "Amazonas",
  "Antioquia",
  "Arauca",
  "Atlántico",
  "Bolívar",
  "Boyacá",
  "Caldas",
  "Caquetá",
  "Casanare",
  "Cauca",
  "Cesar",
  "Chocó",
  "Córdoba",
  "Cundinamarca",
  "Guainía",
  "Guaviare",
  "Huila",
  "La Guajira",
  "Magdalena",
  "Meta",
  "Nariño",
  "Norte de Santander",
  "Putumayo",
  "Quindío",
  "Risaralda",
  "San Andrés y Providencia",
  "Santander",
  "Sucre",
  "Tolima",
  "Valle del Cauca",
  "Vaupés",
  "Vichada",
  "Bogotá D.C.",
];

const productImage = (product) => {
  if (isDtfProduct(product)) {
    return typeof product.img === "string" ? product.img : product.img?.[0] || "";
  }

  return Array.isArray(product.img) ? product.img[0] || "" : product.img || "";
};

const EMPTY_FORM = {
  recipientName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  department: "",
  postalCode: "",
  notes: "",
};

// Cabecera de pagina del sistema de diseno (misma pieza que /productos).
const PageHero = ({ title, subtitle }) => (
  <header className="catalogo-hero">
    <div className="contenedor">
      <h1 className="catalogo-hero-titulo">{title}</h1>
      {subtitle && <p className="catalogo-hero-texto">{subtitle}</p>}
    </div>
  </header>
);

// Cuenta regresiva simple para la reserva de stock (30 min desde la creacion).
const ReservationHint = () => (
  <p className="checkout-help parrafos">
    Al confirmar, reservamos tus productos por 30 minutos mientras completas el
    pago. Pasado ese tiempo el pedido se cancela automáticamente y los
    productos vuelven a estar disponibles.
  </p>
);

const CheckoutEmpty = () => (
  <>
    <PageHero
      title="Tu carrito está vacío"
      subtitle="Explora el catálogo y agrega tus favoritos para continuar con el pedido."
    />
    <div className="checkout-page">
      <div className="checkout-gate-actions checkout-gate-actions--centrada">
        <Link to="/" className="checkout-primary-link">
          Ver catálogo
        </Link>
      </div>
    </div>
  </>
);

const CheckoutGate = () => {
  const redirect = encodeURIComponent("/checkout");

  return (
    <>
      <PageHero
        title="Inicia sesión para comprar"
        subtitle="Puedes armar tu carrito como invitado, pero para confirmar el pedido necesitamos una cuenta: así puedes consultar el estado de tu compra y su seguimiento."
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

const CheckoutSuccess = ({ order }) => (
  <>
    <PageHero
      title="¡Pedido registrado!"
      subtitle="Te contactaremos para coordinar el pago y la entrega."
    />
    <div className="checkout-page">
      <div className="checkout-success">
        <span className="checkout-success-icon" aria-hidden="true">
          ✓
        </span>
        <p className="parrafos">
          Guardamos tu pedido <strong>{order.orderNumber}</strong> por{" "}
          <strong>{formatPrice(order.total)}</strong>.
        </p>

        <div className="checkout-success-summary">
          <div>
            <span className="parrafos">Estado</span>
            <strong className="titulos">Pendiente de pago</strong>
          </div>
          <div>
            <span className="parrafos">Entrega estimada</span>
            <strong className="titulos">Hasta 10 días hábiles</strong>
          </div>
          <div>
            <span className="parrafos">Envío</span>
            <strong className="titulos">
              {formatPrice(order.shippingCost)}
            </strong>
          </div>
        </div>

        <ReservationHint />

        <div className="checkout-gate-actions">
          <Link
            to={`/mis-pedidos/${order.id}`}
            className="checkout-primary-link"
          >
            Ver mi pedido
          </Link>
          <Link to="/" className="checkout-secondary-link">
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  </>
);

const Checkout = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const { getArticulos, getDtf } = useContextProvaider();
  const { allProducts, setAllProducts, setTotal, setCountProducts } =
    useCarrito();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [quote, setQuote] = useState(null);
  const [quoteState, setQuoteState] = useState("idle");
  const [quoteError, setQuoteError] = useState("");
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);

  // Snapshot del carrito al entrar: la hidratacion de precios no debe
  // reiniciarse cuando el carrito cambia despues.
  const cartSnapshotRef = useRef(allProducts);

  // Datos del comprador precargados desde la cuenta.
  useEffect(() => {
    if (!currentUser) return;

    setForm((prev) => ({
      ...prev,
      recipientName:
        prev.recipientName ||
        [currentUser.name, currentUser.lastName].filter(Boolean).join(" ") ||
        currentUser.username ||
        "",
      email: prev.email || currentUser.email || "",
    }));
  }, [currentUser]);

  // Refresca precios, stock y disponibilidad del carrito contra el catalogo.
  // Evita cobrar precios viejos y detecta productos eliminados o agotados.
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const snapshot = cartSnapshotRef.current;
      if (snapshot.length === 0) {
        setHydrating(false);
        return;
      }

      try {
        const [articulos, dtfs] = await Promise.all([
          getArticulos(""),
          getDtf(),
        ]);

        if (cancelled) return;

        const fresh = new Map([
          ...articulos.map((item) => [`articulo|${item.id}`, item]),
          ...dtfs.map((item) => [`dtf|${item.id}`, item]),
        ]);

        const next = [];
        let removed = 0;

        snapshot.forEach((product) => {
          const key = `${isDtfProduct(product) ? "dtf" : "articulo"}|${
            product.id
          }`;
          const current = fresh.get(key);

          if (!current || current.stock === false) {
            removed += 1;
            return;
          }

          next.push(
            isDtfProduct(product)
              ? {
                  ...current,
                  cartType: "dtf",
                  category:
                    typeof current.category === "string"
                      ? current.category
                      : current.category?.name ||
                        current.categoryName ||
                        product.category ||
                        "Sin categoría",
                  cantidad: product.cantidad,
                  shirtColor: product.shirtColor,
                  shirtName: product.shirtName,
                  dtfSize: product.dtfSize || "basic",
                }
              : {
                  ...current,
                  cantidad: product.cantidad,
                  talla: product.talla,
                },
          );
        });

        const { total: nextTotal, count: nextCount } = getCartTotals(next);
        setAllProducts(next);
        setTotal(nextTotal);
        setCountProducts(nextCount);

        if (removed > 0) {
          toast.warn(
            removed === 1
              ? "Quitamos un producto que ya no está disponible."
              : `Quitamos ${removed} productos que ya no están disponibles.`,
            { position: "bottom-right" },
          );
        }
      } catch (error) {
        // Sin red o API caida: seguimos con los datos guardados en el carrito.
        console.error("No se pudo actualizar el carrito:", error);
      } finally {
        if (!cancelled) setHydrating(false);
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cotizacion de envio con debounce.
  useEffect(() => {
    const department = form.department.trim();
    const city = form.city.trim();

    if (!department || !city) {
      setQuote(null);
      setQuoteState("idle");
      setQuoteError("");
      return;
    }

    setQuoteState("loading");
    setQuoteError("");

    const timer = setTimeout(async () => {
      try {
        const res = await axios.post(`${API_URL}/api/shipping/quote`, {
          department,
          city,
          ...(coords && { lat: coords.lat, lng: coords.lng }),
        });
        setQuote(res.data);
        setQuoteState("ready");
      } catch (error) {
        setQuote(null);
        setQuoteState("error");
        setQuoteError(
          getApiErrorMessage(
            error,
            "No pudimos calcular el envío para esa dirección.",
          ),
        );
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [form.department, form.city, coords]);

  const { total: subtotal, count: itemCount } = useMemo(
    () => getCartTotals(allProducts),
    [allProducts],
  );

  const shippingCost = quote?.cost || 0;
  const grandTotal = subtotal + shippingCost;

  const updateField = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no permite obtener la ubicación.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
        toast.success("Ubicación agregada al cálculo del envío");
      },
      () => {
        setLocating(false);
        toast.error(
          "No pudimos obtener tu ubicación. El envío se calcula con la ciudad.",
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  };

  const buildErrors = () => {
    const next = {};

    if (form.recipientName.trim().length < 3) {
      next.recipientName = "Escribe el nombre completo de quien recibe";
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      next.email = "Correo electrónico inválido";
    }
    if (form.phone.replace(/\D/g, "").length < 7) {
      next.phone = "Teléfono inválido";
    }
    if (form.address.trim().length < 6) {
      next.address = "Escribe la dirección completa";
    }
    if (!form.department.trim()) {
      next.department = "Selecciona el departamento";
    }
    if (form.city.trim().length < 2) {
      next.city = "Escribe la ciudad o municipio";
    }

    return next;
  };

  const buildItems = () =>
    allProducts.map((product) =>
      isDtfProduct(product)
        ? {
            productType: "dtf",
            productId: product.id,
            quantity: product.cantidad,
            dtfSize: product.dtfSize || "basic",
            shirtColor: product.shirtColor || undefined,
            shirtName: product.shirtName || undefined,
          }
        : {
            productType: "articulo",
            productId: product.id,
            quantity: product.cantidad,
            size: product.talla || undefined,
          },
    );

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = buildErrors();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Revisa los datos marcados en el formulario");
      return;
    }

    if (!quote) {
      toast.error("Calcula el envío antes de confirmar el pedido");
      return;
    }

    setSubmitting(true);

    try {
      const res = await axios.post(
        `${API_URL}/api/orders`,
        {
          items: buildItems(),
          shipping: {
            ...form,
            ...(coords && { lat: coords.lat, lng: coords.lng }),
          },
        },
        { withCredentials: true },
      );

      setCreatedOrder(res.data);
      setAllProducts([]);
      setTotal(0);
      setCountProducts(0);
      window.scrollTo(0, 0);
    } catch (error) {
      const status = error.response?.status;

      if (status === 401) {
        toast.error("Tu sesión expiró. Inicia sesión de nuevo.");
        navigate(`/login?redirect=${encodeURIComponent("/checkout")}`);
        return;
      }

      toast.error(getApiErrorMessage(error, "No pudimos crear el pedido"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) return <CheckoutGate />;
  if (createdOrder) return <CheckoutSuccess order={createdOrder} />;
  if (!hydrating && allProducts.length === 0) return <CheckoutEmpty />;

  if (hydrating) {
    return (
      <div className="checkout-page">
        <div className="checkout-loading">
          <span className="cargador" aria-hidden="true" />
          <p className="parrafos">Verificando precios y disponibilidad…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHero
        title="Finaliza tu pedido"
        subtitle="Revisa tus productos y dinos dónde te los enviamos. El pago se coordina después de confirmar el pedido."
      />

      <div className="checkout-page">
        <Row className="g-4">
        <Col lg={7}>
          <Form onSubmit={handleSubmit} noValidate>
            <section className="checkout-card">
              <h2 className="checkout-section-title titulos">Datos de contacto</h2>

              <Row className="g-3">
                <Col md={6}>
                  <Form.Group controlId="recipientName">
                    <Form.Label className="parrafos">
                      Nombre de quien recibe *
                    </Form.Label>
                    <Form.Control
                      value={form.recipientName}
                      onChange={updateField("recipientName")}
                      isInvalid={Boolean(errors.recipientName)}
                      autoComplete="name"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.recipientName}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId="email">
                    <Form.Label className="parrafos">Correo *</Form.Label>
                    <Form.Control
                      type="email"
                      value={form.email}
                      onChange={updateField("email")}
                      isInvalid={Boolean(errors.email)}
                      autoComplete="email"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId="phone">
                    <Form.Label className="parrafos">Teléfono / WhatsApp *</Form.Label>
                    <Form.Control
                      value={form.phone}
                      onChange={updateField("phone")}
                      isInvalid={Boolean(errors.phone)}
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="300 000 0000"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.phone}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </section>

            <section className="checkout-card">
              <h2 className="checkout-section-title titulos">Dirección de envío</h2>

              <Row className="g-3">
                <Col xs={12}>
                  <Form.Group controlId="address">
                    <Form.Label className="parrafos">Dirección *</Form.Label>
                    <Form.Control
                      value={form.address}
                      onChange={updateField("address")}
                      isInvalid={Boolean(errors.address)}
                      autoComplete="street-address"
                      placeholder="Calle 00 # 00-00, barrio, referencias"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.address}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId="department">
                    <Form.Label className="parrafos">Departamento *</Form.Label>
                    <Form.Select
                      value={form.department}
                      onChange={updateField("department")}
                      isInvalid={Boolean(errors.department)}
                      autoComplete="address-level1"
                    >
                      <option value="">Selecciona…</option>
                      {DEPARTMENTS.map((department) => (
                        <option key={department} value={department}>
                          {department}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.department}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId="city">
                    <Form.Label className="parrafos">Ciudad / municipio *</Form.Label>
                    <Form.Control
                      value={form.city}
                      onChange={updateField("city")}
                      isInvalid={Boolean(errors.city)}
                      autoComplete="address-level2"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.city}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId="postalCode">
                    <Form.Label className="parrafos">
                      Código postal (opcional)
                    </Form.Label>
                    <Form.Control
                      value={form.postalCode}
                      onChange={updateField("postalCode")}
                      autoComplete="postal-code"
                      maxLength={20}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="checkout-location">
                <p className="checkout-help parrafos">
                  Si estás en Medellín puedes compartir tu ubicación para calcular
                  el envío por distancia. Solo la usamos para eso.
                </p>
                <button
                  type="button"
                  className="btn-tema btn-tema--contorno btn-tema--pequeno"
                  onClick={useMyLocation}
                  disabled={locating}
                >
                  {locating ? "Obteniendo ubicación…" : "Usar mi ubicación"}
                </button>
                {coords && (
                  <span className="checkout-coords parrafos">
                    Ubicación agregada ✓
                  </span>
                )}
              </div>

              <div className={`checkout-quote ${quoteState}`}>
                {quoteState === "loading" && (
                  <span className="parrafos">Calculando envío…</span>
                )}
                {quoteState === "idle" && (
                  <span className="parrafos">
                    Selecciona departamento y ciudad para ver el costo del envío.
                  </span>
                )}
                {quoteState === "ready" && quote && (
                  <>
                    <span className="parrafos">{quote.label}</span>
                    <strong className="titulos">{formatPrice(quote.cost)}</strong>
                    {quote.distanceKm !== null && (
                      <small className="parrafos">
                        ~{quote.distanceKm} km desde la bodega
                      </small>
                    )}
                  </>
                )}
                {quoteState === "error" && (
                  <span className="parrafos checkout-quote-error">
                    {quoteError}
                  </span>
                )}
              </div>

              <Form.Group controlId="notes" className="mt-3">
                <Form.Label className="parrafos">
                  Notas para la entrega (opcional)
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={form.notes}
                  onChange={updateField("notes")}
                  maxLength={MAX_NOTES}
                  placeholder="Punto de referencia, horario preferido, nombre del conjunto…"
                />
                <Form.Text className="parrafos">
                  {MAX_NOTES - form.notes.length} caracteres disponibles
                </Form.Text>
              </Form.Group>
            </section>

            <div className="checkout-submit-bar">
              <button
                type="submit"
                className="btn-tema btn-tema--primario checkout-submit"
                disabled={submitting || !quote}
              >
                {submitting
                  ? "Confirmando pedido…"
                  : `Confirmar pedido · ${formatPrice(grandTotal)}`}
              </button>
              <ReservationHint />
            </div>
          </Form>
        </Col>

        <Col lg={5}>
          <aside className="checkout-summary">
            <h2 className="checkout-section-title titulos">
              Tu pedido ({itemCount} {itemCount === 1 ? "artículo" : "artículos"})
            </h2>

            <ul className="checkout-items">
              {allProducts.map((product) => {
                const image = productImage(product);
                const unitPrice = isDtfProduct(product)
                  ? getDtfUnitPrice(product)
                  : getUnitPrice(product);

                return (
                  <li
                    key={getCartItemIdentity(product)}
                    className="checkout-item"
                  >
                    {image && (
                      <div className="checkout-item-image">
                        <img src={image} alt="" />
                      </div>
                    )}
                    <div className="checkout-item-info">
                      <strong className="parrafos">
                        {product.cantidad} × {cartItemTitle(product)}
                      </strong>
                      {cartItemDetails(product).map((detail) => (
                        <small key={detail} className="parrafos">
                          {detail}
                        </small>
                      ))}
                      <small className="parrafos">
                        {formatPrice(unitPrice)} c/u
                      </small>
                    </div>
                    <strong className="checkout-item-total titulos">
                      {formatPrice(unitPrice * product.cantidad)}
                    </strong>
                  </li>
                );
              })}
            </ul>

            <div className="checkout-totals">
              <div className="checkout-total-row parrafos">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div className="checkout-total-row parrafos">
                <span>Envío</span>
                <strong>
                  {quote ? formatPrice(shippingCost) : "Por calcular"}
                </strong>
              </div>
              <div className="checkout-total-row grand titulos">
                <span>Total</span>
                <strong>{formatPrice(grandTotal)}</strong>
              </div>
            </div>

            <p className="checkout-help parrafos">
              El valor final lo calcula el sistema al confirmar el pedido,
              usando los precios y la disponibilidad actuales.
            </p>

            <Link to="/" className="checkout-secondary-link titulos">
              Seguir comprando
            </Link>
          </aside>
        </Col>
        </Row>
      </div>
    </>
  );
};

export default Checkout;
