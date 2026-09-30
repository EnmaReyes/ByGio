import { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { shirts } from "../../assets/Camisetas/camisetas.js";
import "./DtfCard.css";
const DTF_SCALE = {
  basic: 0.80,
  oversize: 0.99,
};

const DtfCard = ({ items = [] }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedShirt, setSelectedShirt] = useState(shirts[0]);
  const [dtfSize, setDtfSize] = useState("basic");

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
          <div className="dtf-product-card">
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
                  src={item.img}
                  alt={item.category?.name || "Diseño DTF"}
                  loading="lazy"
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
                  src={selectedItem.img}
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
                      <small>60%</small>
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
                      <small>80%</small>
                    </button>
                  </div>
                </section>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default DtfCard;
