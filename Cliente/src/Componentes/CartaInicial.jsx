import React, { useEffect, useState } from "react";
import { Button, Carousel, Spinner } from "react-bootstrap";
import "../App.css";
import { Link, useLocation } from "react-router-dom";
import { API_URL } from "../config";
import axios from "axios";

const URL = API_URL;

const CartaInicial = () => {
  const [articulo, setArticulo] = useState([]);
  const location = useLocation().search;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${URL}/api/posts/${location}`);
        const data = res.data;

        const formattedData = Array.isArray(data)
          ? data.map((art) => ({
              ...art,
              img: typeof art.img === "string" ? JSON.parse(art.img) : art.img,
              sizes:
                typeof art.sizes === "string"
                  ? JSON.parse(art.sizes)
                  : art.sizes,
            }))
          : [];

        setArticulo(formattedData);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, [location]);

  const generateWhatsAppLink = (art) => {
    const tallaSlected = art.oversize ? "Over size" : "S/M/L";
    const message = `¡Hola!😁 Estoy interesado en:
     ${art.title}
     Valor: $${art.cost.toLocaleString()} por unidad
     ¿Está disponible en ${tallaSlected}?`;
    const imageLink = art?.img[0];
    const whatsappLink = `https://wa.me/573128919861?text=${encodeURIComponent(
      message
    )}%0A%0A${encodeURIComponent(imageLink)}`;
    return whatsappLink;
  };

  return (
    <div className="inital-Container" id="most-seller">
      <Carousel controls indicators fade interval={1500}>
        {articulo.slice(-4).map((art, index) => (
          <Carousel.Item key={art.id}>
            <div
              className="d-flex flex-column flex-md-row align-items-center justify-content-center carousel-items">
              
              <div className="w-100 w-md-50 text-center">
                {art.img ? (
                  <img
                    className="img-fluid img-carousel"
                    src={art.img[0]}
                    alt={art.title}               
                  />
                ) : (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <Spinner animation="border" variant="dark" />
                  </div>
                )}
              </div>

              {/* Contenido */}
              <div className="w-100 w-md-50 text-md-start text-center p-4">
                <h2 className="fw-bold titulo-inicial">{art.title}</h2>

                {art.oversize ? (
                  <p className="m-0">Oversize</p>
                ) : (
                  <div className="d-flex gap-1 justify-content-center justify-content-md-start">
                    {art.sizes.map(
                      (size, i) =>
                        size !== "" && (
                          <span key={i} className="tallasCartainicial">
                            {i !== 0 ? "/" : ""}
                            {size}
                          </span>
                        )
                    )}
                  </div>
                )}
                <p className="des-inicial mt-3">
                  {art.desc}
                </p>
                <p className="parrafo-inicial mt-3">No te lo pierdas!</p>

                <div className="mt-3">
                  <Button
                    variant="dark"
                    className="text-light"
                    href={art.stock ? generateWhatsAppLink(art) : null}
                    target="_blank"
                  >
                    Comprar
                  </Button>
                  {!art.stock && (
                    <div className="mt-2 text-danger fw-bold parrafos">AGOTADO</div>
                  )}
                </div>
                <div className="mt-3">
                  <a className="text-muted parrafos pointer" href={`/${art.id}`}>Explorar</a>
                </div>
              </div>
            </div>
          </Carousel.Item>
        ))}
      </Carousel>
    </div>
  );
};


export default CartaInicial;
