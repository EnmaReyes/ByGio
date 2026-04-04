import React, { useMemo } from "react";
import {
  faBagShopping,
  faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "react-bootstrap";
import { API_URL } from "../config";

const STYLES = {
  navLink: { color: "#6C6868" },
  dropdown: { backgroundColor: "#FFFBF5" },
  text: { color: "#6C6868" },
};

const ProductItem = ({ product, onDelete }) => (
  <li className="dropdown-item d-flex justify-content-between align-items-center border-bottom py-2">
    <div className="d-flex flex-column" style={STYLES.text}>
      <small>
        {product.cantidad}-{product.title}
      </small>
      <small>Talla: {product.talla}</small>
      <small>Valor: ${product.cost?.toLocaleString()}</small>
    </div>
    <FontAwesomeIcon
      icon={faCircleXmark}
      className="ms-2"
      style={{ cursor: "pointer", ...STYLES.text }}
      onClick={() => onDelete(product)}
    />
  </li>
);

const CartSummary = ({ total, onBuy, onClear }) => (
  <>
    <li className="dropdown-item text-center py-2 parrafos" style={STYLES.text}>
      <strong>Total: ${total.toLocaleString()}</strong>
    </li>
    <li className="dropdown-item d-flex justify-content-center gap-2 py-2">
      <a
        href={onBuy()}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-dark btn-sm rounded-pill titulos"
        style={{ textDecoration: "none" }}
      >
        Comprar
      </a>
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
);

const Carrito = ({
  allProducts,
  setAllProducts,
  total,
  setTotal,
  countProducts,
  setCountProducts,
}) => {
  const phoneNumber = import.meta.env.VITE_NUMBER_PHONE;

  const updateCart = (updatedProducts) => {
    const newTotal = updatedProducts.reduce(
      (acc, item) => acc + item.cantidad * item.cost,
      0,
    );
    const newCount = updatedProducts.reduce(
      (acc, item) => acc + item.cantidad,
      0,
    );

    setAllProducts(updatedProducts);
    setTotal(newTotal);
    setCountProducts(newCount);
  };

  const onDeleteProduct = (product) => {
    const updatedProducts = allProducts
      .map((item) =>
        item.id === product.id
          ? { ...item, cantidad: item.cantidad - 1 }
          : item,
      )
      .filter((item) => item.cantidad > 0);

    updateCart(updatedProducts);
  };

  const onClear = () => {
    updateCart([]);
  };

  const generateWhatsAppLink = useMemo(() => {
    const message = `¡Hola!😁 Estoy interesado en:\n\n${allProducts
      .map((p) => {
        const imageUrl = p.img?.[0] ? `${p.img[0]}` : "";
        return `${p.cantidad} ${p.title}\nTalla: ${p.talla}\nValor: $${p.cost?.toLocaleString()}${imageUrl ? `\nImagen:\n${imageUrl}` : ""}`;
      })
      .join("\n\n")}`;
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  }, [allProducts, phoneNumber]);

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
            style={STYLES.navLink}
          >
            <span className="icon-badge">
              <FontAwesomeIcon icon={faBagShopping} />
              {countProducts > 0 && <span className="counter" />}
            </span>
          </a>

          <ul
            className="dropdown-menu dropdown-menu-end parrafos"
            style={STYLES.dropdown}
          >
            {allProducts.length > 0 ? (
              <>
                {allProducts.map((product, idx) => (
                  <ProductItem
                    key={idx}
                    product={product}
                    onDelete={onDeleteProduct}
                  />
                ))}
                <CartSummary
                  total={total}
                  onBuy={() => generateWhatsAppLink}
                  onClear={onClear}
                />
              </>
            ) : (
              <li
                className="dropdown-item text-center parrafos"
                style={STYLES.text}
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
