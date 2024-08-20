import React, { useState } from "react";
import { Button, Card, Col, Container, Row } from "react-bootstrap";
import "../App.css";
import img1 from "../assets/Articulos/1.jpg";
import img2 from "../assets/Articulos/2.jpg";
import img3 from "../assets/Articulos/3.jpg";
import img4 from "../assets/Articulos/4.jpg";
import img5 from "../assets/Articulos/5.jpg";
import img6 from "../assets/Articulos/6.jpeg";

const CartaDeArticulos = () => {
  const [articulo, setArticulos] = useState({});
  const articulos = [
    {
      id: "1",
      imagen: img1,
      titulo: "Camisa",
      tallas: ["S", "M", "L", "XL"],
      precio: 50000,
      descripcion: "camisa manga corta",
    },
    {
      id: "2",
      imagen: img2,
      titulo: "Camisa",
      tallas: ["S", "M", "L", "XL"],
      precio: 50000,
      descripcion: "camisa manga corta y larga",
    },
    {
      id: "3",
      imagen: img3,
      titulo: "Camisa",
      tallas: ["S", "M", "L", "XL"],
      precio: 40000,
      descripcion: "camisa manga corta",
    },
    {
      id: "4",
      imagen: img4,
      titulo: "Camisa",
      tallas: ["S", "M", "L", "XL"],
      precio: 60000,
      descripcion: "camisa manga corta y larga",
    },
    {
      id: "5",
      imagen: img5,
      titulo: "Camisa",
      tallas: ["S", "M", "L", "XL"],
      precio: 50000,
      descripcion: "camisa manga corta",
    },
    {
      id: "6",
      imagen: img6,
      titulo: "Camisa",
      tallas: ["S", "M", "L", "XL"],
      precio: 30000,
      descripcion: "camisa manga larga",
    },
  ];
  const URL = "https://bygio.onrender.com";
  const generateWhatsAppLink = (art) => {
    const message = `Estoy interesado en ${
      art.titulo
    } que cuesta $${art.precio}. ¿Está disponible en talla ${art.tallas.join(
      "/"
    )}? imagen: ${URL}${art.imagen}`;
    const whatsappLink = `https://wa.me/573128919861?text=%C2%A1Hola%20byGio!${encodeURIComponent(
      message
    )}`;
    return whatsappLink;
  };
  return (
    <Container className="">
      <Row>
        {articulos.map((art) => (
          <Col key={art.id} xs={6} sm={6} md={4} className="mb-2">
            <Card className="mt-4 " style={{ width: "100%" }}>
              <div style={{ height: "100%", overflow: "hidden" }}>
                <Card.Img
                  src={art.imagen}
                  className="img-fluid"
                  variant="top"
                  style={{ height: "18rem", objectFit: "cover" }}
                />
              </div>
              <Card.Body className="m-0 p-2 ">
                <Card.Title className="text-center m-0">
                  {art.titulo}
                </Card.Title>
                <Card.Text className="text-center m-0">S/M L/XL</Card.Text>
                <div className="text-center">
                  <Card.Text className="fw-bold m-0">
                    {`$${art.precio}`}
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
