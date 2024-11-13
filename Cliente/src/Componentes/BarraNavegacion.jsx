import React, { useEffect } from "react";
import { Button, Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import logonegro from "../assets/Logo/logo-blanco.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBagShopping,
  faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useOutletContext } from "react-router-dom";

const BarraNavegacion = ({
  allProducts,
  setAllProducts,
  total,
  setTotal,
  countProducts,
  setCountProducts,
}) => {
  
  const onDeleteProduct = (product) => {
    const results = allProducts
      .map((item) => {
        if (item.id === product.id) {
          if (item.cantidad > 1) {
            // Si tiene más de 1 cantidad, solo resta una
            return { ...item, cantidad: item.cantidad - 1 };
          } else {
            // Si tiene 1 cantidad, lo elimina del carrito
            return null;
          }
        }
        return item;
      })
      .filter((item) => item !== null); // Filtra los productos eliminados (null)

    setTotal(total - product.precio);
    setCountProducts(countProducts - 1);
    setAllProducts(results);
  };

  const onClear = () => {
    setAllProducts([]);
    setTotal(0);
    setCountProducts(0);
  };

  //! Comprar articulo\\
  const URL = "https://bygio.onrender.com";

  const SendWhatsAppLink = (allProducts) => {
    const message = `¡Hola!😁 Estoy interesado en:\n\n${allProducts
      .map((art) => {
        return `${art.cantidad} ${art?.titulo}\nTalla: ${
          art?.talla
        }\nValor: $${art.precio.toLocaleString()}\nImagen de referencia:\n${URL}${
          art.imagen[0]
        }`;
      })
      .join("\n\n")}`; // Unimos los productos con dos saltos de línea para mayor legibilidad

    const whatsappLink = `https://wa.me/573128919861?text=${encodeURIComponent(
      message
    )}`;
    return whatsappLink;
  };
  return (
    <Navbar
      style={{
        position: "fixed",
        width: "100%",
        zIndex: "999",
        background:
          "linear-gradient(100deg, rgba(57,53,53,1) 0%, rgba(18,17,17,1) 25%, black 50%, rgba(18,17,17,1) 75%, rgba(57,53,53,1) 100%)",
      }}
    >
      <Container
        style={{
          display: "flex",
          justifyContent: "start",
          alignItems: "center",
        }}
      >
        <Navbar.Brand style={{ width: "80px" }}>
          <a href="/" className="ms-2">
            <img
              src={logonegro}
              style={{ width: "100%" }}
              className="d-inline-block align-top object-fit-cover"
              alt="logo"
            />
          </a>
        </Navbar.Brand>
      </Container>
      {/* Carrito*/}
      <div className="collapse navbar-collapse me-4" id="navbarNavDarkDropdown">
        <ul className="navbar-nav">
          <li className="nav-item dropdown">
            <a
              className="nav-link dropdown-toggle text-light fs-2 p-0"
              href="#"
              id="navbarDarkDropdownMenuLink"
              role="button"
              data-bs-toggle="dropdown"
              data-bs-auto-close="false"
              aria-expanded="false"
            >
              <FontAwesomeIcon icon={faBagShopping} />
            </a>
            <div
              style={{
                position: "relative",
                top: "-1.2rem",
                left: "-0.5rem",
                border: "solid, 1px, #fff",
                width: "1.3rem",
                height: "1.3rem",
                borderRadius: "50%",
                background: "#000",
                textAlign: "center",
                color: "#fff",
                lineHeight: "1.2rem",
                fontSize: "12px",
              }}
            >
              <p className="fw-bolder">{countProducts}</p>
            </div>
            <ul
              className="dropdown-menu dropdown-menu-dark dropdown-menu-end "
              aria-labelledby="navbarDarkDropdownMenuLink"
              style={{ zIndex: "1" }}
            >
              {allProducts.length ? (
                <div>
                  {allProducts.map((product) => (
                    <div className="dropdown-item ">
                      <li className="w-100 d-flex flex-rowalign-items-center gap-4 border-bottom p-2 my-1">
                        <a
                          href={`/${product.id}`}
                          className="d-flex flex-row align-items-center gap-3 text-decoration-none text-light"
                        >
                          <a>{product.cantidad}</a>
                          <a>{product.titulo}</a>
                          <a>{product.talla}</a>
                          <a>{product.precio.toLocaleString()}</a>
                        </a>
                        <a
                          className="w-100 d-flex flex-row justify-content-end align-items-center text-decoration-none text-light"
                          onClick={() => {
                            onDeleteProduct(product);
                          }}
                        >
                          <FontAwesomeIcon icon={faCircleXmark} />
                        </a>
                      </li>
                    </div>
                  ))}
                  <div className="d-flex flex-row justify-content-center gap-1 fs-5">
                    <p>Total:</p>
                    <p className="text-light">{`$${total.toLocaleString()}`}</p>
                  </div>
                  <div
                    className="btn-group d-flex flex-row align-items-center gap-4 mx-2"
                    role="group"
                    aria-label="Basic example"
                  >
                    <Button
                      type="button"
                      className="btn btn-dark rounded-pill"
                      href={SendWhatsAppLink(allProducts)}
                      target="_blank"
                    >
                      Comprar
                    </Button>
                    <button
                      type="button"
                      className="btn btn-light rounded-pill"
                      onClick={() => {
                        onClear();
                      }}
                    >
                      Vaciar
                    </button>
                  </div>
                </div>
              ) : (
                <li>
                  <a className="dropdown-item">Carrito Vacio</a>
                </li>
              )}
            </ul>
          </li>
        </ul>
      </div>
    </Navbar>
  );
};

export default BarraNavegacion;
