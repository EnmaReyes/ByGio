import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getCartTotals,
  readCartFromStorage,
  writeCartToStorage,
} from "../Componentes/cartUtils";

/*
 * Estado del carrito compartido por la cabecera y las páginas.
 *
 * Vive por encima del router a propósito: antes el router se creaba
 * dentro del render de App y recibía el carrito por props, así que
 * cada cambio del carrito lo volvía a crear y remontaba toda la
 * aplicación (perdiendo el estado de la página y las animaciones de
 * ruta). Con el router estable, el carrito se pasa por contexto.
 */
const CarritoContext = createContext(null);

export const CarritoProvider = ({ children }) => {
  const [inicial] = useState(() => {
    const products = readCartFromStorage();
    return { products, ...getCartTotals(products) };
  });

  const [allProducts, setAllProducts] = useState(inicial.products);
  const [total, setTotal] = useState(inicial.total);
  const [countProducts, setCountProducts] = useState(inicial.count);

  useEffect(() => {
    const totales = getCartTotals(allProducts);
    setTotal(totales.total);
    setCountProducts(totales.count);
    writeCartToStorage(allProducts);
  }, [allProducts]);

  const valor = useMemo(
    () => ({
      allProducts,
      setAllProducts,
      total,
      setTotal,
      countProducts,
      setCountProducts,
    }),
    [allProducts, total, countProducts]
  );

  return (
    <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>
  );
};

export const useCarrito = () => {
  const valor = useContext(CarritoContext);

  if (!valor) {
    throw new Error("useCarrito debe usarse dentro de <CarritoProvider>");
  }

  return valor;
};
