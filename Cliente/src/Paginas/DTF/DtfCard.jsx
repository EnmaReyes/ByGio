import { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBagShopping, faCheck } from "@fortawesome/free-solid-svg-icons";
import { useCarrito } from "../../carrito/CarritoProvider";
import {
  formatPrice,
  getCartItemIdentity,
  getCartTotals,
  getDtfUnitPrice,
} from "../../Componentes/cartUtils";
import useConfirmacion from "../../hooks/useConfirmacion";
import { shirts } from "../../assets/Camisetas/camisetas.js";
import "./DtfCard.css";
const DTF_SCALE = {
  basic: 1,
  oversize: 1.2,
};

const getDtfImageUrl = (item) =>
  typeof item.img === "string" ? item.img : item.img?.[0] || "";

const DtfCard = ({ items = [] }) => {
  const { allProducts, setAllProducts, setTotal, setCountProducts } =
    useCarrito();
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedShirt, setSelectedShirt] = useState(shirts[0]);
  const [dtfSize, setDtfSize] = useState("basic");

  /* Qué diseño acaba de añadirse: el botón de esa tarjeta (y el del
     modal, si es el mismo) pasa a "Añadido" un momento. */
  const [agregadoId, confirmarAgregado] = useConfirmacion();

  const addDtfToCart = (item, shirt, size) => {
    const imageUrl = getDtfImageUrl(item);
    if (!imageUrl) {
      return;
    }

    const dtfSizeFinal = size || "basic";
    const precio = getDtfUnitPrice({ ...item, dtfSize: dtfSizeFinal });

    if (precio <= 0) {
      toast.error("Este diseño no tiene precio configurado todavía.", {
        position: "bottom-right",
        autoClose: 2500,
        hideProgressBar: true,
      });
      return;
    }

    const cartItem = {
      id: item.id,
      cartType: "dtf",
      img: imageUrl,
      category: item.category?.name || item.categoryName || "Sin categoría",
      cantidad: 1,
      precio,
      dtfSize: dtfSizeFinal,
      priceVariants: item.priceVariants || [],
      ...(shirt && {
        shirtColor: shirt.color,
        shirtName: shirt.name,
      }),
    };
    const identity = getCartItemIdentity(cartItem);
    const existingItem = allProducts.find(
      (product) => getCartItemIdentity(product) === identity,
    );
    const updatedProducts = existingItem
      ? allProducts.map((product) =>
          getCartItemIdentity(product) === identity
            ? { ...product, cantidad: product.cantidad + 1 }
            : product,
        )
      : [...allProducts, cartItem];

    const { total, count } = getCartTotals(updatedProducts);
    setAllProducts(updatedProducts);
    setTotal(total);
    setCountProducts(count);
    confirmarAgregado(item.id);
    toast.success("Diseño DTF añadido al carrito", {
      position: "bottom-right",
      autoClose: 1500,
      hideProgressBar: true,
    });
  };

  const openPreview = (item) => {
    setSelectedItem(item);
    setSelectedShirt(shirts[0]);
    setDtfSize("basic");
  };

  const currentScale = DTF_SCALE[dtfSize];

  return (
    <>
      {items.map((item, indice) => (
        <article
          key={item.id}
          className="dtf-grid-item"
          style={{ "--i": indice }}
        >
          <div
            className="dtf-product-card"
            onContextMenu={(e) => e.preventDefault()}
          >
            <button
              type="button"
              className="dtf-design-trigger"
              onClick={() => openPreview(item)}
              aria-label={`Ver ${
                item.category?.name || "diseño DTF"
              } sobre franela`}
            >
              <span className="dtf-design-image">
                <img
                  src={getDtfImageUrl(item)}
                  alt={item.category?.name || "Diseño DTF"}
                  loading="lazy"
                  draggable={false}
                />
              </span>
            </button>

            <div className="dtf-product-info">
              <Button
                type="button"
                variant="outline-dark"
                className="dtf-preview-button"
                onClick={() => openPreview(item)}
              >
                <span>Ver en franela</span>
              </Button>
              {/* <Button
                type="button"
                variant="dark"
                className="w-100 mt-2 d-inline-flex align-items-center justify-content-center gap-2"
                disabled={
                  !getDtfImageUrl(item) ||
                  getDtfUnitPrice({ ...item, dtfSize: "basic" }) <= 0
                }
                onClick={() => addDtfToCart(item)}
              >
                <span
                  className="icono-intercambio"
                  data-estado={agregadoId === item.id ? "b" : "a"}
                  aria-hidden="true"
                >
                  <FontAwesomeIcon icon={faBagShopping} data-icono="a" />
                  <FontAwesomeIcon icon={faCheck} data-icono="b" />
                </span>

                <span
                  className="intercambio-texto"
                  data-estado={agregadoId === item.id ? "b" : "a"}
                  aria-hidden="true"
                >
                  <span data-texto="a">Carrito</span>
                  <span data-texto="b">Añadido</span>
                </span>
                <span className="solo-lector">
                  {agregadoId === item.id
                    ? "Diseño añadido al carrito"
                    : "Añadir al carrito"}
                </span>
              </Button> */}
            </div>
          </div>
        </article>
      ))}

      <Modal
        show={Boolean(selectedItem)}
        onHide={() => setSelectedItem(null)}
        centered
        size="lg"
        fullscreen="sm-down"
        className="dtf-preview-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title className="titulos">Vista sobre franela</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedItem && (
            <div className="dtf-preview-layout">
              {/* =========================
                  MOCKUP
              ========================= */}
              <div
                className="dtf-shirt-stage"
                aria-label={`Vista previa con franela ${selectedShirt.name}`}
              >
                <img
                  className="dtf-shirt-image"
                  src={selectedShirt.image}
                  alt={`Franela ${selectedShirt.name}`}
                />

                <img
                  className="dtf-shirt-design"
                  src={getDtfImageUrl(selectedItem)}
                  alt="Diseño DTF colocado sobre la franela"
                  style={{
                    transform: `translate(-50%, -50%) scale(${currentScale})`,
                  }}
                />
              </div>

              {/* =========================
                  CONTROLES
              ========================= */}
              <div className="dtf-preview-controls">
                {/* =========================
                    COLOR DE FRANELA
                ========================= */}
                <section className="dtf-control-group">
                  <h3 className="parrafos">Color de franela</h3>

                  <div className="dtf-shirt-options">
                    {shirts.map((shirt) => (
                      <button
                        key={shirt.id}
                        type="button"
                        className={`dtf-shirt-option ${
                          selectedShirt.id === shirt.id ? "selected" : ""
                        }`}
                        onClick={() => setSelectedShirt(shirt)}
                        aria-label={`Franela ${shirt.name}`}
                        aria-pressed={selectedShirt.id === shirt.id}
                      >
                        <img src={shirt.image} alt="" aria-hidden="true" />

                        <span>{shirt.name}</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* =========================
                    TAMAÑO DEL DTF
                ========================= */}
                <section className="dtf-control-group">
                  <h3 className="parrafos">Tamaño del DTF</h3>

                  <div className="dtf-size-options">
                    <button
                      type="button"
                      className={`dtf-size-option ${
                        dtfSize === "basic" ? "selected" : ""
                      }`}
                      onClick={() => setDtfSize("basic")}
                      aria-pressed={dtfSize === "basic"}
                    >
                      <span>Básico</span>
                      <span className="dtf-size-precio">
                        {formatPrice(
                          getDtfUnitPrice({
                            ...selectedItem,
                            dtfSize: "basic",
                          }),
                        )}
                      </span>
                    </button>

                    <button
                      type="button"
                      className={`dtf-size-option ${
                        dtfSize === "oversize" ? "selected" : ""
                      }`}
                      onClick={() => setDtfSize("oversize")}
                      aria-pressed={dtfSize === "oversize"}
                    >
                      <span>Oversize</span>
                      <span className="dtf-size-precio">
                        {formatPrice(
                          getDtfUnitPrice({
                            ...selectedItem,
                            dtfSize: "oversize",
                          }),
                        )}
                      </span>
                    </button>
                  </div>
                </section>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            variant="dark"
            className="d-inline-flex align-items-center justify-content-center gap-2"
            disabled={
              !selectedItem ||
              !getDtfImageUrl(selectedItem) ||
              getDtfUnitPrice({ ...selectedItem, dtfSize }) <= 0
            }
            onClick={() => addDtfToCart(selectedItem, selectedShirt, dtfSize)}
          >
            <span
              className="icono-intercambio"
              data-estado={
                selectedItem && agregadoId === selectedItem.id ? "b" : "a"
              }
              aria-hidden="true"
            >
              <FontAwesomeIcon icon={faBagShopping} data-icono="a" />
              <FontAwesomeIcon icon={faCheck} data-icono="b" />
            </span>

            <span
              className="intercambio-texto"
              data-estado={
                selectedItem && agregadoId === selectedItem.id ? "b" : "a"
              }
              aria-hidden="true"
            >
              <span data-texto="a">Carrito</span>
              <span data-texto="b">Añadido</span>
            </span>

            <span className="solo-lector">
              {selectedItem && agregadoId === selectedItem.id
                ? "Diseño añadido al carrito"
                : "Añadir al carrito"}
            </span>
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DtfCard;
