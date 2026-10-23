import { useEffect, useMemo, useRef, useState } from "react";
import {
  faBagShopping,
  faCircleXmark,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "react-bootstrap";
import {
  getCartItemIdentity,
  getCartTotals,
  getCartPreviewImage,
  isDtfProduct,
} from "./cartUtils";
import "./Carrito.css";

const ProductItem = ({ product, onDelete }) => {
  const esDtf = isDtfProduct(product);
  const imagen = getCartPreviewImage(product);

  return (
    <li className="cart-item">
      {/* Vista previa: la misma pieza para artículos y diseños DTF. */}
      {imagen && (
        <div className="cart-item-image" aria-hidden="true">
          <img src={imagen} alt="" loading="lazy" />
        </div>
      )}
      <div className="cart-item-info">
        <strong className="cart-item-title">
          {product.cantidad} x{" "}
          {esDtf ? `Diseño DTF · ${product.category}` : product.title}
        </strong>
        {esDtf ? (
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
        aria-label={`Quitar ${esDtf ? "diseño DTF" : product.title} del carrito`}
        title="Quitar del carrito"
      >
        <FontAwesomeIcon icon={faCircleXmark} />
      </button>
    </li>
  );
};

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
  const disparadorRef = useRef(null);
  const menuRef = useRef(null);
  const cerrarRef = useRef(null);

  /* Latido del contador: solo cuando el número sube (añadir), no al
     bajar (quitar) ni en la primera carga. La clase se retira en
     `onAnimationEnd`, sin temporizadores. */
  const [contadorLate, setContadorLate] = useState(false);
  const conteoPrevioRef = useRef(countProducts);

  useEffect(() => {
    if (countProducts > conteoPrevioRef.current) {
      setContadorLate(true);
    }
    conteoPrevioRef.current = countProducts;
  }, [countProducts]);

  /* Foco con teclado en el cajón (Bootstrap solo lo abre):
     - al abrir, el foco entra en el cajón (botón de cerrar), así el
       siguiente Tab recorre los productos en vez de saltar a la
       página que queda debajo;
     - al cerrar, si el foco estaba dentro, vuelve al disparador.
     Si el cierre viene de un clic fuera, el foco se queda donde el
     usuario hizo clic y no se roba. */
  useEffect(() => {
    const disparador = disparadorRef.current;
    const menu = menuRef.current;
    if (!disparador || !menu) return undefined;

    const alAbrir = () => cerrarRef.current?.focus();

    const alCerrar = () => {
      if (menu.contains(document.activeElement)) disparador.focus();
    };

    disparador.addEventListener("shown.bs.dropdown", alAbrir);
    disparador.addEventListener("hidden.bs.dropdown", alCerrar);
    return () => {
      disparador.removeEventListener("shown.bs.dropdown", alAbrir);
      disparador.removeEventListener("hidden.bs.dropdown", alCerrar);
    };
  }, []);

  /* El panel se coloca con CSS (`position: fixed` justo debajo de la
     cabecera). Dejar que Popper lo mueva daba una posición incoherente:
     el recuadro se pintaba encima del botón y no había forma de cerrarlo
     (auto-cierre desactivado y sin botón de cierre). Ahora hay tres
     salidas: la X, clic fuera y Escape. */
  const cerrarCarrito = () => {
    const instancia = window.bootstrap?.Dropdown?.getInstance(
      disparadorRef.current,
    );

    if (instancia) instancia.hide();
    else disparadorRef.current?.click();
  };

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

        const imageUrl = getCartPreviewImage(p);
        return `${p.cantidad} ${p.title}\nTalla: ${p.talla}\nValor: $${p.cost?.toLocaleString()}${imageUrl ? `\nImagen:\n${imageUrl}` : ""}`;
      })
      .join("\n\n")}`;
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  }, [allProducts, phoneNumber]);

  return (
    <div className="carrito-responsive">
      <ul className="navbar-nav">
        <li className="nav-item dropdown cart-dropdown">
          <button
            type="button"
            ref={disparadorRef}
            className="nav-link fs-3 p-0 d-inline-flex align-items-center cart-trigger"
            data-bs-toggle="dropdown"
            data-bs-auto-close="outside"
            data-bs-display="static"
            aria-expanded="false"
            aria-label={`Abrir carrito, ${countProducts} productos`}
          >
            <span className="icon-badge">
              <FontAwesomeIcon icon={faBagShopping} />
              {countProducts > 0 && (
                <span
                  className={`cart-counter${
                    contadorLate ? " cart-counter--late" : ""
                  }`}
                  onAnimationEnd={() => setContadorLate(false)}
                >
                  {countProducts > 99 ? "99+" : countProducts}
                </span>
              )}
            </span>
          </button>

          <ul
            ref={menuRef}
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
              <button
                type="button"
                ref={cerrarRef}
                className="cart-close"
                onClick={cerrarCarrito}
                aria-label="Cerrar carrito"
                title="Cerrar carrito"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
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
