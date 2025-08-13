import React from "react";
import { Button, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import "../App.css";
import { useArticulos } from "./UseArticulos";

export const CartaDeArticulos = () => {
  const articulo = useArticulos();

  const generateWhatsAppLink = (art) => {
    const tallaSlected = art.oversize ? "Over size" : "S/M/L";
    const message = `¡Hola!😁 Estoy interesado en:
     ${art.title}
     Valor: $${art.cost.toLocaleString()} por unidad
     ¿Está disponible en ${tallaSlected}?`;
    const imageLink = art?.img[0];
    return `https://wa.me/573128919861?text=${encodeURIComponent(
      message
    )}%0A%0A${encodeURIComponent(imageLink)}`;
  };

  return (
    <Container className="container-card" id="articulos">
      <Row>
        {articulo
          .filter((art) => art.descuento <= 0)
          .slice(0, -4)
          .map((art) => (
            <Col key={art?.id} xs={6} sm={6} md={6} lg={3}  className="mb-2">
              <Card className="mt-4 mb-4 align-items-center fixed-size-card">
                <Link to={`/${art.id}`}>
                  <div>
                    {art.img ? (
                      <Card.Img
                        src={art?.img[0]}
                        className="img-fluid"
                        variant="top"
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
                {!art.stock && (
                  <div className="agotado-site parrafos">AGOTADO</div>
                )}
                <Card.Body className="m-0 p-2 card-body">
                  <Card.Title className="text-center m-0 titulos">
                    {art?.title}
                  </Card.Title>
                  {art.oversize ? (
                    <Card.Text className="text-center m-0 parrafos">
                      <span>Oversize</span>
                    </Card.Text>
                  ) : (
                    <Card.Text className=" m-0 tallas-box parrafos">
                      {!art?.sizes[0] == "" && (
                        <p className="tallas">{art?.sizes[0]}</p>
                      )}
                      {!art?.sizes[1] == "" && (
                        <p className="tallas"> {art?.sizes[1]}</p>
                      )}
                      {!art?.sizes[2] == "" && (
                        <p className="tallas"> {art?.sizes[2]}</p>
                      )}
                      {!art?.sizes[3] == "" && (
                        <p className="tallas"> {art?.sizes[3]}</p>
                      )}
                    </Card.Text>
                  )}
                  <div>
                    <Col>
                      <Card.Text className="m-0 parrafos">
                        {`$${art?.cost.toLocaleString()}`}
                      </Card.Text>
                    </Col>

                    <button
                      variant="dark"
                      className="parrafos buttons mt-2"
                      href={art.stock ? generateWhatsAppLink(art) : null}
                      target="_blank"
                    >
                      Comprar
                    </button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
      </Row>
    </Container>
  );
};

export const ArtiulosOferta = () => {
  const articulo = useArticulos();

  const generateWhatsAppLink = (art) => {
    const tallaSlected = art.oversize ? "Over size" : "S/M/L";
    const message = `¡Hola!😁 Estoy interesado en:
     ${art.title}
     Valor: $${art.cost.toLocaleString()} por unidad
     ¿Está disponible en ${tallaSlected}?`;
    const imageLink = art?.img[0];
    return `https://wa.me/573128919861?text=${encodeURIComponent(
      message
    )}%0A%0A${encodeURIComponent(imageLink)}`;
  };

  return (
    <Container className="container-card" id="articulos">
      <Row>
        {articulo
          .filter((art) => art.descuento > 0)
          .map((art) => (
            <Col key={art?.id} xs={6} sm={6} md={6} lg={3} className="mb-2">
              <Card className="mt-4 mb-4 align-items-center fixed-size-card">
                <Link to={`/${art.id}`}>
                  <div>
                    <div className="porcentaje">
                      <span>
                        {Math.round(
                          ((art.cost - art.descuento) / art.cost) * 100
                        )}
                        % OFF
                      </span>
                    </div>

                    {art.img ? (
                      <div>
                        <Card.Img
                          src={art?.img[0]}
                          className="img-fluid"
                          variant="top"  
                        />
                      </div>
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
                {!art.stock && (
                  <div className="agotado-site parrafos">AGOTADO</div>
                )}

                <Card.Body className="m-0 p-2 card-body">
                  <Card.Title className="text-center m-0 titulos">
                    {art?.title}
                  </Card.Title>
                  {art.oversize ? (
                    <Card.Text className="text-center m-0 parrafos">
                      <span>Oversize</span>
                    </Card.Text>
                  ) : (
                    <Card.Text className=" m-0 tallas-box parrafos">
                      {!art?.sizes[0] == "" && (
                        <p className="tallas">{art?.sizes[0]}</p>
                      )}
                      {!art?.sizes[1] == "" && (
                        <p className="tallas"> {art?.sizes[1]}</p>
                      )}
                      {!art?.sizes[2] == "" && (
                        <p className="tallas"> {art?.sizes[2]}</p>
                      )}
                      {!art?.sizes[3] == "" && (
                        <p className="tallas"> {art?.sizes[3]}</p>
                      )}
                    </Card.Text>
                  )}
                  <div>
                    <Row>
                      {art?.descuento > 0 && (
                        <Col>
                          <Card.Text className="m-0 parrafos descuento">
                            {`$${art?.descuento.toLocaleString()}`}
                          </Card.Text>
                        </Col>
                      )}
                      <Col>
                        <Card.Text
                          className={
                            art?.descuento > 0
                              ? "color-des m-0 parrafos"
                              : "m-0 parrafos"
                          }
                        >
                          {`$${art?.cost.toLocaleString()}`}
                        </Card.Text>
                      </Col>
                    </Row>
                    <button
                      variant="dark"
                      className="parrafos buttons mt-2"
                      href={art.stock ? generateWhatsAppLink(art) : null}
                      target="_blank"
                    >
                      Comprar
                    </button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
      </Row>
    </Container>
  );
};
