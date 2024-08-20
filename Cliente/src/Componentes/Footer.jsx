import React from "react";
import { Card, Col, Container, Row } from "react-bootstrap";
import logo from "../assets/Logo/logo-blanco.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import "../App.css";
const Footer = () => {
  return (
    <div className="bg-black">
      <Container>
        <Row>
          <Col>
            <Card.Img
              src={logo}
              variant="top"
              className=" img-fluid"
              style={{ width: "150px" }}
            />
          </Col>

          <Col className="mt-2">
            <h1 className="fs-3 text-center text-light">Contactanos</h1>
            <div className="text-center ">
              <a
                className="display-6 m-2 text-light "
                href="https://www.instagram.com/bygio_modafemenina?igsh=MXVkaTRpeHBsZXU3ag=="
                target="_blank"
              >
                <FontAwesomeIcon icon={faInstagram} />
              </a>
              <a
                href="https://wa.me/573128919861?text=%C2%A1Hola%20byGio!%20Quiero%20hacer%20un%20pedido"
                target="_blank"
                className="display-6 m-2 text-light"
              >
                <FontAwesomeIcon icon={faWhatsapp} />
              </a>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Footer;
