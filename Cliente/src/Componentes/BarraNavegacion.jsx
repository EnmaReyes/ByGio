import React, { useContext } from "react";
import logonegro from "../assets/Logo/logo_negro.png";
import { AuthContext } from "../context/authContext";
import { Link } from "react-router-dom";
import Carrito from "./Carrito";
import "../App.css";

const BarraNavegacion = ({
  allProducts,
  setAllProducts,
  total,
  setTotal,
  countProducts,
  setCountProducts,
}) => {
  const { currentUser, logout } = useContext(AuthContext);
  const PhoneNumber = import.meta.env.VITE_NUMBER_PHONE;

  const navbarLinks = [
    {
      href: `https://wa.me/${PhoneNumber}?text=%C2%A1Hola%20byGio!%20Quiero%20hacer%20un%20pedido`,
      label: "Whats'up",
    },
    {
      href: "https://www.instagram.com/bygio_modafemenina?igsh=MXVkaTRpeHBsZXU3ag==",
      label: "Instagram",
    },
  ];

  return (
    <nav className="navbar navbar-expand-sm navbar-light px-3 px-md-4 py-2">
      <div className="container-fluid navbar-shell">
        <Link
          to="/"
          className="navbar-brand me-3 p-0 d-flex align-items-center"
        >
          <img
            src={logonegro}
            alt="Logo ByGio"
            className="navbar-brand-image"
          />
        </Link>

        {/* Contenedor que controla el alineado a la derecha en desktop */}
        <div className="nav-actions d-flex align-items-center gap-2">
          <div className="navbar-desktop-actions d-none d-sm-flex align-items-center gap-2">
            <NavItem href="/" label="Home" />
            <Dropdown label="Links" items={navbarLinks} />
            <UserDropdown currentUser={currentUser} logout={logout} />
          </div>

          <div className="d-flex align-items-center gap-2">
            <Carrito
              allProducts={allProducts}
              setAllProducts={setAllProducts}
              total={total}
              setTotal={setTotal}
              countProducts={countProducts}
              setCountProducts={setCountProducts}
            />
            <button
              className="navbar-toggler rounded-pill"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarSupportedContent"
              aria-controls="navbarSupportedContent"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
          </div>
        </div>

        <div
          className="collapse navbar-collapse d-sm-none"
          id="navbarSupportedContent"
        >
          <div className="navbar-mobile-panel">
            <div className="navbar-mobile-header">
              <span className="parrafos navbar-mobile-title">
                Explora ByGio
              </span>
            </div>
            <ul className="navbar-nav">
              <NavItem href="/" label="Home" mobile />
              <Dropdown label="Links" items={navbarLinks} mobile />
              <UserDropdown currentUser={currentUser} logout={logout} mobile />
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavItem = ({ href, label, mobile = false }) => (
  <li className={`nav-item ${mobile ? "w-100" : ""}`}>
    <a
      className={`nav-link ${mobile ? "nav-link-mobile" : "navbar-link"}`}
      href={href}
    >
      {label}
    </a>
  </li>
);

const Dropdown = ({ label, items, mobile = false }) => (
  <li className={`nav-item dropdown ${mobile ? "w-100" : ""}`}>
    <a
      className={`nav-link dropdown-toggle ${mobile ? "nav-link-mobile" : "navbar-link"}`}
      id={mobile ? "navbarDropdownMobile" : "navbarDropdown"}
      role="button"
      data-bs-toggle="dropdown"
      aria-expanded="false"
    >
      {label}
    </a>
    <ul
      className={`dropdown-menu ${mobile ? "dropdown-menu-end" : ""}`}
      aria-labelledby={mobile ? "navbarDropdownMobile" : "navbarDropdown"}
    >
      {items.map((item, index) => (
        <li key={index}>
          <a
            className="dropdown-item li-navbar-hover"
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  </li>
);

const UserDropdown = ({ currentUser, logout, mobile = false }) => (
  <li className={`nav-item dropdown ${mobile ? "w-100" : ""}`}>
    <a
      className={`nav-link dropdown-toggle ${mobile ? "nav-link-mobile" : "navbar-link"}`}
      id={mobile ? "userDropdownMobile" : "userDropdown"}
      role="button"
      data-bs-toggle="dropdown"
      aria-expanded="false"
    >
      {currentUser ? `Bienvenido ${currentUser?.username}` : "Usuario"}
    </a>
    <ul
      className={`dropdown-menu ${mobile ? "dropdown-menu-end" : ""}`}
      aria-labelledby={mobile ? "userDropdownMobile" : "userDropdown"}
    >
      {currentUser ? (
        <li className="dropdown-item li-navbar-hover">
          <p className="mb-0" onClick={logout}>
            Cerrar Sesión
          </p>
        </li>
      ) : (
        <>
          <li>
            <Link className="dropdown-item li-navbar-hover" to="/login">
              Iniciar Sesión
            </Link>
          </li>
          <li>
            <Link className="dropdown-item li-navbar-hover" to="/register">
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
            <Link className="dropdown-item li-navbar-hover" to="/editor">
              Crear Artículo
            </Link>
          </li>
        </>
      )}
    </ul>
  </li>
);

export default BarraNavegacion;
