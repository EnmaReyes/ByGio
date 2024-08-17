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
  return (
    <Container className="">
      <Row>
        {articulos.map((art) => (
          <Col key={art.id} xs={6} sm={6} md={4} className="mb-2">
            <Card
              style={{
                width: "100%",
                maxWidth: "18rem",
                marginTop: "30px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <div style={{ height: "100%", overflow: "hidden" }}>
                <Card.Img
                  src={art.imagen}
                  className="img-fluid"
                  variant="top"
                  style={{ height: "18rem", objectFit: "cover" }}
                />
              </div>
              <Card.Body style={{ padding: "10px" }}>
                <Card.Title
                  style={{
                    fontSize: "1rem",
                    fontWeight: "bold",
                    marginBottom: "10px",
                    textAlign: "center",
                  }}
                >
                  {art.titulo}
                </Card.Title>
                <Card.Text
                  style={{
                    fontSize: "0.875rem",
                    color: "#555",
                    marginBottom: "10px",
                    textAlign: "left",
                  }}
                >
                  {art.descripcion}
                </Card.Text>
                <Card.Text
                  style={{
                    fontSize: "0.875rem",
                    color: "#555",
                    marginBottom: "10px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  <p>S/M L/XL</p>
                </Card.Text>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Card.Text
                    style={{
                      fontWeight: "bold",
                      fontSize: "1.2rem",
                    }}
                  >
                    {`$${art.precio}`}
                  </Card.Text>
                  <Button variant="primary" style={{ fontSize: "0.875rem" }}>
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
