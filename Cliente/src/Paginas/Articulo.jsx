import React, { useEffect, useState } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import { articulos } from "../Info/Data";
import { Button, Col, Container, Form, Image, Row } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";

const Articulo = () => {
  const location = useLocation();
  const postid = location.pathname.split("/")[1];
  const [selected, setSelected] = useState(null);
  const [mainImage, setMainImage] = useState(selected?.imagen);
  const [conteo, setConteo] = useState(1);

  //! carrtio \\
  const {
    allProducts,
    setAllProducts,
    total,
    setTotal,
    countProducts,
    setCountProducts,
  } = useOutletContext();

  const añadirCarrito = (selected, conteo) => {
    if (allProducts.find((item) => item.id === selected.id)) {
      const products = allProducts.map((item) =>
        item.id === selected.id
          ? { ...item, cantidad: conteo + item.cantidad }
          : item
      );
      setTotal(total + selected.precio * selected.cantidad);
      setCountProducts(countProducts + conteo);
      return setAllProducts([...products]);
    }

    setTotal(total + selected.precio * conteo);
    setCountProducts(countProducts + conteo);
    setAllProducts([...allProducts, { ...selected, cantidad: conteo }]);
  };

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
    <Container className="mb-4" style={{ paddingTop: "90px" }}>
      <Row>
        <Col xs={12} md={6} className="d-flex flex-column align-items-center">
          <Image
            className="rounded"
            src={mainImage == null ? selected?.imagen[0] : mainImage}
            alt={selected?.titulo}
            fluid
            style={{ objectFit: "cover" }}
          />
        </Col>

        {/* Columna para los detalles del producto */}
        <Col
          xs={12}
          md={4}
          className="d-flex flex-column text-center text-md-start xs-center"
        >
          <div className="w-100">
            <h1
              className="text-center text-md-start"
              style={{
                fontSize: "2.8rem",
                fontFamily: "Lobster, sans-serif",
              }}
            >
              {selected?.titulo}
            </h1>
            <h2 className="text-success text-md-start">
              ${selected?.precio.toLocaleString()}
            </h2>

            <div className="product-thumbnails w-100 d-flex justify-content-center justify-content-md-start">
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
              <Form.Group controlId="sizeSelect" className="mb-3">
                <h3>Medidas</h3>
                <div
                  className="btn-group"
                  role="group"
                  aria-label="Basic example"
                >
                  <button type="button" className="btn btn-light">
                    S
                  </button>
                  <button type="button" className="btn btn-light">
                    M
                  </button>
                  <button type="button" className="btn btn-light">
                    L
                  </button>
                </div>
              </Form.Group>

              <div>
                <p>Caracteristicas</p>
              </div>

              <div className="d-flex align-items-center justify-content-center justify-content-md-start">
                <Button
                  variant="light"
                  className="ml-3 btn btn-outline-secondary btn-sm"
                  onClick={() => conteo >= 2 && setConteo(conteo - 1)}
                >
                  <FontAwesomeIcon icon={faMinus} />
                </Button>
                <div className="p-4">{conteo}</div>
                <Button
                  variant="light"
                  className="ml-3 btn btn-outline-secondary btn-sm"
                  onClick={() => setConteo(conteo + 1)}
                >
                  <FontAwesomeIcon icon={faPlus} />
                </Button>
              </div>

              <div className="d-flex flex-column justify-content-center justify-content-md-start">
                <p className="m-0">Total</p>
                <h3>{(conteo * selected?.precio).toLocaleString()}</h3>
              </div>

              <div className="d-grid gap-2">
                <button
                  type="button"
                  className="btn btn-dark btn-lg rounded-pill"
                >
                  Comprar
                </button>
                <button
                  type="button"
                  className="btn btn-outline-dark btn-lg rounded-pill"
                  onClick={() => {
                    añadirCarrito(selected, conteo);
                  }}
                >
                  Carrito
                </button>
              </div>
            </Form>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Articulo;
