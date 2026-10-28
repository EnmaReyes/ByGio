export const CART_STORAGE_KEY = "bygio-cart";

export const isDtfProduct = (product) => product.cartType === "dtf";

export const formatPrice = (value) =>
  `$${(Number(value) || 0).toLocaleString()}`;

/* Precio unitario real de un articulo: `cost` es el precio actual y
   `descuento` solo es el precio anterior que se muestra tachado. */
export const getUnitPrice = (product) => Number(product?.cost) || 0;

export const DTF_SIZE_LABELS = {
  basic: "Básico",
  basico: "Básico",
  oversize: "Oversize",
};

const normalizarTipoDtf = (size) =>
  String(size || "").toLowerCase() === "oversize" ? "oversize" : "basico";

/* Variante de precio del DTF. En BD el tipo es "basico"/"oversize"; la
   vista usa "basic"/"oversize". */
export const getDtfVariant = (product, size) => {
  const tipo = normalizarTipoDtf(size ?? product?.dtfSize);
  const variantes = Array.isArray(product?.priceVariants)
    ? product.priceVariants
    : [];

  return (
    variantes.find(
      (variante) => variante.tipo === tipo && variante.activo !== false,
    ) || null
  );
};

export const getDtfUnitPrice = (product) => {
  const variante = getDtfVariant(product, product?.dtfSize);
  const precio = Number(variante?.precio);

  if (Number.isFinite(precio) && precio > 0) return precio;

  // Respaldo para carritos viejos que ya guardaban el precio en `cost`.
  const respaldo = Number(product?.cost);
  return Number.isFinite(respaldo) && respaldo > 0 ? respaldo : 0;
};

/* Titulo legible para cualquier linea del carrito o pedido. */
export const cartItemTitle = (product) => {
  if (!isDtfProduct(product)) return product?.title || "Producto";

  const categoria =
    typeof product?.category === "string"
      ? product.category
      : product?.category?.name || product?.categoryName || "";

  return `Diseño DTF · ${categoria || "Sin categoría"}`;
};

/* Detalles de la variante, en el orden en que se leen en el carrito. */
export const cartItemDetails = (product) => {
  if (!isDtfProduct(product)) {
    return [product?.talla ? `Talla: ${product.talla}` : ""].filter(Boolean);
  }

  return [
    product?.shirtName ? `Franela: ${product.shirtName}` : "",
    product?.dtfSize
      ? `Tamaño: ${DTF_SIZE_LABELS[product.dtfSize] || product.dtfSize}`
      : "",
  ].filter(Boolean);
};

export const getCartItemIdentity = (product) =>
  isDtfProduct(product)
    ? `dtf-${product.id}-${product.shirtColor || ""}-${product.dtfSize || ""}`
    : `article-${product.id}-${product.talla || ""}`;

export const getCartTotals = (products) =>
  products.reduce(
    (totals, product) => {
      const unitario = isDtfProduct(product)
        ? getDtfUnitPrice(product)
        : getUnitPrice(product);

      return {
        total: totals.total + product.cantidad * unitario,
        count: totals.count + product.cantidad,
      };
    },
    { total: 0, count: 0 },
  );

/* Primera URL de una entrada de imagen. La API puede entregar la
   imagen como texto suelto, como objeto de Cloudinary o como array
   de cualquiera de los dos. */
const urlDeImagen = (entrada) => {
  if (typeof entrada === "string") return entrada.trim();
  if (entrada && typeof entrada === "object") {
    return entrada.url || entrada.secure_url || "";
  }
  return "";
};

/* Imagen de vista previa del artículo para el carrito.
   La API entrega `img` como JSON en texto, pero según por dónde se
   añadió al carrito llega ya parseado (array) o como una sola URL
   (los diseños DTF). Se aceptan las tres formas. */
export const getCartPreviewImage = (product) => {
  const imagen = product?.img;

  if (Array.isArray(imagen)) {
    for (const entrada of imagen) {
      const url = urlDeImagen(entrada);
      if (url) return url;
    }
    return "";
  }

  if (typeof imagen !== "string") return "";

  const texto = imagen.trim();
  if (!texto) return "";

  if (texto.startsWith("[") || texto.startsWith("{")) {
    try {
      const parsed = JSON.parse(texto);
      if (Array.isArray(parsed)) {
        for (const entrada of parsed) {
          const url = urlDeImagen(entrada);
          if (url) return url;
        }
        return "";
      }
      return urlDeImagen(parsed);
    } catch {
      return "";
    }
  }

  return texto;
};

export const readCartFromStorage = () => {
  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!storedCart) return [];

    const products = JSON.parse(storedCart);
    return Array.isArray(products) ? products : [];
  } catch (error) {
    console.error("No se pudo recuperar el carrito guardado:", error);
    return [];
  }
};

export const writeCartToStorage = (products) => {
  try {
    if (products.length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return;
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(products));
  } catch (error) {
    console.error("No se pudo guardar el carrito:", error);
  }
};
