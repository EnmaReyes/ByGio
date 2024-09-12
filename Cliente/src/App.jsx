import { ToastContainer } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  createBrowserRouter,
  Outlet,
  Route,
  RouterProvider,
} from "react-router-dom";
import BarraNavegacion from "./Componentes/BarraNavegacion";
import Footer from "./Componentes/Footer";
import Inicio from "./Paginas/Inicio";
import Editor from "./Paginas/Editor";
import Articulo from "./Paginas/Articulo";
import { useState } from "react";

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
    <>
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
    </>
  );
};

function App() {
  const [allProducts, setAllProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [countProducts, setCountProducts] = useState(0);

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
          path: "/:id",
          element: <Articulo />,
        },
      ],
    },
  ]);

  return (
    <div className="app">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
