import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { articulos } from "../Info/Data";
import { Button, Col, Container, Form, Image, Row } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";

const Articulo = () => {
  const location = useLocation();
  const postid = location.pathname.split("/")[1];
  const [selected, setSelected] = useState(null);
  const [mainImage, setMainImage] = useState(selected?.imagen);
  const [cantidad, setCantidad] = useState(1);
  const handleThumbnailClick = (thumbnail) => {
    setMainImage(thumbnail); // Actualiza la imagen principal con la miniatura seleccionada
  };
  useEffect(() => {
    const Data = async () => {
      try {
        const Articulo = await articulos.find((art) => art.id === postid);
        setSelected(Articulo);
      } catch (error) {
        console.error(error);
      }
    };
    Data();
  }, [postid]);

  return (
    <Container className="mt-4">
      <Row>
        <Col md={8} className="d-flex flex-column align-items-center mb-4">
          <Image
            src={mainImage == null ? selected?.imagen[0] : mainImage}
            alt={selected?.titulo}
            fluid
          />
        </Col>

        {/* Columna para los detalles del producto */}
        <Col md={4} className="">
          <h1>{selected?.titulo}</h1>
          <h2 className="text-success">${selected?.precio.toLocaleString()}</h2>

          {/* Columna para las imágenes del producto */}
          <div className="product-thumbnails w-100 d-flex ">
            {/* Aquí puedes mapear las miniaturas si tienes varias imágenes */}
            {selected?.imagen?.map((thumb, index) => (
              <div key={index} className="thumbnail mb-2">
                <Image
                  src={thumb}
                  fluid
                  style={{
                    cursor: "pointer",
                    width: "45px",
                    border: "1px solid white",
                    borderRadius: "50%",
                    margin: "2px 4px",
                    boxShadow: "-1px -1px 8px -2px rgba(0,0,0,0.75)",
                  }}
                  onClick={() => handleThumbnailClick(thumb)}
                />
              </div>
            ))}
          </div>
          <Form>
            {/* Selección de tamaño */}
            <Form.Group controlId="sizeSelect" className="mb-3">
              <h3>Medidas</h3>
              <div class="btn-group" role="group" aria-label="Basic example">
                <button type="button" class="btn btn-light">
                  S
                </button>
                <button type="button" class="btn btn-light">
                  M
                </button>
                <button type="button" class="btn btn-light">
                  L
                </button>
              </div>
            </Form.Group>
            <div>
              <p>Caracteristicas</p>
            </div>

            {/* Cantidad y botones */}
            <div className="d-flex align-items-center">
              <Button
                variant="light"
                className="ml-3 btn btn-outline-secondary btn-sm"
                onClick={() => cantidad >= 2 && setCantidad(cantidad - 1)}
              >
                <FontAwesomeIcon icon={faMinus} />
              </Button>
              <div className="p-4">{cantidad}</div>
              <Button
                variant="light"
                className="ml-3 btn btn-outline-secondary btn-sm"
                onClick={() => setCantidad(cantidad + 1)}
              >
                <FontAwesomeIcon icon={faPlus} />
              </Button>
            </div>
            <div className="d-flex flex-column ">
              <p>Total</p>
              <h3>{(cantidad * selected?.precio).toLocaleString()}</h3>
            </div>

            <button type="button" class="btn btn-outline-dark btn-lg ">
              Comprar
            </button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default Articulo;
