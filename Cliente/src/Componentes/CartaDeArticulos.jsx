import React, { useEffect, useState } from "react";
import { Button, Card, Col, Container, Row } from "react-bootstrap";
import "../App.css";
import { Link, useLocation } from "react-router-dom";
import { API_URL } from "../config";
import axios from "axios";
import Spinner from "react-bootstrap/Spinner";
const URL = API_URL;

const CartaDeArticulos = () => {
  const [articulo, setArticulo] = useState([]);
  const location = useLocation().search;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${URL}/api/posts/${location}`);
        const data = res.data;
        // Verificar y transformar los datos de `img` y `size`
        const formattedData = Array.isArray(data)
          ? data.map((art) => ({
              ...art,
              img: typeof art.img === "string" ? JSON.parse(art.img) : art.img,
              sizes:
                typeof art.sizes === "string"
                  ? JSON.parse(art.sizes)
                  : art.sizes,
            }))
          : [];

        setArticulo(formattedData);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, [location]);

  const generateWhatsAppLink = (art) => {
    const tallaSlected = art.oversize ? "Over size" : "S/M/L";
    const message = `¡Hola!😁 Estoy interesado en:
     ${art.title}
     Valor: $${art.cost.toLocaleString()} por unidad
     ¿Está disponible en ${tallaSlected}?`;
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
          <Col key={art?.id} xs={6} sm={6} md={3} className="mb-2">
            <Card className="mt-4 align-items-center fixed-size-card">
              <Link to={`/${art.id}`}>
                <div>
                  {art.img ? (
                    <Card.Img
                      src={art?.img[0]}
                      className="img-fluid"
                      variant="top"
                      style={{
                        height: "auto",
                        width: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      className="d-flex flex-column justify-content-center align-items-center"
                      style={{ width: "100%", height: "100%" }}
                    >
                      <Spinner animation="border" variant="dark" />
                    </div>
                  )}
                </div>
              </Link>
              {!art.stock && <div className="agotado-site">AGOTADO</div>}

              <Card.Body className="m-0 p-2 text-center d-flex flex-column justify-content-between">
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
                  <Card.Text className="tallas-box">
                    {!art?.sizes[0] == "" && (
                      <p className="tallas">{art?.sizes[0] + "/"}</p>
                    )}
                    {!art?.sizes[1] == "" && (
                      <p className="tallas"> {art?.sizes[1]}</p>
                    )}
                    {!art?.sizes[2] == "" && (
                      <p className="tallas"> {"/" + art?.sizes[2]}</p>
                    )}
                    {!art?.sizes[3] == "" && (
                      <p className="tallas"> {"/" + art?.sizes[3]}</p>
                    )}
                  </Card.Text>
                )}
                <div>
                  <Card.Text className="fw-bold m-0">
                    {`$${art?.cost.toLocaleString()}`}
                  </Card.Text>
                  <Button
                    variant="dark"
                    className="text-warning"
                    href={!art.stock ? generateWhatsAppLink(art) : null}
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
