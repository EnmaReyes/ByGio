import React from "react";
import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import logonegro from "../assets/Logo/logo-blanco.png";
const BarraNavegacion = () => {
  return (
    <Navbar
      style={{
        background:
          "linear-gradient(100deg, rgba(57,53,53,1) 0%, rgba(18,17,17,1) 25%, black 50%, rgba(18,17,17,1) 75%, rgba(57,53,53,1) 100%)",
      }}
    >
      <Container style={{ display: "flex", justifyContent: "center", alignItems:"center"}}>
        <Navbar.Brand href="/" style={{width:"110px", padding:"0px", margin:"0px" }}>
          <img
            src={logonegro}
            style={{width:"100%", }}
            className="d-inline-block align-top object-fit-cover"
            alt="logo"
          />
        </Navbar.Brand>
      </Container>
    </Navbar>
  );
};

export default BarraNavegacion;
