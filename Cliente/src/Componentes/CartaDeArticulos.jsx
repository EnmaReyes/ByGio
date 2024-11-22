import React, { useEffect, useState } from "react";
import { Button, Card, Col, Container, Row } from "react-bootstrap";
import "../App.css";
import { Link, useLocation } from "react-router-dom";
import { API_URL } from "../config";
import axios from "axios";

const URL = API_URL;

const CartaDeArticulos = () => {
  const [articulo, setArticulo] = useState([]);
  const location = useLocation().search;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${URL}/api/posts/${location}`);
        setArticulo(res.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, [location]);

  const nuevosPosts = () => {
    // Si 'links' es una cadena JSON, la transformamos; si ya es un objeto, lo dejamos igual
    const parsedImg =
      typeof articulo?.img === "string"
        ? JSON.parse(articulo?.img)
        : articulo?.img;

    const parsedSize =
      typeof articulo?.size === "string"
        ? JSON.parse(articulo?.size)
        : articulo?.size;
    return [
      {
        ...articulo,
        img: parsedImg,
        size: parsedSize,
      },
    ];
  };
  nuevosPosts();

  const generateWhatsAppLink = (art) => {
    const message = `¡Hola!😁 Estoy interesado en:
     ${art.title}
     Valor: $${art.cost.toLocaleString()} por unidad
     ¿Está disponible en talla S / M / L?`;
    const imageLink = art?.img[0];
    const whatsappLink = `https://wa.me/573128919861?text=${encodeURIComponent(
      message
    )}%0A%0A${encodeURIComponent(imageLink)}`;
    return whatsappLink;
  };
  
  return (
    <Container className="">
      <Row>
        {articulo.map((art) => (
          <Col key={art?.id} xs={6} sm={6} md={4} className="mb-2">
            <Card className="mt-4 " style={{ width: "100%", border: "none" }}>
              <Link to={`/${art.id}`}>
                <div style={{ height: "100%", overflow: "hidden" }}>
                  <Card.Img
                    src={art?.img[0]}
                    className="img-fluid"
                    variant="top"
                    style={{
                      height: "100%",
                      width: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              </Link>
              <Card.Body className="m-0 p-2 ">
                <Card.Title
                  className="text-center m-0"
                  style={{ fontFamily: "Lobster, sans-serif" }}
                >
                  {art?.title}
                </Card.Title>
                {art.oversize ? (
                  <Card.Text className="text-center m-0">
                    <span>Oversize</span>
                  </Card.Text>
                ) : (
                  <Card.Text className="text-center m-0">
                    {`${art?.sizes[0]}/${art?.sizes[1]}/${art?.sizes[2]}`}
                    {art?.sizes[3] && `/${art?.sizes[3]}`}
                  </Card.Text>
                )}
                <div className="text-center">
                  <Card.Text className="fw-bold m-0">
                    {`$${art?.cost.toLocaleString()}`}
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
