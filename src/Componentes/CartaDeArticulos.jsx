import React, { useState } from "react";
import { Button, Card, Col, Container, Row } from "react-bootstrap";
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
  return (
    <Container className="mt-4">
    <Row>
      {articulos.map((art) => (
        <Col key={art.id} xs={8} sm={6} md={3} className="mb-4">
          <Card style={{ width: "16rem"}}>
            <Card.Img src={art.imagen} variant="top" style={{ height: "22rem"}} />
            <Card.Body>
              <Card.Title>{art.titulo}</Card.Title>
              <Card.Text>{art.descripcion}</Card.Text>
              <Card.Text>{`$${art.precio}`}</Card.Text>
              <Button variant="primary">Comprar</Button>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  </Container>
    
  );
};

export default CartaDeArticulos;
