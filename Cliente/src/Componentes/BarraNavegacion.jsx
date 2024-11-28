import React, { useContext, useEffect } from "react";
import logonegro from "../assets/Logo/logo-blanco.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBagShopping,
  faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";

import Carrito from "./Carrito";
import { AuthContext } from "../context/authContext";
import { Link } from "react-router-dom";

const BarraNavegacion = ({
  allProducts,
  setAllProducts,
  total,
  setTotal,
  countProducts,
  setCountProducts,
}) => {
  const { currentUser, logout } = useContext(AuthContext);

  return (
    <nav
      className="navbar navbar-expand-lg navbar-light bg-dark"
      style={{ position: "fixed", width: "100%", zIndex: "1000" }}
    >
      <div className="container-fluid">
        <img
          className="navbar-brand"
          src={logonegro}
          style={{ width: "95px" }}
        />
        <button
          className="navbar-toggler "
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation" 
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse " id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <a
                className="nav-link active text-light"
                aria-current="page"
                href="/"
              >
                Home
              </a>
            </li>

            {/* Link dropdown */}
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle text-light"
                id="navbarDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Links
              </a>
              <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                <li className="nav-item dropdown">
                  <a
                    className="dropdown-item li-navbar-hover"
                    href="https://wa.me/573128919861?text=%C2%A1Hola%20byGio!%20Quiero%20hacer%20un%20pedido"
                    target="_blank"
                  >
                    Whats'up
                  </a>
                  <a
                    className="dropdown-item li-navbar-hover"
                    href="https://www.instagram.com/bygio_modafemenina?igsh=MXVkaTRpeHBsZXU3ag=="
                    target="_blank"
                  >
                    Instagram
                  </a>
                </li>
              </ul>
            </li>

            {/* User dropdown */}
            <li className="nav-item dropdown">
              {currentUser ? (
                <a
                  className="nav-link dropdown-toggle text-light"
                  id="navbarDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {`Bienvenido ${currentUser?.username}`}
                </a>
              ) : (
                <a
                  className="nav-link dropdown-toggle text-light"
                  id="navbarDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Usuario
                </a>
              )}
              <ul className="dropdown-menu " aria-labelledby="navbarDropdown">
                {currentUser ? (
                  <li>
                    <a
                      className="dropdown-item li-navbar-hover"
                      onClick={() => logout()}
                    >
                      Cerrar Seción
                    </a>
                  </li>
                ) : (
                  <>
                    <li>
                      <Link
                        className="dropdown-item li-navbar-hover"
                        to="/login"
                      >
                        Iniciar Sesión
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="dropdown-item li-navbar-hover"
                        to="/register"
                      >
                        Registrarte
                      </Link>
                    </li>
                  </>
                )}

                {currentUser?.admin && (
                  <>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <Link
                        className="dropdown-item li-navbar-hover"
                        to="/editor"
                      >
                        Crear Articulo
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </li>
          </ul>
          {/* <form className="d-flex">
          <input className="form-control me-2" type="search" placeholder="Search" aria-label="Search">
          <button className="btn btn-outline-success" type="submit">Search</button>
          </form> */}
        </div>
      </div>
          <div className="carrito-responsive nav-item"> 
          <Carrito
            allProducts={allProducts}
            setAllProducts={setAllProducts}
            total={total}
            setTotal={setTotal}
            countProducts={countProducts}
            setCountProducts={setCountProducts}
          />
          </div>
    </nav>
  );
};

export default BarraNavegacion;
