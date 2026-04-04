import React, { useMemo } from "react";
import { Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import "../App.css";
import { useArticulos } from "./UseArticulos";

const generateWhatsAppLink = (art, phoneNumber) => {
  const size = art.oversize ? "Over size" : "S/M/L";
  const message = `¡Hola!😁 Estoy interesado en:\n${art.title}\nValor: $${art.cost.toLocaleString()} por unidad\n¿Está disponible en ${size}?`;
  const imageLink = art?.img[0];
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}%0A%0A${encodeURIComponent(imageLink)}`;
};

const SizesList = ({ sizes, oversize }) => {
  if (oversize) {
    return (
      <Card.Text className="text-center m-0 parrafos">
        <span>Oversize</span>
      </Card.Text>
    );
  }

  return (
    <Card.Text className="m-0 tallas-box parrafos">
      {sizes
        .filter((size) => size)
        .map((size, idx) => (
          <p key={idx} className="tallas">
            {size}
          </p>
        ))}
    </Card.Text>
  );
};

const ImageDisplay = ({ img }) => {
  if (img?.length > 0) {
    return <Card.Img src={img[0]} className="img-fluid" variant="top" />;
  }
  return (
    <div
      className="d-flex flex-column justify-content-center align-items-center"
      style={{ width: "100%", height: "100%" }}
    >
      <Spinner animation="border" variant="dark" />
    </div>
  );
};

const CompraButton = ({ art, whatsappLink }) => {
  if (!art.stock) return null;

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="parrafos buttons mt-2 pointer"
      style={{
        display: "inline-block",
        textDecoration: "none",
      }}
    >
      Comprar
    </a>
  );
};

const ArticleCard = ({ art, phoneNumber, showDiscount = false }) => {
  const whatsappLink = useMemo(
    () => generateWhatsAppLink(art, phoneNumber),
    [art, phoneNumber],
  );

  return (
    <Col key={art?.id} xs={6} sm={6} md={6} lg={3} className="mb-2">
      <Card className="mt-4 mb-4 align-items-center fixed-size-card">
        <Link to={`/${art.id}`}>
          <div>
            {showDiscount && (
              <div className="porcentaje">
                <span>
                  {Math.round(((art.cost - art.descuento) / art.cost) * 100)}%
                  OFF
                </span>
              </div>
            )}
            <ImageDisplay img={art.img} />
          </div>
        </Link>
        {!art.stock && <div className="agotado-site parrafos">AGOTADO</div>}

        <Card.Body className="m-0 p-2 card-body">
          <Card.Title className="text-center m-0 titulos">
            {art?.title}
          </Card.Title>
          <SizesList sizes={art?.sizes} oversize={art.oversize} />

          <div>
            {showDiscount && art?.descuento > 0 && (
              <Row>
                <Col>
                  <Card.Text className="m-0 parrafos descuento">
                    {`$${art?.descuento.toLocaleString()}`}
                  </Card.Text>
                </Col>
                <Col>
                  <Card.Text className="color-des m-0 parrafos">
                    {`$${art?.cost.toLocaleString()}`}
                  </Card.Text>
                </Col>
              </Row>
            )}
            {!showDiscount && (
              <Col>
                <Card.Text className="m-0 parrafos">{`$${art?.cost.toLocaleString()}`}</Card.Text>
              </Col>
            )}
            <CompraButton art={art} whatsappLink={whatsappLink} />
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
};

export const CartaDeArticulos = () => {
  const articulos = useArticulos();
  const phoneNumber = import.meta.env.VITE_NUMBER_PHONE;

  const sinDescuento = useMemo(
    () => articulos.filter((art) => art.descuento <= 0),
    [articulos],
  );

  return (
    <Container className="container-card" id="articulos">
      <Row>
        {sinDescuento.map((art) => (
          <ArticleCard
            key={art?.id}
            art={art}
            phoneNumber={phoneNumber}
            showDiscount={false}
          />
        ))}
      </Row>
    </Container>
  );
};

export const ArtiulosOferta = () => {
  const articulos = useArticulos();
  const phoneNumber = import.meta.env.VITE_NUMBER_PHONE;

  const conDescuento = useMemo(
    () => articulos.filter((art) => art.descuento > 0),
    [articulos],
  );

  return (
    <Container className="container-card" id="articulos">
      <Row>
        {conDescuento.map((art) => (
          <ArticleCard
            key={art?.id}
            art={art}
            phoneNumber={phoneNumber}
            showDiscount={true}
          />
        ))}
      </Row>
    </Container>
  );
};
