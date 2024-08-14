import React from 'react'
import {Container, Nav, Navbar, NavDropdown} from 'react-bootstrap';
import logonegro from '../assets/Logo/logonegro.jpg'
const BarraNavegacion = () => {
  return (
    <Navbar className="bg-dark bg-gradient" >
    <Container>
      <Navbar.Brand href="/" >
        <img
          src={logonegro}
          width="60"
          height="60"
          className="d-inline-block align-top rounded-circle object-fit-cover"
          alt="logo"
        />
      </Navbar.Brand>
    </Container>
  </Navbar>
  )
}

export default BarraNavegacion