import { useMemo } from "react";
import {
  faBagShopping,
  faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "react-bootstrap";
import { getCartItemIdentity, getCartTotals, isDtfProduct } from "./cartUtils";
import "./Carrito.css";

const ProductItem = ({ product, onDelete }) => (
  <li className="cart-item">
    {isDtfProduct(product) && (
      <div className="cart-item-image" aria-hidden="true">
        <img src={product.img} alt="" />
      </div>
    )}
    <div className="cart-item-info">
      <strong className="cart-item-title">
        {product.cantidad} x{" "}
        {isDtfProduct(product)
          ? `Diseño DTF · ${product.category}`
          : product.title}
      </strong>
      {isDtfProduct(product) ? (
        <>
          {product.shirtName && (
            <small className="cart-item-detail">
              Franela: {product.shirtName}
            </small>
          )}
          {product.dtfSize && (
            <small className="cart-item-detail">
              Tamaño: {product.dtfSize === "oversize" ? "Oversize" : "Básico"}
            </small>
          )}
        </>
      ) : (
        <>
          <small className="cart-item-detail">Talla: {product.talla}</small>
          <small className="cart-item-detail">
            Valor: ${(Number(product.cost) || 0).toLocaleString()}
          </small>
        </>
      )}
    </div>
    <button
      type="button"
      className="cart-remove-button"
      onClick={() => onDelete(product)}
      aria-label={`Quitar ${isDtfProduct(product) ? "diseño DTF" : product.title} del carrito`}
      title="Quitar del carrito"
    >
      <FontAwesomeIcon icon={faCircleXmark} />
    </button>
  </li>
);

const CartSummary = ({ total, onBuy, onClear }) => (
  <div className="cart-summary">
    {total > 0 && (
      <div className="cart-total">
        <span>Total</span>
        <strong>${total.toLocaleString()}</strong>
      </div>
    )}
    <div className="cart-actions">
      <a
        href={onBuy()}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-dark rounded-pill titulos cart-buy-button"
      >
        Comprar
      </a>
      <Button
        variant="outline-dark"
        className="rounded-pill titulos cart-clear-button"
        onClick={onClear}
      >
        Vaciar
      </Button>
    </div>
  </div>
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
    const { total: newTotal, count: newCount } = getCartTotals(updatedProducts);

    setAllProducts(updatedProducts);
    setTotal(newTotal);
    setCountProducts(newCount);
  };

  const onDeleteProduct = (product) => {
    const productIdentity = getCartItemIdentity(product);
    const updatedProducts = allProducts
      .map((item) =>
        getCartItemIdentity(item) === productIdentity
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
    const message = `¡Hola! Estoy interesado en:\n\n${allProducts
      .map((p) => {
        if (isDtfProduct(p)) {
          const configuration = [
            p.shirtName && `Color de franela: ${p.shirtName}`,
            p.dtfSize &&
              `Tamaño: ${p.dtfSize === "oversize" ? "Oversize" : "Básico"}`,
          ]
            .filter(Boolean)
            .join("\n");
          return `${p.cantidad} Diseño DTF - Categoría: ${p.category}${configuration ? `\n${configuration}` : ""}\nImagen:\n${p.img}`;
        }

        const imageUrl = p.img?.[0] ? `${p.img[0]}` : "";
        return `${p.cantidad} ${p.title}\nTalla: ${p.talla}\nValor: $${p.cost?.toLocaleString()}${imageUrl ? `\nImagen:\n${imageUrl}` : ""}`;
      })
      .join("\n\n")}`;
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  }, [allProducts, phoneNumber]);

  return (
    <div className="navbar-collapse me-4 carrito-responsive">
      <ul className="navbar-nav">
        <li className="nav-item dropdown cart-dropdown">
          <button
            type="button"
            className="nav-link fs-3 p-0 d-inline-flex align-items-center cart-trigger"
            data-bs-toggle="dropdown"
            data-bs-auto-close="false"
            aria-expanded="false"
            aria-label={`Abrir carrito, ${countProducts} productos`}
          >
            <span className="icon-badge">
              <FontAwesomeIcon icon={faBagShopping} />
              {countProducts > 0 && (
                <span className="cart-counter">
                  {countProducts > 99 ? "99+" : countProducts}
                </span>
              )}
            </span>
          </button>

          <ul
            className="dropdown-menu dropdown-menu-end cart-menu"
            aria-label="Contenido del carrito"
          >
            <li className="cart-header">
              <div>
                <strong>Tu carrito</strong>
                <span>
                  {countProducts}{" "}
                  {countProducts === 1 ? "artículo" : "artículos"}
                </span>
              </div>
            </li>
            {allProducts.length > 0 ? (
              <>
                <li className="cart-products">
                  <ul>
                    {allProducts.map((product) => (
                      <ProductItem
                        key={getCartItemIdentity(product)}
                        product={product}
                        onDelete={onDeleteProduct}
                      />
                    ))}
                  </ul>
                </li>
                <li>
                  <CartSummary
                    total={total}
                    onBuy={() => generateWhatsAppLink}
                    onClear={onClear}
                  />
                </li>
              </>
            ) : (
              <li className="cart-empty">
                <FontAwesomeIcon icon={faBagShopping} />
                <strong>Tu carrito está vacío</strong>
                <span>Agrega tus favoritos para verlos aquí.</span>
              </li>
            )}
          </ul>
        </li>
      </ul>
    </div>
  );
};

export default Carrito;
