import React, {
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Col, Container, Row } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBagShopping,
  faCheck,
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
} from "../../Componentes/toastConfig/toastconfigs.jsx";
import "./Articulo.css";
import "swiper/css";
import "swiper/css/pagination";
import axios from "axios";
import { API_URL } from "../../config.js";
import { AuthContext } from "../../context/authContext.jsx";
import { useCarrito } from "../../carrito/CarritoProvider";
import useConfirmacion from "../../hooks/useConfirmacion";
import ArticulosSimilares from "./ArticulosSimilares";
import BandaEditorial from "../../Componentes/BandaEditorial";
import BandaBeneficios from "../../Componentes/BandaBeneficios";
import {
  getPreviousPrice,
  getUnitPrice,
} from "../../Componentes/cartUtils";

const URL = API_URL;

// Componente para el carrusel de imágenes
const ImageGallery = ({ images, titulo }) => {
  if (!images?.length) {
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center w-100"
        style={{ minHeight: "400px" }}
      >
        <span className="cargador" aria-hidden="true" />
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
            alt={`${titulo || "Producto"} — imagen ${index + 1}`}
            className="w-100"
            style={{ objectFit: "contain" }}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

const formatearPrecio = (valor) => `$${(Number(valor) || 0).toLocaleString()}`;

/* Tallas como chips discretos (estilo Sabina): sin tarjeta ni
   encabezado grande, solo una etiqueta corta y los botones. */
const SizeSelector = ({ sizes, oversize, selectedSize, onSizeChange }) => (
  <div className="detalle-grupo">
    <span className="detalle-etiqueta" id="detalle-talla">
      Talla
    </span>

    {oversize ? (
      <p className="detalle-talla-unica">Oversize</p>
    ) : (
      <div className="detalle-tallas" role="group" aria-labelledby="detalle-talla">
        {sizes?.map((size) => (
          <button
            key={size}
            type="button"
            className={`detalle-talla${selectedSize === size ? " is-activa" : ""}`}
            onClick={() => onSizeChange(size)}
            aria-pressed={selectedSize === size}
          >
            {size}
          </button>
        ))}
      </div>
    )}
  </div>
);

// Cantidad: un solo control compacto, sin caja alrededor.
const QuantitySelector = ({ quantity, onIncrement, onDecrement }) => (
  <div className="detalle-grupo">
    <span className="detalle-etiqueta" id="detalle-cantidad">
      Cantidad
    </span>

    <div
      className="detalle-cantidad"
      role="group"
      aria-labelledby="detalle-cantidad"
    >
      <button
        type="button"
        className="detalle-cantidad-btn"
        onClick={onDecrement}
        disabled={quantity <= 1}
        aria-label="Quitar una unidad"
      >
        <FontAwesomeIcon icon={faMinus} aria-hidden="true" />
      </button>

      <span className="detalle-cantidad-valor" aria-live="polite">
        {quantity}
      </span>

      <button
        type="button"
        className="detalle-cantidad-btn"
        onClick={onIncrement}
        aria-label="Añadir una unidad"
      >
        <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
      </button>
    </div>
  </div>
);

/* Precio como en Sabina: una línea debajo del título. El total
   manda (unidades × precio) y la unidad queda como nota. */
const PriceInfo = ({ price, previousPrice, quantity }) => {
  const unitario = Number(price) || 0;
  const anterior = Number(previousPrice) || 0;
  const hayDescuento = anterior > unitario && unitario > 0;

  return (
    <p className="detalle-precio">
      <span className="detalle-precio-valor">
        {formatearPrecio(unitario * quantity)}
      </span>

      {hayDescuento && (
        <s className="detalle-precio-anterior">
          {formatearPrecio(anterior * quantity)}
        </s>
      )}

      {quantity > 1 && (
        <span className="detalle-precio-nota">
          {formatearPrecio(unitario)} por unidad
        </span>
      )}
    </p>
  );
};

/* Acordeón nativo: el navegador ya trae teclado y semántica.
   `abiertoPorDefecto` se aplica una sola vez al montar (con `open`
   fijo, cualquier re-render volvería a abrirlo). */
const Acordeon = ({ titulo, children, abiertoPorDefecto = false }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (abiertoPorDefecto && ref.current) ref.current.open = true;
  }, [abiertoPorDefecto]);

  return (
    <details ref={ref} className="detalle-acordeon">
      <summary>
        <span>{titulo}</span>
        <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
      </summary>
      <div className="detalle-acordeon-cuerpo">{children}</div>
    </details>
  );
};

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
  } = useCarrito();

  // El botón confirma "Añadido" durante un momento después de añadir.
  const [agregadoId, confirmarAgregado] = useConfirmacion();

  // Agregar al carrito con lógica limpia
  const handleAddToCart = useCallback(() => {
    if (selected?.stock === false) return;

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

    setTotal(total + getUnitPrice(selected) * conteo);
    setCountProducts(countProducts + conteo);
    confirmarAgregado(selected.id);
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
    confirmarAgregado,
  ]);

  // Generar link de WhatsApp
  const generateWhatsAppLink = useCallback(() => {
    const precio = getUnitPrice(selected);

    if (!selected?.title || !precio || !imagens?.[0]) {
      return "#";
    }

    const talla = selected.oversize ? "Over Size" : medidas;
    const message = `¡Hola!😁 Estoy interesado en:\n${conteo} ${selected.title}\nTalla: ${talla}\nValor: $${precio.toLocaleString()} por unidad`;
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

  // Producto que acaba de añadirse (para el texto "Añadido" del botón).
  const recienAgregado = agregadoId !== null && agregadoId === selected?.id;

  // Stock booleano: `false` significa agotado (sin cantidades).
  const agotado = selected?.stock === false;

  return (
    <div className="producto-detalle">
      <Container>
        {loading ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: "500px" }}
          >
            <span className="cargador" aria-hidden="true" />
          </div>
        ) : (
          <Row className="g-4 align-items-start">
            {/* Galería de imágenes */}
            <Col lg={6} className="mb-4">
              <div className="product-image-container overflow-hidden">
                <ImageGallery images={imagens} titulo={selected?.title} />
              </div>
            </Col>

            {/* Detalles del producto */}
            <Col lg={6}>
              <div className="product-details">
                <h1 className="detalle-titulo">{selected?.title}</h1>

                <PriceInfo
                  price={getUnitPrice(selected)}
                  previousPrice={getPreviousPrice(selected)}
                  quantity={conteo}
                />

                <div className="detalle-opciones">
                  <SizeSelector
                    sizes={sizes}
                    oversize={selected.oversize}
                    selectedSize={medidas}
                    onSizeChange={setMedidas}
                  />

                  <QuantitySelector
                    quantity={conteo}
                    onIncrement={() => setConteo(conteo + 1)}
                    onDecrement={() => conteo > 1 && setConteo(conteo - 1)}
                  />
                </div>

                <div className="detalle-acciones">
                  {agotado ? (
                    <p className="detalle-agotado" role="status">
                      Este producto está agotado por el momento.
                    </p>
                  ) : (
                    <>
                      <a
                        href={generateWhatsAppLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-pedido"
                      >
                        Hacer pedido
                      </a>

                      <button
                        type="button"
                        onClick={handleAddToCart}
                        className={`btn-anadir${
                          recienAgregado ? " btn-anadir--hecho" : ""
                        }`}
                      >
                        <span
                          className="icono-intercambio"
                          data-estado={recienAgregado ? "b" : "a"}
                          aria-hidden="true"
                        >
                          <FontAwesomeIcon
                            icon={faBagShopping}
                            data-icono="a"
                          />
                          <FontAwesomeIcon icon={faCheck} data-icono="b" />
                        </span>

                        <span
                          className="intercambio-texto"
                          data-estado={recienAgregado ? "b" : "a"}
                          aria-hidden="true"
                        >
                          <span data-texto="a">Añadir al carrito</span>
                          <span data-texto="b">Añadido</span>
                        </span>

                        {/* Nombre accesible del botón: el texto visible está
                            duplicado (apilado) para el intercambio. */}
                        <span className="solo-lector">
                          {recienAgregado
                            ? "Añadido al carrito"
                            : "Añadir al carrito"}
                        </span>
                      </button>
                    </>
                  )}
                </div>

                <ul className="detalle-puntos">
                  <li>{selected.oversize ? "Corte oversize" : "Corte básico"}</li>
                  <li>
                    {sizes.length
                      ? `Tallas ${sizes.join(" · ")}`
                      : "Talla única"}
                  </li>
                  <li>Envío nacional</li>
                  <li>Diseño DTF disponible</li>
                </ul>

                <div className="detalle-acordeones">
                  {selected?.desc && (
                    <Acordeon titulo="Descripción" abiertoPorDefecto>
                      <p>{selected.desc}</p>
                    </Acordeon>
                  )}

                  <Acordeon titulo="Envíos y devoluciones">
                    <p>
                      Despachamos a toda Colombia. Si tu pedido no llega como
                      esperabas, escríbenos por WhatsApp y buscamos la solución.
                    </p>
                  </Acordeon>

                  <Acordeon titulo="Tallas y ajuste">
                    <p>
                      {selected.oversize
                        ? "Corte oversize: hombros caídos y cuerpo amplio, pensado para quedar holgado."
                        : `Tallas disponibles: ${sizes.join(", ") || "consulta por WhatsApp"}. Si estás entre dos, elige la menor para un ajuste más ceñido.`}
                    </p>
                  </Acordeon>
                </div>

                {/* Acciones de administrador */}
                {currentUser?.admin && (
                  <div className="admin-actions d-flex gap-2 p-3 rounded-3">
                    <Link to="/editor?edit=2" state={selected} className="btn-admin">
                      <FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" />
                      Editar
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        notify(
                          handleDeleteArticle,
                          "¿Deseas eliminar este artículo?",
                        )
                      }
                      className="btn-admin btn-admin--peligro"
                    >
                      <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        )}
      </Container>

      {!loading && (
        <>
          {/* Divisor editorial entre el detalle y los relacionados. */}
          <BandaEditorial />

          {/* Debajo del detalle, la rejilla de productos relacionados. */}
          <ArticulosSimilares actualId={postid} />
        </>
      )}

      {/* Cierre de la página, justo antes del pie. */}
      <BandaBeneficios />
    </div>
  );
};

export default Articulo;
