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
import PixelPageViewTracker from "./Componentes/PixelPageViewTracker";
import BannerCookies from "./Componentes/BannerCookies";
import PoliticaPrivacidad from "./Paginas/PoliticaPrivacidad";
import TerminosCondiciones from "./Paginas/TerminosCondiciones";

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
      <PixelPageViewTracker />
      <BannerCookies />
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

  const router = createBrowserRouter(
    [
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
          path: "/privacidad",
          element: <PoliticaPrivacidad />,
        },
        {
          path: "/terminos",
          element: <TerminosCondiciones />,
        },
        {
          path: "/:id",
          element: <Articulo />,
        },
      ],
    },
    {
      path: "/register",
      element: (
        <>
          <PixelPageViewTracker />
          <BannerCookies />
          <Registro />
        </>
      ),
    },
    {
      path: "/login",
      element: (
        <>
          <PixelPageViewTracker />
          <BannerCookies />
          <InicioSecion />
        </>
      ),
    },
    ],
    {
      future: {
        v7_startTransition: true,
      },
    },
  );

  return (
    <div className="app">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
