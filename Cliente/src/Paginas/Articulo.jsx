import React, {
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import { Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMinus,
  faPenToSquare,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { toast } from "react-toastify";
import {
  notify,
  toastComments,
} from "../Componentes/toastConfig/toastconfigs.jsx";
import "../App.css";
import "./Articulo.css";
import "swiper/css";
import "swiper/css/pagination";
import axios from "axios";
import { API_URL } from "../config";
import { AuthContext } from "../context/authContext.jsx";

// Constants
const URL = API_URL;
const COLORS = {
  primary: "#000000",
  secondary: "#FFFFFF",
  accent: "#D4AF37",
  darkAccent: "#B8960F",
  lightAccent: "#E5C158",
};

// Componente para el carrusel de imágenes
const ImageGallery = ({ images }) => {
  if (!images?.length) {
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center w-100"
        style={{ minHeight: "400px" }}
      >
        <Spinner animation="border" variant="dark" />
      </div>
    );
  }

  return (
    <Swiper
      pagination={true}
      modules={[Pagination]}
      className="mySwiper product-gallery"
    >
      {images.map((img, index) => (
        <SwiperSlide key={index} className="p-md-2">
          <img
            src={img}
            alt={`Producto ${index + 1}`}
            className="w-100"
            style={{ objectFit: "cover" }}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

// Componente para selector de tallas
const SizeSelector = ({ sizes, oversize, selectedSize, onSizeChange }) => {
  if (oversize) {
    return (
      <div className="text-center mb-3">
        <h2
          className="titulos"
          style={{ color: COLORS.accent, fontSize: "2rem" }}
        >
          Over Sizes
        </h2>
      </div>
    );
  }

  return (
    <div className="size-selector mb-3">
      <h3 className="mb-2 parrafos fw-bold">Selecciona tu Talla</h3>
      <div className="d-flex gap-2 justify-content-center flex-wrap">
        {sizes?.map((size) => (
          <button
            key={size}
            type="button"
            className={`btn btn-outline-dark fw-bold ${
              selectedSize === size ? "active-size" : ""
            }`}
            onClick={() => onSizeChange(size)}
            style={{
              borderColor:
                selectedSize === size ? COLORS.accent : COLORS.primary,
              backgroundColor:
                selectedSize === size ? COLORS.accent : "transparent",
              color: selectedSize === size ? COLORS.primary : COLORS.primary,
              transition: "all 0.3s ease-in-out",
              minWidth: "60px",
            }}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
};

// Componente para cantidad
const QuantitySelector = ({ quantity, onIncrement, onDecrement }) => (
  <div
    className="quantity-selector d-flex align-items-center justify-content-center gap-3 my-4 p-3 rounded-3"
    style={{ backgroundColor: "#F5F5F5" }}
  >
    <Button
      variant="outline-dark"
      className="btn-sm fw-bold"
      onClick={onDecrement}
      disabled={quantity <= 1}
      style={{ borderRadius: "8px" }}
    >
      <FontAwesomeIcon icon={faMinus} />
    </Button>
    <span
      className="titulos fs-4 fw-bold"
      style={{ minWidth: "40px", textAlign: "center" }}
    >
      {quantity}
    </span>
    <Button
      variant="outline-dark"
      className="btn-sm fw-bold"
      onClick={onIncrement}
      style={{ borderRadius: "8px" }}
    >
      <FontAwesomeIcon icon={faPlus} />
    </Button>
  </div>
);

// Componente para información de precio
const PriceInfo = ({ price, quantity }) => (
  <div
    className="price-info mb-4 p-3 rounded-3"
    style={{
      backgroundColor: "#F9F9F9",
      borderLeft: `4px solid ${COLORS.accent}`,
    }}
  >
    <p className="mb-2 parrafos text-muted">Precio unitario</p>
    <h3
      className="titulos mb-3"
      style={{ color: COLORS.accent, fontSize: "1.8rem" }}
    >
      ${price?.toLocaleString()}
    </h3>
    <hr />
    <p className="mb-2 parrafos text-muted">Total</p>
    <h2
      className="titulos fw-bold"
      style={{ color: COLORS.primary, fontSize: "2rem" }}
    >
      ${(price * quantity).toLocaleString()}
    </h2>
  </div>
);

// Componente principal
const Articulo = () => {
  const location = useLocation();
  const postid = location.pathname.split("/")[1];
  const [selected, setSelected] = useState({});
  const [conteo, setConteo] = useState(1);
  const [medidas, setMedidas] = useState("S");
  const [loading, setLoading] = useState(true);
  const { currentUser } = useContext(AuthContext);
  const PhoneNumber = import.meta.env.VITE_NUMBER_PHONE;
  const navigate = useNavigate();

  // Fetch artículo
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${URL}/api/posts/${postid}`);
        setSelected(res.data);
        window.scrollTo(0, 0);
      } catch (error) {
        console.error("Error al obtener el producto:", error);
        toast.error("Error al cargar el producto");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postid]);

  // Parse datos
  const sizes = useMemo(() => {
    return typeof selected.sizes === "string"
      ? JSON.parse(selected.sizes)
      : selected.sizes || [];
  }, [selected.sizes]);

  const imagens = useMemo(() => {
    return typeof selected.img === "string"
      ? JSON.parse(selected.img)
      : selected.img || [];
  }, [selected.img]);

  // Contexto del carrito
  const {
    allProducts,
    setAllProducts,
    total,
    setTotal,
    countProducts,
    setCountProducts,
  } = useOutletContext();

  // Agregar al carrito con lógica limpia
  const handleAddToCart = useCallback(() => {
    const existingProduct = allProducts.find(
      (item) => item.id === selected.id && item.talla === medidas,
    );

    if (existingProduct) {
      setAllProducts(
        allProducts.map((item) =>
          item.id === selected.id && item.talla === medidas
            ? { ...item, cantidad: item.cantidad + conteo }
            : item,
        ),
      );
    } else {
      setAllProducts([
        ...allProducts,
        { ...selected, cantidad: conteo, talla: medidas },
      ]);
    }

    setTotal(total + selected.cost * conteo);
    setCountProducts(countProducts + conteo);
    toast.success("Producto añadido al carrito", toastComments);
  }, [
    allProducts,
    selected,
    conteo,
    medidas,
    total,
    countProducts,
    setAllProducts,
    setTotal,
    setCountProducts,
  ]);

  // Generar link de WhatsApp
  const generateWhatsAppLink = useCallback(() => {
    if (!selected?.title || !selected?.cost || !imagens?.[0]) {
      return "#";
    }

    const talla = selected.oversize ? "Over Size" : medidas;
    const message = `¡Hola!😁 Estoy interesado en:\n${conteo} ${selected.title}\nTalla: ${talla}\nValor: $${selected.cost.toLocaleString()} por unidad`;
    const imageLink = imagens[0];

    return `https://wa.me/${PhoneNumber}?text=${encodeURIComponent(message)}%0A%0A${encodeURIComponent(imageLink)}`;
  }, [selected, conteo, medidas, imagens, PhoneNumber]);

  // Eliminar artículo
  const handleDeleteArticle = useCallback(async () => {
    try {
      await axios.delete(`${URL}/api/posts/${postid}`, {
        withCredentials: true,
      });
      toast.success("Producto eliminado exitosamente", toastComments);
      navigate("/");
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
      toast.error("Error al eliminar el producto");
    }
  }, [postid, navigate]);

  return (
    <Container
      fluid
      className="py-5"
      style={{ backgroundColor: "#FAFAFA", minHeight: "100vh" }}
    >
      <Container className="mt-4">
        {loading ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: "500px" }}
          >
            <Spinner animation="border" variant="dark" />
          </div>
        ) : (
          <Row className="g-4 align-items-start">
            {/* Galería de imágenes */}
            <Col lg={6} className="mb-4">
              <div
                className="product-image-container rounded-4 overflow-hidden shadow-sm"
                style={{ backgroundColor: COLORS.secondary }}
              >
                <ImageGallery images={imagens} />
              </div>
            </Col>

            {/* Detalles del producto */}
            <Col lg={6}>
              <div className="product-details">
                {/* Título y descripción */}
                <h1
                  className="titulos mb-3"
                  style={{ fontSize: "2.5rem", color: COLORS.primary }}
                >
                  {selected?.title}
                </h1>

                <p
                  className="parrafos text-muted mb-4"
                  style={{ fontSize: "1rem", lineHeight: "1.6" }}
                >
                  {selected?.desc}
                </p>

                {/* Selector de tallas */}
                <SizeSelector
                  sizes={sizes}
                  oversize={selected.oversize}
                  selectedSize={medidas}
                  onSizeChange={setMedidas}
                />

                {/* Información de precio */}
                <PriceInfo price={selected?.cost} quantity={conteo} />

                {/* Selector de cantidad */}
                <QuantitySelector
                  quantity={conteo}
                  onIncrement={() => setConteo(conteo + 1)}
                  onDecrement={() => conteo > 1 && setConteo(conteo - 1)}
                />

                {/* Botones de acción */}
                <div className="d-grid gap-3 mb-4">
                  <Button
                    as="a"
                    href={generateWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-lg fw-bold parrafos rounded-3"
                    style={{
                      backgroundColor: COLORS.primary,
                      borderColor: COLORS.primary,
                      color: COLORS.secondary,
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = COLORS.accent;
                      e.target.style.borderColor = COLORS.accent;
                      e.target.style.color = COLORS.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = COLORS.primary;
                      e.target.style.borderColor = COLORS.primary;
                      e.target.style.color = COLORS.secondary;
                    }}
                  >
                    Hacer Pedido
                  </Button>

                  <Button
                    onClick={handleAddToCart}
                    className="btn btn-lg fw-bold parrafos rounded-3"
                    style={{
                      backgroundColor: "transparent",
                      border: `2px solid ${COLORS.accent}`,
                      color: COLORS.accent,
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = COLORS.accent;
                      e.target.style.color = COLORS.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = COLORS.accent;
                    }}
                  >
                    🛒 Añadir al Carrito
                  </Button>
                </div>

                {/* Acciones de administrador */}
                {currentUser?.admin && (
                  <div
                    className="admin-actions d-flex gap-2 p-3 rounded-3"
                    style={{
                      backgroundColor: "#F5F5F5",
                      border: `2px solid ${COLORS.accent}`,
                    }}
                  >
                    <Link
                      className=""
                      to={`/editor?edit=2`}
                      state={selected}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = COLORS.darkAccent;
                        e.target.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = COLORS.accent;
                        e.target.style.transform = "scale(1)";
                      }}
                    >
                      <Button
                        className="btn btn-sm fw-bold parrafos rounded-2 flex-grow-1"
                        style={{
                          backgroundColor: COLORS.accent,
                          color: COLORS.primary,
                          border: "none",
                          transition: "all 0.3s ease",
                          padding: "0.5rem 1rem",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faPenToSquare}
                          className="me-2"
                        />
                        Editar
                      </Button>
                    </Link>
                    <Button
                      onClick={() =>
                        notify(
                          handleDeleteArticle,
                          "¿Deseas eliminar este artículo?",
                        )
                      }
                      className="btn btn-sm fw-bold parrafos rounded-2 flex-grow-1"
                      style={{
                        backgroundColor: "#FF6B6B",
                        color: COLORS.secondary,
                        border: "none",
                        transition: "all 0.3s ease",
                        padding: "0.5rem 1rem",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#FF5252";
                        e.target.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#FF6B6B";
                        e.target.style.transform = "scale(1)";
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} className="me-2" />
                      Eliminar
                    </Button>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        )}
      </Container>
    </Container>
  );
};

export default Articulo;
