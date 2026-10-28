import { Slide, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  createBrowserRouter,
  RouterProvider,
  useLocation,
} from "react-router-dom";
import BarraNavegacion from "./Componentes/BarraNavegacion";
import Footer from "./Componentes/Footer";
import Inicio from "./Paginas/Inicio";
import Editor from "./Paginas/Editor";
import Registro from "./Paginas/Registro";
import InicioSecion from "./Paginas/InicioSecion";
import Articulo from "./Paginas/ArticuloDetallado/Articulo";
import UploadDTF from "./Paginas/DTF/UploadDTF";
import "./App.css";
import DtfCategories from "./Paginas/DTF/DtfCategories";
import PixelPageViewTracker from "./Componentes/PixelPageViewTracker";
import BannerCookies from "./Componentes/BannerCookies";
import PoliticaPrivacidad from "./Paginas/PoliticaPrivacidad";
import TerminosCondiciones from "./Paginas/TerminosCondiciones";
import Productos from "./Paginas/Productos";
import Checkout from "./Paginas/Checkout";
import MisPedidos from "./Paginas/MisPedidos";
import PedidoDetalle from "./Paginas/PedidoDetalle";
import AdminPedidos from "./Paginas/Admin/AdminPedidos";
import AdminPedidoDetalle from "./Paginas/Admin/AdminPedidoDetalle";
import AdminDtfPrecios from "./Paginas/Admin/AdminDtfPrecios";
import { TemaProvider } from "./tema/TemaProvider";
import { CarritoProvider, useCarrito } from "./carrito/CarritoProvider";
import TransicionRuta from "./Componentes/TransicionRuta";

//! Rutas de pagina\\
const Layout = () => {
  const { pathname } = useLocation();
  const {
    allProducts,
    setAllProducts,
    total,
    setTotal,
    countProducts,
    setCountProducts,
  } = useCarrito();

  // En la portada el hero se mete bajo la cabecera fija.
  const enPortada = pathname === "/";

  return (
    <div className="site-shell">
      <a className="saltar-contenido" href="#contenido">
        Saltar al contenido
      </a>
      <PixelPageViewTracker />
      <BannerCookies />
      {/* Posición y comportamiento por defecto de los avisos: los
          toasts que no pasan opciones (o pasan solo algunas) salen
          abajo a la derecha, que es donde apuntan las acciones. Slide
          en vez del Bounce por defecto: el rebote no es de la casa. */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        transition={Slide}
      />
      <BarraNavegacion
        allProducts={allProducts}
        setAllProducts={setAllProducts}
        total={total}
        setTotal={setTotal}
        countProducts={countProducts}
        setCountProducts={setCountProducts}
      />
      <main
        id="contenido"
        className={`contenido-principal${
          enPortada ? " contenido-principal--inicio" : ""
        }`}
      >
        <TransicionRuta />
      </main>
      <Footer />
    </div>
  );
};

/*
 * El router se crea UNA vez, fuera del render: si se creara dentro de
 * App (como antes), cada cambio de carrito lo recrearía y remontaría
 * toda la aplicación, incluida la transición entre páginas.
 */
const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "/",
          element: <Inicio />,
        },
        {
          path: "/productos",
          element: <Productos />,
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
          path: "/checkout",
          element: <Checkout />,
        },
        {
          path: "/mis-pedidos",
          element: <MisPedidos />,
        },
        {
          path: "/mis-pedidos/:id",
          element: <PedidoDetalle />,
        },
        {
          path: "/admin/pedidos",
          element: <AdminPedidos />,
        },
        {
          path: "/admin/pedidos/:id",
          element: <AdminPedidoDetalle />,
        },
        {
          path: "/admin/dtf",
          element: <AdminDtfPrecios />,
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
  }
);

function App() {
  return (
    <TemaProvider>
      <CarritoProvider>
        <div className="app">
          <RouterProvider router={router} />
        </div>
      </CarritoProvider>
    </TemaProvider>
  );
}

export default App;
