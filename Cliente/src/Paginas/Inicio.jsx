import React, { useState } from "react";
import CartaDeArticulos from "../Componentes/CartaDeArticulos";
import "../App.css"
import { Col } from "react-bootstrap";
import Banner from "../Componentes/Banner";
const Inicio = () => {
  
  return (
    <div className="background"
    style={{paddingTop:"80px"}}>
      <Banner/>
      <Col>
      <CartaDeArticulos/>
      </Col>   
    </div>
  );
};

export default Inicio;
