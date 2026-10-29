import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faChevronDown,
  faRightFromBracket,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from "../context/authContext";
import Carrito from "./Carrito";
import SelectorTema from "./SelectorTema";
import logonegro from "../assets/Logo/logo_negro.png";
import "../App.css";

const enlacesPrincipales = [
  { to: "/", label: "Inicio" },
  { to: "/productos", label: "Productos" },
  { to: "/dtf", label: "Crea" },
];

/*
 * Etiqueta con dos copias apiladas: al pasar el cursor (o al
 * enfocar con el teclado) ambas suben una línea, como el hover de
 * la navegación de Sabina. La copia extra queda fuera del árbol de
 * accesibilidad para que el enlace se lea una sola vez.
 */
const TextoRodante = ({ children }) => (
  <span className="texto-rodante">
    <span className="texto-rodante-capa">{children}</span>
    <span className="texto-rodante-capa" aria-hidden="true">
      {children}
    </span>
  </span>
);

/* Enlace con estado activo */
const EnlaceNav = ({ to, label, onClick, activoExacto = false }) => (
  <li>
    <NavLink
      to={to}
      end={activoExacto || to === "/"}
      className={({ isActive }) => `nav-enlace ${isActive ? "activo" : ""}`}
      onClick={onClick}
    >
      <TextoRodante>{label}</TextoRodante>
    </NavLink>
  </li>
);

/* Desplegable propio (sin depender de Bootstrap) */
const MenuDesplegable = ({ etiqueta, children, id }) => {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;

    const alHacerClicFuera = (evento) => {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(evento.target)
      ) {
        setAbierto(false);
      }
    };

    const alPresionarTecla = (evento) => {
      if (evento.key === "Escape") {
        setAbierto(false);
      }
    };

    document.addEventListener("mousedown", alHacerClicFuera);
    document.addEventListener("keydown", alPresionarTecla);

    return () => {
      document.removeEventListener("mousedown", alHacerClicFuera);
      document.removeEventListener("keydown", alPresionarTecla);
    };
  }, [abierto]);

  return (
    <div className="dropdown-usuario" ref={contenedorRef}>
      <button
        type="button"
        className="nav-enlace"
        aria-expanded={abierto}
        aria-haspopup="true"
        aria-controls={id}
        onClick={() => setAbierto((previo) => !previo)}
      >
        <TextoRodante>{etiqueta}</TextoRodante>
        <FontAwesomeIcon
          icon={faChevronDown}
          aria-hidden="true"
          className={`nav-desplegable-flecha${abierto ? " abierta" : ""}`}
        />
      </button>

      {/*
       * El panel se queda montado para poder animar la salida.
       * Cerrado: .menu-desplegable lo oculta con opacity/scale y
       * retrasa `visibility`, así que no recibe foco ni clics.
       */}
      <ul
        className="dropdown-usuario-panel menu-desplegable"
        id={id}
        data-abierto={abierto ? "true" : "false"}
      >
        {children(() => setAbierto(false))}
      </ul>
    </div>
  );
};

const BarraNavegacion = ({
  allProducts,
  setAllProducts,
  total,
  setTotal,
  countProducts,
  setCountProducts,
}) => {
  const { currentUser, logout } = useContext(AuthContext);
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [transparente, setTransparente] = useState(false);
  const cabeceraRef = useRef(null);

  // Cerramos el menú móvil al cambiar de ruta.
  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname, location.search]);

  /*
   * Cabecera transparente sobre el hero (como Sabina): mientras el
   * hero siga debajo de la barra, se pinta sin fondo y en blanco.
   * Al pasar el hero, o en cualquier otra ruta, vuelve a su estado
   * sólido. Se mide en un rAF por scroll para no leer el DOM más de
   * una vez por frame.
   */
  useLayoutEffect(() => {
    let frame = 0;

    const medir = () => {
      frame = 0;
      const cabecera = cabeceraRef.current;
      const hero = document.querySelector("#contenido .hero");

      if (!cabecera || !hero) {
        setTransparente(false);
        return;
      }

      const limite = cabecera.offsetHeight;
      setTransparente(hero.getBoundingClientRect().bottom > limite + 1);
    };

    const programar = () => {
      if (!frame) frame = requestAnimationFrame(medir);
    };

    medir();
    window.addEventListener("scroll", programar, { passive: true });
    window.addEventListener("resize", programar);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", programar);
      window.removeEventListener("resize", programar);
    };
  }, [location.pathname]);

  // Escape cierra el menú móvil.
  useEffect(() => {
    if (!menuAbierto) return undefined;

    const alPresionarTecla = (evento) => {
      if (evento.key === "Escape") setMenuAbierto(false);
    };

    document.addEventListener("keydown", alPresionarTecla);
    return () => document.removeEventListener("keydown", alPresionarTecla);
  }, [menuAbierto]);

  const nombreUsuario = currentUser
    ? currentUser.username || currentUser.name || currentUser.email
    : null;

  const cerrarSesion = () => {
    logout();
    setMenuAbierto(false);
  };

  return (
    <header
      className={`cabecera${transparente ? " cabecera--transparente" : ""}`}
      ref={cabeceraRef}
    >
      <div className="cabecera-inner">
        <nav className="nav-principal" aria-label="Navegación principal">
          <ul className="nav-lista">
            {enlacesPrincipales.map((enlace) => (
              <EnlaceNav key={enlace.to} {...enlace} />
            ))}
          </ul>
        </nav>

        <Link to="/" className="marca" aria-label="ByGio, ir al inicio">
          <img src={logonegro} alt="ByGio" className="marca-logo" />
        </Link>

        <div className="nav-acciones">
          <MenuDesplegable
            id="menu-cuenta"
            etiqueta={nombreUsuario ? "Mi cuenta" : "Cuenta"}
          >
            {(cerrar) =>
              currentUser ? (
                <>
                  <li>
                    <span className="dropdown-usuario-nombre">
                      {nombreUsuario}
                    </span>
                  </li>
                  {currentUser.admin && (
                    <>
                      <li>
                        <Link
                          to="/editor"
                          className="nav-enlace"
                          onClick={cerrar}
                        >
                          Crear artículo
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/dtf/upload"
                          className="nav-enlace"
                          onClick={cerrar}
                        >
                          Crear diseño DTF
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/admin/pedidos"
                          className="nav-enlace"
                          onClick={cerrar}
                        >
                          Pedidos
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/admin/precios"
                          className="nav-enlace"
                          onClick={cerrar}
                        >
                          Precios
                        </Link>
                      </li>
                    </>
                  )}
                  <li>
                    <Link
                      to="/mis-pedidos"
                      className="nav-enlace"
                      onClick={cerrar}
                    >
                      Mis pedidos
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="nav-enlace"
                      onClick={() => {
                        cerrarSesion();
                        cerrar();
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faRightFromBracket}
                        aria-hidden="true"
                      />
                      Cerrar sesión
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login" className="nav-enlace" onClick={cerrar}>
                      Iniciar sesión
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/register"
                      className="nav-enlace"
                      onClick={cerrar}
                    >
                      Crear cuenta
                    </Link>
                  </li>
                </>
              )
            }
          </MenuDesplegable>

          <SelectorTema />

          <Carrito
            allProducts={allProducts}
            setAllProducts={setAllProducts}
            total={total}
            setTotal={setTotal}
            countProducts={countProducts}
            setCountProducts={setCountProducts}
          />

          <button
            type="button"
            className="btn-menu"
            onClick={() => setMenuAbierto((previo) => !previo)}
            aria-expanded={menuAbierto}
            aria-controls="menu-movil"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          >
            <span
              className="icono-intercambio"
              data-estado={menuAbierto ? "b" : "a"}
              aria-hidden="true"
            >
              <FontAwesomeIcon icon={faBars} data-icono="a" />
              <FontAwesomeIcon icon={faXmark} data-icono="b" />
            </span>
          </button>
        </div>
      </div>

      {/* El panel móvil también se queda montado para animar el cierre. */}
      <div
        className="menu-movil panel-deslizante"
        id="menu-movil"
        data-abierto={menuAbierto ? "true" : "false"}
      >
        <nav aria-label="Navegación móvil">
          <ul className="menu-movil-lista">
            {enlacesPrincipales.map((enlace) => (
              <EnlaceNav
                key={enlace.to}
                {...enlace}
                onClick={() => setMenuAbierto(false)}
              />
            ))}

            <li className="menu-movil-separador" aria-hidden="true" />

            {currentUser ? (
              <>
                <li>
                  <span className="dropdown-usuario-nombre">
                    {nombreUsuario}
                  </span>
                </li>
                {currentUser.admin && (
                  <>
                    <li>
                      <Link
                        to="/editor"
                        className="nav-enlace"
                        onClick={() => setMenuAbierto(false)}
                      >
                        Crear artículo
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/dtf/upload"
                        className="nav-enlace"
                        onClick={() => setMenuAbierto(false)}
                      >
                        Crear diseño DTF
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/admin/pedidos"
                        className="nav-enlace"
                        onClick={() => setMenuAbierto(false)}
                      >
                        Pedidos
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/admin/precios"
                        className="nav-enlace"
                        onClick={() => setMenuAbierto(false)}
                      >
                        Precios
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  <Link
                    to="/mis-pedidos"
                    className="nav-enlace"
                    onClick={() => setMenuAbierto(false)}
                  >
                    Mis pedidos
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    className="nav-enlace"
                    onClick={cerrarSesion}
                  >
                    <FontAwesomeIcon
                      icon={faRightFromBracket}
                      aria-hidden="true"
                    />
                    Cerrar sesión
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    to="/login"
                    className="nav-enlace"
                    onClick={() => setMenuAbierto(false)}
                  >
                    Iniciar sesión
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="nav-enlace"
                    onClick={() => setMenuAbierto(false)}
                  >
                    Crear cuenta
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default BarraNavegacion;
