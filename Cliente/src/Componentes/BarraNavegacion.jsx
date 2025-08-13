import React, { useContext } from "react";
import logonegro from "../assets/Logo/logo_negro.png";
import { AuthContext } from "../context/authContext";
import { Link } from "react-router-dom";
import Carrito from "./Carrito";

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
      className="navbar navbar-expand-sm pb-0 m-0"
      style={{
        position: "fixed",
        width: "100%",
        height: "auto",
        zIndex: 1000,
        backgroundColor: "#FFFBF5",
      }}
    >
      <div className="container-fluid">
        <img
          className="navbar-brand"
          src={logonegro}
          alt="Logo"
          style={{ width: "70px" }}
        />

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          {/* Menú y carrito alineados a la derecha */}
          <div className="d-flex align-items-center ms-auto">
            <ul className="navbar-nav mb-2 mb-lg-0 me-3">
              <NavItem href="/" label="Home" />
              <Dropdown
                label="Links"
                items={[
                  {
                    href: "https://wa.me/573128919861?text=%C2%A1Hola%20byGio!%20Quiero%20hacer%20un%20pedido",
                    label: "Whats'up",
                  },
                  {
                    href: "https://www.instagram.com/bygio_modafemenina?igsh=MXVkaTRpeHBsZXU3ag==",
                    label: "Instagram",
                  },
                ]}
              />
              <UserDropdown currentUser={currentUser} logout={logout} />
              <Carrito
                allProducts={allProducts}
                setAllProducts={setAllProducts}
                total={total}
                setTotal={setTotal}
                countProducts={countProducts}
                setCountProducts={setCountProducts}
              />
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavItem = ({ href, label }) => (
  <li className="nav-item">
    <a className="nav-link" href={href}>
      {label}
    </a>
  </li>
);

const Dropdown = ({ label, items }) => (
  <li className="nav-item dropdown">
    <a
      className="nav-link dropdown-toggle"
      style={{ color: "#6C6868" }}
      id="navbarDropdown"
      role="button"
      data-bs-toggle="dropdown"
      aria-expanded="false"
    >
      {label}
    </a>
    <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
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

const UserDropdown = ({ currentUser, logout }) => (
  <li className="nav-item dropdown">
    <a
      className="nav-link dropdown-toggle"
      id="userDropdown"
      role="button"
      data-bs-toggle="dropdown"
      aria-expanded="false"
    >
      {currentUser ? `Bienvenido ${currentUser?.username}` : "Usuario"}
    </a>
    <ul className="dropdown-menu" aria-labelledby="userDropdown">
      {currentUser ? (
        <li>
          <button className="dropdown-item li-navbar-hover" onClick={logout}>
            Cerrar Sesión
          </button>
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
