import React, { useState } from "react";
import {
  CartaDeArticulos,
  ArtiulosOferta,
} from "../Componentes/CartaDeArticulos";
import "../App.css";
import { Col } from "react-bootstrap";
import Banner from "../Componentes/Banner";
import CartaInicial from "../Componentes/CartaInicial";
import {
  ListonMostSeller,
  ListonOffer,
  ListonMayorista,
  ListonTendencia,
} from "../Componentes/Liston";
import { useArticulos } from "../Componentes/UseArticulos";

const Inicio = () => {
  return (
    <div>
      <Banner />
      <ListonMostSeller />
      <CartaInicial />
      <ListonOffer />
      <ArtiulosOferta />
      <ListonTendencia />
      <Col>
        <CartaDeArticulos />
      </Col>
      <ListonMayorista />
    </div>
  );
};

export default Inicio;
