export const CART_STORAGE_KEY = "bygio-cart";

export const isDtfProduct = (product) => product.cartType === "dtf";

export const getCartItemIdentity = (product) =>
  isDtfProduct(product)
    ? `dtf-${product.id}-${product.shirtColor || ""}-${product.dtfSize || ""}`
    : `article-${product.id}-${product.talla || ""}`;

export const getCartTotals = (products) =>
  products.reduce(
    (totals, product) => ({
      total: totals.total + product.cantidad * (Number(product.cost) || 0),
      count: totals.count + product.cantidad,
    }),
    { total: 0, count: 0 },
  );

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
