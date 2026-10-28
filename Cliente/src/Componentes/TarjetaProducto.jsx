import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

const parseJsonValue = (valor) => {
  if (typeof valor !== "string") return valor;
  try {
    return JSON.parse(valor);
  } catch {
    return valor;
  }
};

const obtenerImagen = (articulo) => {
  const imagenes = parseJsonValue(articulo?.img);
  if (Array.isArray(imagenes)) return imagenes[0] || "";
  if (typeof imagenes === "string") return imagenes;
  return "";
};

const obtenerTallas = (articulo) => {
  const tallas = parseJsonValue(articulo?.sizes);
  return Array.isArray(tallas) ? tallas.filter(Boolean) : [];
};

const generarEnlaceWhatsApp = (articulo, telefono) => {
  const talla = articulo?.oversize ? "Over size" : "S/M/L";
  const precio = Number(articulo?.cost) || 0;
  const mensaje = `¡Hola!😁 Estoy interesado en:\n${articulo?.title}\nValor: $${precio.toLocaleString()} por unidad\n¿Está disponible en ${talla}?`;
  const imagen = obtenerImagen(articulo);
  const base = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
  return imagen ? `${base}%0A%0A${encodeURIComponent(imagen)}` : base;
};

const calcularPorcentaje = (precioAnterior, precioActual) => {
  const anterior = Number(precioAnterior);
  const actual = Number(precioActual);
  if (!anterior || anterior <= 0 || anterior <= actual) return 0;
  return Math.round(((anterior - actual) / anterior) * 100);
};

const TarjetaProducto = ({ articulo, mostrarDescuento = false, indice = 0 }) => {
  const [errorImagen, setErrorImagen] = useState(false);
  const imagenRef = useRef(null);
  const telefono = import.meta.env.VITE_NUMBER_PHONE;
  const imagen = obtenerImagen(articulo);
  const tallas = obtenerTallas(articulo);
  const precio = Number(articulo?.cost) || 0;

  useEffect(() => {
    setErrorImagen(false);
  }, [articulo?.id, imagen]);

  useEffect(() => {
    const img = imagenRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      setErrorImagen(true);
    }
  }, [imagen]);

  const enlaceWhatsApp = useMemo(
    () => generarEnlaceWhatsApp(articulo, telefono),
    [articulo, telefono],
  );

  const porcentaje = mostrarDescuento
    ? calcularPorcentaje(articulo?.descuento, articulo?.cost)
    : 0;

  const descuento = Number(articulo?.descuento) || 0;
  const tieneDescuento = mostrarDescuento && descuento > precio;

  const tieneStock = articulo?.stock !== false;

  return (
    <li className="tarjeta-producto" style={{ "--i": indice }}>
      <Link
        to={`/${articulo?.id}`}
        className="tarjeta-media"
        aria-label={`${
          porcentaje > 0 ? `-${porcentaje}%. ` : ""
        }${!tieneStock ? "Agotado. " : ""}Ver detalle de ${
          articulo?.title || "producto"
        }`}
      >
        <span className="tarjeta-badges">
          {porcentaje > 0 && (
            <span className="tarjeta-badge">-{porcentaje}%</span>
          )}
          {!tieneStock && (
            <span className="tarjeta-badge tarjeta-badge--agotado">
              Agotado
            </span>
          )}
        </span>

        {imagen && !errorImagen ? (
          <img
            ref={imagenRef}
            className="tarjeta-imagen"
            src={imagen}
            alt={articulo?.title || "Producto ByGio"}
            loading="lazy"
            onError={() => setErrorImagen(true)}
          />
        ) : (
          <span className="tarjeta-placeholder">Imagen no disponible</span>
        )}

        <span className="tarjeta-barra" aria-hidden="true">
          Ver producto
        </span>
      </Link>

      {tieneStock && (
        <a
          className="tarjeta-whatsapp"
          href={enlaceWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          title="Comprar por WhatsApp"
          aria-label={`Comprar ${
            articulo?.title || "este producto"
          } por WhatsApp`}
        >
          <FontAwesomeIcon icon={faWhatsapp} aria-hidden="true" />
        </a>
      )}

      <div className="tarjeta-cuerpo">
        <h3 className="tarjeta-titulo">{articulo?.title}</h3>

        {articulo?.oversize ? (
          <ul className="tarjeta-tallas">
            <li className="tarjeta-talla">Oversize</li>
          </ul>
        ) : (
          tallas.length > 0 && (
            <ul className="tarjeta-tallas">
              {tallas.map((talla) => (
                <li key={talla} className="tarjeta-talla">
                  {talla}
                </li>
              ))}
            </ul>
          )
        )}

        <div className="tarjeta-precios">
          {tieneDescuento && (
            <span className="tarjeta-precio tarjeta-precio--anterior">
              ${descuento.toLocaleString()}
            </span>
          )}
          <span
            className={`tarjeta-precio ${
              tieneDescuento ? "tarjeta-precio--descuento" : ""
            }`}
          >
            ${precio.toLocaleString()}
          </span>
        </div>
      </div>
    </li>
  );
};

export default TarjetaProducto;
