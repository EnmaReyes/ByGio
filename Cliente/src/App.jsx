import { ToastContainer } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
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

//! Rutas de pagina\\
const Layout = () => {
  return (
    <>
      <ToastContainer />
      <BarraNavegacion />
      <Outlet />
      <Footer />
    </>
  );
};
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
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
function App() {
  return (
    <div className="app">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
