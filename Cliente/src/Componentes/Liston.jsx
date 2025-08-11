import React from "react";

export const ListonTendencia = () => {
  return (
    <div className="container-liston">
      <div className="box-liston">
        <div className="titulo-liston">
          {" "}
          <span>TENDENCIA</span>
        </div>
        <div className="explora-liston">
          {" "}
          <a href="#articulos">Explorar</a>
        </div>
        <div className="span-liston">
          <span>
            Mira nuestros mas recientes lanzamientos y descubre los precios
            perfectos
          </span>
        </div>
      </div>
    </div>
  );
};

export const ListonMostSeller = () => {
  return (
    <div className="container-liston">
      <div className="box-liston">
        <div className="titulo-liston">
          {" "}
          <span>MAS VENDIDOS</span>
        </div>
        <div className="explora-liston">
          {" "}
          <a href="#most-seller">Explorar</a>
        </div>
        <div className="span-liston">
          <span>
            No te pierdas los lanzamientos mas vendidos y descubre los precios
            perfecto
          </span>
        </div>
      </div>
    </div>
  );
};

export const ListonOffer = () => {
  return (
    <div className="container-liston">
      <div className="box-liston">
        <div className="titulo-liston">
          {" "}
          <span>OFERTAS</span>
        </div>
        <div className="explora-liston">
          {" "}
          <a href="#most-seller">Explorar</a>
        </div>
        <div className="span-liston">
          <span>Aprovecha las ofertas de hoy antes de que se agoten</span>
        </div>
      </div>
    </div>
  );
};

export const ListonMayorista = () => {
  return (
    <div className="container-liston">
      <div className="box-liston">
        <div className="titulo-liston">
          {" "}
          <span>MAYORISTA</span>
        </div>
        <div className="promosubtitulo-liston m-0 p-0 titulos">
          {" "}
          <span className="numero">6</span> <span className="letra">X</span>{" "}
          <span className="numero">$150.000</span>
        </div>
        <div className="explora-liston">
          {" "}
          <a href="#most-seller">Explorar</a>
        </div>
        <div className="span-liston">
          <span>
            {" "}
            No te quedes por fuera. Crece junto a nosotros ordenando al por
            mayor
          </span>
        </div>
      </div>
    </div>
  );
};
