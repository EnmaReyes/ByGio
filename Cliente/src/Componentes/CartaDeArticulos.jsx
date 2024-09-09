import React, { useEffect, useState } from "react";
import { Button, Card, Col, Container, Row } from "react-bootstrap";
import "../App.css";
import { articulos } from "../Info/Data";
import { Link } from "react-router-dom";

const CartaDeArticulos = () => {
  const [articulo, setArticulo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
         setArticulo(articulos);
      } catch (error) {}
    };
    fetchData();
  }, [articulos]);

  const URL = "https://bygio.onrender.com";

  const generateWhatsAppLink = (art) => {
    const message = `¡Hola!😁 Estoy interesado en ${art.titulo} que cuesta $${art.precio}. ¿Está disponible en talla S / M / L?`;
    const imageLink = `${URL}${art.imagen}`;
    const whatsappLink = `https://wa.me/573128919861?text=${encodeURIComponent(
      message
    )}%0A%0A${encodeURIComponent(imageLink)}`;
    return whatsappLink;
  };
  return (
    <Container className="">
      <Row>
        {articulo?.map((art) => (
          <Col key={art.id} xs={6} sm={6} md={4} className="mb-2">
            <Card className="mt-4 " style={{ width: "100%" }}>
              <Link to={`/${art.id}`}>
              <div style={{ height: "100%", overflow: "hidden" }}>
                <Card.Img
                  src={art.imagen[0]}
                  className="img-fluid"
                  variant="top"
                  style={{ height: "100%", width: "100%", objectFit: "cover" }}
                />
              </div>
              </Link>
              <Card.Body className="m-0 p-2 ">
                <Card.Title className="text-center m-0" style={{fontFamily: "Lobster, sans-serif",}}>
                  {art.titulo}
                </Card.Title>
                <Card.Text className="text-center m-0">S / M / L</Card.Text>
                <div className="text-center">
                  <Card.Text className="fw-bold m-0">
                    {`$${art.precio.toLocaleString()}`}
                  </Card.Text>
                  <Button
                    variant="dark"
                    className="text-warning"
                    href={generateWhatsAppLink(art)}
                    target="_blank"
                  >
                    Comprar
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default CartaDeArticulos;
