import React, { useContext, useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import { Button, Col, Container, Form, Image, Row } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMinus,
  faPenToSquare,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { toast } from "react-toastify";
import {
  notify,
  toastComments,
  toastpromise,
} from "../Componentes/toastConfig/toastconfigs.jsx";
// Import Swiper styles
import "../App.css";
import "swiper/css";
import "swiper/css/pagination";
import Spinner from "react-bootstrap/Spinner";

import axios from "axios";
import { API_URL } from "../config";
import { AuthContext } from "../context/authContext.jsx";
const URL = API_URL;

const Articulo = () => {
  const location = useLocation();
  const postid = location.pathname.split("/")[1];
  const [selected, setSelected] = useState([]);
  const [conteo, setConteo] = useState(1);
  const [medidas, setMedidas] = useState("S");
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${URL}/api/posts/${postid}`);
        setSelected(res.data);
        window.scrollTo(0, 0);
        console.log(selected);
      } catch (error) {
        console.error("Error al obtener el post:", error);
      }
    };
    fetchData();
  }, [postid]);

  // delete post
  const handleDelete = async () => {
    try {
      await axios.delete(`${URL}/api/posts/${postid}`, {
        withCredentials: true,
      });
      toast.success(
        "Eliminado con Exito",
        toastComments // estilo del toast
      );
      navigate("/");
    } catch (error) {
      console.error("Error al eliminar el post:", error);
    }
  };

  const sizes =
    typeof selected.sizes === "string"
      ? JSON.parse(selected.sizes)
      : selected.sizes;
  const imagens =
    typeof selected.img === "string" ? JSON.parse(selected.img) : selected.img;

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

  //! Comprar articulo\\
  const WhatsAppLink = (selected, conteo, medidas) => {
    if (!selected?.title || !selected?.cost || !imagens?.[0]) {
      return "#";
    }

    const message = `¡Hola!😁 Estoy interesado en:
      ${conteo} ${selected.title}
      Talla: ${medidas}
      Valor: $${selected.cost.toLocaleString()} por unidad`;
    const imageLink = imagens?.[0];
    const whatsappLink = `https://wa.me/573128919861?text=${encodeURIComponent(
      message
    )}%0A%0A${encodeURIComponent(imageLink)}`;
    return whatsappLink;
  };

  return (
    <Container className="m-auto" style={{ paddingTop: "90px" }}>
      <Row className="m-0">
        <Col xs={12} md={6} className="d-flex flex-column align-items-center ">
          {imagens?.length > 0 ? (
            <Swiper
              pagination={true}
              modules={[Pagination]}
              className="mySwiper"
            >
              {imagens.map((img, index) => (
                <SwiperSlide key={index} className="p-md-2 imgSwiper">
                  <img src={img} alt={`Slide ${index}`} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div
              className="d-flex flex-column justify-content-center  align-items-center"
              style={{ width: "100%", height: "100%", padding: "1rem" }}
            >
              <div
                className="d-flex flex-column justify-content-center align-items-center"
                style={{ width: "100%" }}
              >
                <Spinner animation="border" variant="dark" />
              </div>
            </div>
          )}
        </Col>

        {/* Columna para los detalles del producto */}
        <Col
          xs={12}
          md={5}
          className="d-flex flex-column justify-content-xs-start text-center align-items-center  p-2"
        >
          <div className="w-100">
            <h1
              style={{
                fontSize: "2.8rem",
                fontFamily: "Lobster, sans-serif",
              }}
            >
              {selected?.title}
            </h1>
            <h2 className="text-success ">
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
                    {sizes?.[0]}
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
                    {sizes?.[1]}
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
                    {sizes?.[2]}
                  </button>

                  {sizes?.[3] && (
                    <button
                      type="button"
                      className={`btn ${
                        medidas === "XL"
                          ? "btn-secondary fw-bolder "
                          : "btn-light"
                      }`}
                      style={{
                        transform: medidas === "XL" ? "scale(0.9)" : "scale(1)",
                        transition: "transform 0.2s ease-in-out",
                      }}
                      onClick={() => {
                        setMedidas("L");
                      }}
                    >
                      {sizes?.[3]}
                    </button>
                  )}
                </div>
              </Form.Group>

              <div>
                <p>{selected?.desc}</p>
              </div>

              <div className="d-flex align-items-center justify-content-center">
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
          {currentUser?.admin === true && (
            <div className="actions-articulo">
              <Link
                className="links edit"
                to={`/editor?edit=2`}
                state={selected}
              >
                <FontAwesomeIcon className="fonticon" icon={faPenToSquare} />
                <span className="actions-articulo-span">editar</span>
              </Link>

              <div
                onClick={() =>
                  notify(handleDelete, "¿Deseas eliminar el Articulo?")
                }
                className="delete"
              >
                <FontAwesomeIcon className="fonticon" icon={faTrash} />
                <span className="actions-articulo-span">eliminar</span>
              </div>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Articulo;
