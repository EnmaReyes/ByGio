import React from "react";
import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import logonegro from "../assets/Logo/logo-blanco.png";
const BarraNavegacion = () => {
  return (
    <Navbar
      style={{
        background: "black",
        background:
          "linear-gradient(90deg, rgba(57,53,53,1) 0%, rgba(18,17,17,1) 26%, black 50%, rgba(18,17,17,1) 80%, rgba(57,53,53,1) 100%)",
      }}
    >
      <Container style={{ display: "flex", justifyContent: "center" }}>
        <Navbar.Brand href="/">
          <img
            src={logonegro}
            width="100"
            className="d-inline-block align-top object-fit-cover"
            alt="logo"
          />
        </Navbar.Brand>
      </Container>
    </Navbar>
  );
};

export default BarraNavegacion;
