import { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCartItemIdentity,
  getCartTotals,
} from "../../Componentes/cartUtils";
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
    useOutletContext();
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedShirt, setSelectedShirt] = useState(shirts[0]);
  const [dtfSize, setDtfSize] = useState("basic");

  const addDtfToCart = (item, shirt, size) => {
    const imageUrl = getDtfImageUrl(item);
    if (!imageUrl) {
      return;
    }

    const cartItem = {
      id: item.id,
      cartType: "dtf",
      img: imageUrl,
      category: item.category?.name || item.categoryName || "Sin categoría",
      cantidad: 1,
      cost: 0,
      ...(shirt && {
        shirtColor: shirt.color,
        shirtName: shirt.name,
        dtfSize: size,
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
      {items.map((item) => (
        <article key={item.id} className="dtf-grid-item">
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
              <Button
                type="button"
                variant="dark"
                className="w-100 mt-2"
                disabled={!getDtfImageUrl(item)}
                onClick={() => addDtfToCart(item)}
              >
                <span>Carrito</span>
              </Button>
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
            disabled={!selectedItem || !getDtfImageUrl(selectedItem)}
            onClick={() => addDtfToCart(selectedItem, selectedShirt, dtfSize)}
          >
            <span>Carrito</span>
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DtfCard;
