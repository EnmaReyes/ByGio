import React, { useState } from "react";
import { Button, Card, Col, Container, Row } from "react-bootstrap";
import "../App.css";
import img1 from "../assets/Articulos/Hypnotize.png";
import img2 from "../assets/Articulos/Lavidaquedeseas.png";
import img3 from "../assets/Articulos/Magic.png";
import img4 from "../assets/Articulos/ManosdeAmor.png";
import img5 from "../assets/Articulos/Mystical.png";
import img6 from "../assets/Articulos/TheLovers.png";
import img7 from "../assets/Articulos/TheSun.png";
import img8 from "../assets/Articulos/Unicornio.png";
import img9 from "../assets/Articulos/CosmicDreamer.png";
import img10 from "../assets/Articulos/DayandNigth.png";
import img11 from "../assets/Articulos/Eyes.png";
import img12 from "../assets/Articulos/OjoCorazon.png";
import img13 from "../assets/Articulos/Pantera.png";
import img14 from "../assets/Articulos/Standout.png";

const CartaDeArticulos = () => {
  const [articulo, setArticulos] = useState({});
  const articulos = [
    {
      id: "1",
      imagen: img1,
      titulo: "Hypnotize",
      precio: "30.000",
    },
    {
      id: "2",
      imagen: img2,
      titulo: "La Vida Que Deseas",
      precio: "30.000",
    },
    {
      id: "3",
      imagen: img3,
      titulo: "Magic",
      precio: "30.000",
    },
    {
      id: "4",
      imagen: img4,
      titulo: "Manos De Amor",
      precio: "30.000",
    },
    {
      id: "5",
      imagen: img5,
      titulo: "Mystical",
      precio: "30.000",
    },
    {
      id: "6",
      imagen: img6,
      titulo: "The Lovers",
      precio: "30.000",
    },
    {
      id: "7",
      imagen: img7,
      titulo: "The Sun",
      precio: "30.000",
    },
    {
      id: "8",
      imagen: img8,
      titulo: "Unicornio",
      precio: "30.000",
    },
    {
      id: "9",
      imagen: img9,
      titulo: "Cosmic Dreamer",
      precio: "30.000",
    },
    {
      id: "10",
      imagen: img10,
      titulo: "Day & Nigth",
      precio: "30.000",
    },
    {
      id: "11",
      imagen: img11,
      titulo: "Eyes",
      precio: "30.000",
    },
    {
      id: "12",
      imagen: img12,
      titulo: "Ojo Corazon",
      precio: "30.000",
    },
    {
      id: "13",
      imagen: img13,
      titulo: "Pantera",
      precio: "30.000",
    },
    {
      id: "14",
      imagen: img14,
      titulo: "Stand out",
      precio: "30.000",
    },
  ];
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
        {articulos.map((art) => (
          <Col key={art.id} xs={6} sm={6} md={4} className="mb-2">
            <Card className="mt-4 " style={{ width: "100%" }}>
              <div style={{ height: "100%", overflow: "hidden" }}>
                <Card.Img
                  src={art.imagen}
                  className="img-fluid"
                  variant="top"
                  style={{ height: "14rem", objectFit: "cover" }}
                />
              </div>
              <Card.Body className="m-0 p-2 ">
                <Card.Title className="text-center m-0">
                  {art.titulo}
                </Card.Title>
                <Card.Text className="text-center m-0">S / M / L</Card.Text>
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
