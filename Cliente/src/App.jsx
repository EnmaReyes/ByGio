import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import BarraNavegacion from "./Componentes/BarraNavegacion";
import Footer from "./Componentes/Footer";
import Inicio from "./Paginas/Inicio";
import Editor from "./Paginas/Editor";
import { useEffect, useState } from "react";
import Registro from "./Paginas/Registro";
import InicioSecion from "./Paginas/InicioSecion";
import Articulo from "./Paginas/ArticuloDetallado/Articulo";
import UploadDTF from "./Paginas/DTF/UploadDTF";
import "./App.css";
import DtfCategories from "./Paginas/DTF/DtfCategories";
import {
  getCartTotals,
  readCartFromStorage,
  writeCartToStorage,
} from "./Componentes/cartUtils";

//! Rutas de pagina\\
const Layout = ({
  allProducts,
  total,
  countProducts,
  setAllProducts,
  setTotal,
  setCountProducts,
}) => {
  return (
    <div className="site-shell">
      <ToastContainer />
      <BarraNavegacion
        allProducts={allProducts}
        setAllProducts={setAllProducts}
        total={total}
        setTotal={setTotal}
        countProducts={countProducts}
        setCountProducts={setCountProducts}
      />
      <Outlet
        context={{
          allProducts,
          setAllProducts,
          total,
          setTotal,
          countProducts,
          setCountProducts,
        }}
      />
      <Footer />
    </div>
  );
};

function App() {
  const [initialCart] = useState(() => {
    const products = readCartFromStorage();
    return { products, ...getCartTotals(products) };
  });
  const [allProducts, setAllProducts] = useState(initialCart.products);
  const [total, setTotal] = useState(initialCart.total);
  const [countProducts, setCountProducts] = useState(initialCart.count);

  useEffect(() => {
    const cartTotals = getCartTotals(allProducts);
    setTotal(cartTotals.total);
    setCountProducts(cartTotals.count);
    writeCartToStorage(allProducts);
  }, [allProducts]);

  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <Layout
          allProducts={allProducts}
          total={total}
          countProducts={countProducts}
          setAllProducts={setAllProducts}
          setTotal={setTotal}
          setCountProducts={setCountProducts}
        />
      ),
      children: [
        {
          path: "/",
          element: <Inicio />,
        },
        {
          path: "/editor",
          element: <Editor />,
        },
        {
          path: "/dtf/upload",
          element: <UploadDTF />,
        },
        {
          path: "/dtf",
          element: <DtfCategories />,
        },
        {
          path: "/dtfcategories",
          element: <DtfCategories />,
        },
        {
          path: "/:id",
          element: <Articulo />,
        },
      ],
    },
    {
      path: "/register",
      element: <Registro />,
    },
    {
      path: "/login",
      element: <InicioSecion />,
    },
  ]);

  return (
    <div className="app">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
