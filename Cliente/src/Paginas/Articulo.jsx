import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { articulos } from "../Info/Data";
import { Button, Col, Container, Form, Image, Row } from "react-bootstrap";

const Articulo = () => {
  const location = useLocation();
  const postid = location.pathname.split("/")[1];
  const [selected, setSelected] = useState(null);

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
    <Container className="mt-5">
      <Row>
        {/* Columna para las imágenes del producto */}
        <Col md={4} className="d-flex flex-column align-items-center">
          <div className="product-thumbnails mb-3">
            {/* Aquí puedes mapear las miniaturas si tienes varias imágenes */}
            {selected?.imagen?.map((thumb, index) => (
              <div key={index} className="thumbnail mb-2">
                <Image
                  src={thumb}
                  thumbnail
                  fluid
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    /* función para cambiar la imagen principal */
                  }}
                />
              </div>
            ))}
          </div>
          <Image src={selected?.imagen} alt={selected?.titulo} fluid />
        </Col>

        {/* Columna para los detalles del producto */}
        <Col md={8}>
          <h1>{selected?.titulo}</h1>
          <h2 className="text-success">${selected?.precio}</h2>

          <Form>
            {/* Selección de tamaño */}
            <Form.Group controlId="sizeSelect" className="mb-3">
              <Form.Label>SIZE</Form.Label>
              <Form.Control as="select">
                <option>Choose an option</option>
                {/* Aquí podrías mapear las opciones de tamaños */}
              </Form.Control>
            </Form.Group>

            {/* Selección de color */}
            <Form.Group controlId="colorSelect" className="mb-3">
              <Form.Label>COLOR</Form.Label>
              <Form.Control as="select">
                <option>Choose an option</option>
                {/* Aquí podrías mapear las opciones de colores */}
              </Form.Control>
            </Form.Group>

            {/* Cantidad y botones */}
            <div className="d-flex align-items-center mb-3">
              <Form.Control
                type="number"
                defaultValue="1"
                min="1"
                style={{ width: "60px" }}
              />
              <Button variant="primary" className="ml-3">
                ADD TO BASKET
              </Button>
            </div>

            <Button variant="light" className="mt-3">
              ADD TO WISHLIST
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default Articulo;
