import React from "react";
import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
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
  return (
    <Navbar
      style={{
        position: "fixed",
        width: "100%",
        zIndex: "1",
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
      <div class="collapse navbar-collapse me-4" id="navbarNavDarkDropdown">
        <ul class="navbar-nav">
          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle text-light fs-2"
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
                top: "-1.8rem",
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
              <p className="">{countProducts}</p>
            </div>
            <ul
              class="dropdown-menu dropdown-menu-dark dropdown-menu-end "
              aria-labelledby="navbarDarkDropdownMenuLink"
              style={{ zIndex: "1" }}
            >
              {allProducts.length ? (
                <div>
                  {allProducts.map((product) => (
                    <div className="dropdown-item">
                      <li className="d-flex flex-row align-items-center gap-4 border-bottom p-2 my-1">
                        <a
                          href={`/${product.id}`}
                          className="d-flex flex-row align-items-center gap-2 text-decoration-none text-light"
                        >
                          <a>{product.cantidad}</a>
                          <a>{product.titulo}</a>
                          <a>{product.precio}</a>
                        </a>
                        <a
                          onClick={() => {
                            onDeleteProduct(product);
                          }}
                        >
                          <FontAwesomeIcon icon={faCircleXmark} />
                        </a>
                      </li>
                    </div>
                  ))}
                  <div className="">
                    <p>{`Total: $${total}`}</p>
                  </div>
                  <div
                    class="btn-group d-flex flex-row align-items-center gap-4 mx-2"
                    role="group"
                    aria-label="Basic example"
                  >
                    <button type="button" class="btn btn-dark rounded-pill">
                      Comprar
                    </button>
                    <button
                      type="button"
                      class="btn btn-light rounded-pill"
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
                  <a class="dropdown-item">Carrito Vacio</a>
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
