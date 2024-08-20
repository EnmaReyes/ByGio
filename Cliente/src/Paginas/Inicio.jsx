import React, { useState } from "react";
import CartaDeArticulos from "../Componentes/CartaDeArticulos";
import "../App.css"
import { Col } from "react-bootstrap";
const Inicio = () => {
  return (
    <div className="background">
      <Col>
      <CartaDeArticulos />
      </Col>
      
    </div>
  );
};

export default Inicio;
