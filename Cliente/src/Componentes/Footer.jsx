import React from "react";
import { Card, Col, Container, Row } from "react-bootstrap";
import logo from "../assets/Logo/logoblanco.jpeg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faWhatsapp } from "@fortawesome/free-brands-svg-icons";

const Footer = () => {
  return (
    <Container>
      <Row>
        <Col>
          <Card.Img src={logo} variant="top" style={{ width: "10rem" }} />
        </Col>

        <Col>
          <h1>Contactanos</h1>
          <a className=""
            href="https://www.instagram.com/bygio_modafemenina?igsh=MXVkaTRpeHBsZXU3ag=="
            target="_blank"
          >
            <FontAwesomeIcon icon={faInstagram} />
          </a>
          <a href="" target="_blank">
            <FontAwesomeIcon icon={faWhatsapp} />
          </a>
        </Col>
      </Row>
    </Container>
  );
};

export default Footer;
