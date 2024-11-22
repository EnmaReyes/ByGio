import React, { useEffect, useState } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import { Button, Col, Container, Form, Image, Row } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
// Import Swiper styles
import "../App.css";
import "swiper/css";
import "swiper/css/pagination";

import axios from "axios";
import { API_URL } from "../config";
const URL = API_URL;

const Articulo = () => {
  const location = useLocation();
  const postid = location.pathname.split("/")[1];
  const [selected, setSelected] = useState([]);
  const [mainImage, setMainImage] = useState(selected?.img);
  const [conteo, setConteo] = useState(1);
  const [medidas, setMedidas] = useState("S");
  const [isloading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${URL}/api/posts/${postid}`);
        setSelected(res.data);
        setIsLoading(false);
        window.scrollTo(0, 0);
      } catch (error) {
        console.error("Error al obtener el post:", error);
      }
    };
    fetchData();
  }, [postid]);

  //! carrtio \\
  const {
    allProducts,
    setAllProducts,
    total,
    setTotal,
    countProducts,
    setCountProducts,
  } = useOutletContext();

  const añadirCarrito = (selected, conteo, medidas) => {
    if (
      allProducts.find(
        (item) => item.id === selected.id && item.talla === medidas
      )
    ) {
      const products = allProducts.map((item) =>
        item.id === selected.id
          ? { ...item, cantidad: conteo + item.cantidad }
          : item
      );
      setTotal(total + selected.cost * conteo);
      setCountProducts(countProducts + conteo);
      return setAllProducts([...products]);
    }

    setTotal(total + selected.cost * conteo);
    setCountProducts(countProducts + conteo);
    setAllProducts([
      ...allProducts,
      { ...selected, cantidad: conteo, talla: medidas },
    ]);
  };

  const handleThumbnailClick = (thumbnail) => {
    setMainImage(thumbnail); // Actualiza la imagen principal con la miniatura seleccionada
  };

  //! Comprar articulo\\
  const WhatsAppLink = (selected, conteo, medidas) => {
    if (!selected?.title || !selected?.cost || !selected?.img?.[0]) {
      return "#";
    }
  
    const message = `¡Hola!😁 Estoy interesado en:
      ${conteo} ${selected.title}
      Talla: ${medidas}
      Valor: $${selected.cost.toLocaleString()} por unidad`;
    const imageLink = selected?.img?.[0];
    const whatsappLink = `https://wa.me/573128919861?text=${encodeURIComponent(
      message
    )}%0A%0A${encodeURIComponent(imageLink)}`;
    return whatsappLink;
  };
  

  return (
    <Container className="mb-4" style={{ paddingTop: "90px" }}>
      <Row>
        <Col xs={12} md={6} className="d-flex flex-column align-items-center">
          {selected?.img?.length > 0 ? (
            <Swiper
              pagination={true}
              modules={[Pagination]}
              className="mySwiper"
            >
              {selected?.img.map((img, index) => (
                <SwiperSlide key={index}>
                  <img src={img} alt={`Slide ${index}`} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <p>Cargando imágenes...</p> // Mensaje de carga o un spinner
          )}
        </Col>

        {/* Columna para los detalles del producto */}
        <Col
          xs={12}
          md={4}
          className="d-flex flex-column text-center text-md-start xs-center"
        >
          <div className="w-100">
            <h1
              className="text-center text-md-start"
              style={{
                fontSize: "2.8rem",
                fontFamily: "Lobster, sans-serif",
              }}
            >
              {selected?.title}
            </h1>
            <h2 className="text-success text-md-start">
              ${selected?.cost?.toLocaleString()}
            </h2>

            <Form>
              <Form.Group controlId="sizeSelect" className="mb-3">
                <h3>Medidas</h3>
                <div
                  className="btn-group"
                  role="group"
                  aria-label="Basic example"
                >
                  <button
                    type="button"
                    className={`btn ${
                      medidas === "S" ? "btn-secondary fw-bolder " : "btn-light"
                    }`}
                    style={{
                      transform: medidas === "S" ? "scale(0.9)" : "scale(1)",
                      transition: "transform 0.2s ease-in-out",
                    }}
                    onClick={() => {
                      setMedidas("S");
                    }}
                  >
                    S
                  </button>
                  <button
                    type="button"
                    className={`btn ${
                      medidas === "M" ? "btn-secondary fw-bolder " : "btn-light"
                    }`}
                    style={{
                      transform: medidas === "M" ? "scale(0.9)" : "scale(1)",
                      transition: "transform 0.2s ease-in-out",
                    }}
                    onClick={() => {
                      setMedidas("M");
                    }}
                  >
                    M
                  </button>
                  <button
                    type="button"
                    className={`btn ${
                      medidas === "L" ? "btn-secondary fw-bolder " : "btn-light"
                    }`}
                    style={{
                      transform: medidas === "L" ? "scale(0.9)" : "scale(1)",
                      transition: "transform 0.2s ease-in-out",
                    }}
                    onClick={() => {
                      setMedidas("L");
                    }}
                  >
                    L
                  </button>
                </div>
              </Form.Group>

              <div>
                <p>{selected?.desc}</p>
              </div>

              <div className="d-flex align-items-center justify-content-center justify-content-md-start">
                <Button
                  variant="light"
                  className="ml-3 btn btn-outline-secondary btn-sm"
                  onClick={() => conteo >= 2 && setConteo(conteo - 1)}
                >
                  <FontAwesomeIcon icon={faMinus} />
                </Button>
                <div className="p-4">{conteo}</div>
                <Button
                  variant="light"
                  className="ml-3 btn btn-outline-secondary btn-sm"
                  onClick={() => setConteo(conteo + 1)}
                >
                  <FontAwesomeIcon icon={faPlus} />
                </Button>
              </div>

              <div className="d-flex flex-column justify-content-center justify-content-md-start">
                <p className="m-0">Total</p>
                <h3>{(conteo * selected?.cost).toLocaleString()}</h3>
              </div>

              <div className="d-grid gap-2">
                <Button
                  type="button"
                  className="btn btn-dark btn-lg rounded-pill"
                  target="_blank"
                  href={WhatsAppLink(selected, conteo, medidas)}
                >
                  Comprar
                </Button>
                <div
                  type="button"
                  className="btn btn-outline-dark btn-lg rounded-pill"
                  onClick={() => {
                    añadirCarrito(selected, conteo, medidas);
                  }}
                >
                  Añadir al Carrito
                </div>
              </div>
            </Form>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Articulo;
