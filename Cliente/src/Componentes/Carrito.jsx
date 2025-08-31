import React from "react";
import {
  faBagShopping,
  faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "react-bootstrap";
import { API_URL } from "../config";

const Carrito = ({
  allProducts,
  setAllProducts,
  total,
  setTotal,
  countProducts,
  setCountProducts,
}) => {
  const onDeleteProduct = (product) => {
    // Restar cantidad o eliminar si es el último
    const updatedProducts = allProducts
      .map((item) =>
        item.id === product.id ? { ...item, cantidad: item.cantidad - 1 } : item
      )
      .filter((item) => item.cantidad > 0);

    // Recalcular total desde la lista actualizada
    const newTotal = updatedProducts.reduce(
      (acc, item) => acc + item.cantidad * item.cost,
      0
    );

    // Recalcular cantidad total de productos
    const newCount = updatedProducts.reduce(
      (acc, item) => acc + item.cantidad,
      0
    );

    setAllProducts(updatedProducts);
    setTotal(newTotal);
    setCountProducts(newCount);
  };

  const onClear = () => {
    setAllProducts([]);
    setTotal(0);
    setCountProducts(0);
  };

  const generateWhatsAppLink = () => {
    const message = `¡Hola!😁 Estoy interesado en:\n\n${allProducts
      .map(
        (p) =>
          `${p.cantidad} ${p.title}\nTalla: ${
            p.talla
          }\nValor: $${p.cost?.toLocaleString()}\nImagen:\n${API_URL}${
            p.img[0]
          }`
      )
      .join("\n\n")}`;
    return `https://wa.me/573128919861?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="navbar-collapse me-4 carrito-responsive">
      <ul className="navbar-nav">
        <li className="nav-item dropdown">
          <a
            className="nav-link dropdown-toggle fs-3 p-0 d-inline-flex align-items-center"
            href="#"
            role="button"
            data-bs-toggle="dropdown"
            data-bs-auto-close="false"
            aria-expanded="false"
            style={{ color: "#6C6868" }}
          >
            <span className="icon-badge">
              <FontAwesomeIcon icon={faBagShopping} />
              {countProducts > 0 && <span className="counter" />}
            </span>
          </a>

          <ul
            className="dropdown-menu dropdown-menu-end parrafos"
            style={{ backgroundColor: "#FFFBF5" }}
          >
            {allProducts.length > 0 ? (
              <>
                {allProducts.map((product, idx) => (
                  <li
                    key={idx}
                    className="dropdown-item d-flex justify-content-between align-items-center border-bottom py-2"
                  >
                    <div
                      className="d-flex flex-column"
                      style={{ color: "#6C6868" }}
                    >
                      <small>
                        {product.cantidad}-{product.title}
                      </small>
                      <small>Talla: {product.talla}</small>
                      <small>Valor: ${product.cost?.toLocaleString()}</small>
                    </div>
                    <FontAwesomeIcon
                      icon={faCircleXmark}
                      className="ms-2"
                      style={{ cursor: "pointer", color: "#6C6868" }}
                      onClick={() => onDeleteProduct(product)}
                    />
                  </li>
                ))}
                <li
                  className="dropdown-item text-center py-2 parrafos"
                  style={{ color: "#6C6868" }}
                >
                  <strong>Total: ${total.toLocaleString()}</strong>
                </li>
                <li className="dropdown-item d-flex justify-content-center gap-2 py-2">
                  <Button
                    variant="dark"
                    size="sm"
                    className="rounded-pill titulos"
                    href={generateWhatsAppLink()}
                    target="_blank"
                  >
                    Comprar
                  </Button>
                  <Button
                    variant="outline-dark"
                    size="sm"
                    className="rounded-pill titulos"
                    onClick={onClear}
                  >
                    Vaciar
                  </Button>
                </li>
              </>
            ) : (
              <li
                className="dropdown-item text-center parrafos"
                style={{ color: "#6C6868" }}
              >
                Carrito vacío
              </li>
            )}
          </ul>
        </li>
      </ul>
    </div>
  );
};

export default Carrito;
