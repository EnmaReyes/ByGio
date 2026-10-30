import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAnglesLeft,
  faAnglesRight,
  faArrowUpRightFromSquare,
  faBars,
  faChevronDown,
  faRightFromBracket,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from "../../context/authContext";
import SelectorTema from "../../Componentes/SelectorTema";
import BannerCookies from "../../Componentes/BannerCookies";
import useNotificaciones from "../../hooks/useNotificaciones";
import logonegro from "../../assets/Logo/logo_negro.png";
import { bloquesDeNav, itemsDeNav } from "./navDashboard";
import "../pedidos.css";
import "./dashboard.css";

/* Guarda de sesión para las secciones exclusivas de administrador. */
export const RutaAdmin = ({ children }) => {
  const { currentUser } = useContext(AuthContext);

  if (!currentUser?.admin) {
    return (
      <section className="panel-seccion-cabecera">
        <div className="estado">
          <h2 className="estado-titulo">Acceso restringido</h2>
          <p className="estado-texto">
            Esta sección es solo para administradores de ByGio.
          </p>
          <Link to="/dashboard" className="btn-tema btn-tema--contorno">
            Volver al panel
          </Link>
        </div>
      </section>
    );
  }

  return children;
};

/* Menú de cuenta de la cabecera (avatar + desplegable). */
const MenuCuenta = ({ nombre, email, esAdmin, avatar, onCerrarSesion }) => {
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
      if (evento.key === "Escape") setAbierto(false);
    };

    document.addEventListener("mousedown", alHacerClicFuera);
    document.addEventListener("keydown", alPresionarTecla);

    return () => {
      document.removeEventListener("mousedown", alHacerClicFuera);
      document.removeEventListener("keydown", alPresionarTecla);
    };
  }, [abierto]);

  return (
    <div className="dropdown-usuario panel-cuenta" ref={contenedorRef}>
      <button
        type="button"
        className="panel-cuenta-btn"
        aria-expanded={abierto}
        aria-haspopup="true"
        onClick={() => setAbierto((previo) => !previo)}
      >
        <span className="panel-avatar" aria-hidden="true">
          {avatar ? <img src={avatar} alt="" /> : (nombre || "?").charAt(0)}
        </span>
        <span className="panel-cuenta-nombre">{nombre}</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          aria-hidden="true"
          className={`nav-desplegable-flecha${abierto ? " abierta" : ""}`}
        />
      </button>

      <ul
        className="dropdown-usuario-panel menu-desplegable panel-cuenta-panel"
        data-abierto={abierto ? "true" : "false"}
      >
        <li>
          <div className="panel-cuenta-head">
            <strong>{nombre}</strong>
            <small>{email}</small>
            <small>{esAdmin ? "Administrador" : "Cliente"}</small>
          </div>
        </li>
        <li>
          <Link
            to="/dashboard/perfil"
            className="nav-enlace"
            onClick={() => setAbierto(false)}
          >
            Mi perfil
          </Link>
        </li>
        <li>
          <button
            type="button"
            className="nav-enlace"
            onClick={() => {
              setAbierto(false);
              onCerrarSesion();
            }}
          >
            <FontAwesomeIcon icon={faRightFromBracket} aria-hidden="true" />
            Cerrar sesión
          </button>
        </li>
      </ul>
    </div>
  );
};

const DashboardLayout = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const { pathname } = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  /*
   * Modo compacto del panel (solo iconos). Se guarda en localStorage
   * para conservar la preferencia entre visitas. En móvil la barra
   * sigue comportándose como cajón: el modo compacto es de escritorio.
   */
  const [colapsado, setColapsado] = useState(() => {
    try {
      return localStorage.getItem("panel_sidebar_colapsada") === "true";
    } catch {
      return false;
    }
  });

  const alternarColapsado = () => {
    setColapsado((previa) => {
      const siguiente = !previa;
      try {
        localStorage.setItem(
          "panel_sidebar_colapsada",
          String(siguiente),
        );
      } catch {
        // Sin almacenamiento disponible: la preferencia dura la sesión.
      }
      return siguiente;
    });
  };

  const esAdmin = Boolean(currentUser?.admin);
  const bloques = useMemo(() => bloquesDeNav(esAdmin), [esAdmin]);
  const items = useMemo(() => itemsDeNav(esAdmin), [esAdmin]);
  const { noLeidas } = useNotificaciones();

  const nombreUsuario = currentUser
    ? currentUser.name ||
      currentUser.username ||
      currentUser.email ||
      "Mi cuenta"
    : "";

  // Al cambiar de sección se cierra el panel móvil.
  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  // Escape cierra el panel móvil.
  useEffect(() => {
    if (!menuAbierto) return undefined;

    const alPresionarTecla = (evento) => {
      if (evento.key === "Escape") setMenuAbierto(false);
    };

    document.addEventListener("keydown", alPresionarTecla);
    return () => document.removeEventListener("keydown", alPresionarTecla);
  }, [menuAbierto]);

  // Migas de pan: Panel → sección → detalle (cuando hay un segmento extra).
  const migas = useMemo(() => {
    const base = [{ label: "Panel", to: "/dashboard" }];

    const coincidencia = items
      .filter(
        (item) =>
          pathname === item.to || pathname.startsWith(`${item.to}/`),
      )
      .sort((a, b) => b.to.length - a.to.length)[0];

    if (coincidencia && coincidencia.to !== "/dashboard") {
      base.push({ label: coincidencia.label, to: coincidencia.to });
      if (pathname.length > coincidencia.to.length) {
        base.push({ label: "Detalle" });
      }
    }

    return base;
  }, [pathname, items]);

  const cerrarSesion = () => {
    setMenuAbierto(false);
    logout();
  };

  if (!currentUser) {
    return (
      <div className="panel-gate">
        <BannerCookies />
        <div className="panel-gate-caja">
          <Link to="/" className="panel-marca" aria-label="ByGio, ir al inicio">
            <img src={logonegro} alt="ByGio" className="panel-logo" />
          </Link>
          <h1 className="panel-titulo-texto">Inicia sesión para continuar</h1>
          <p className="texto-seccion">
            El panel reúne tus pedidos, tu perfil y la administración de la
            tienda en un solo lugar.
          </p>
          <div className="panel-gate-acciones">
            <Link
              to={`/login?redirect=${encodeURIComponent("/dashboard")}`}
              className="checkout-primary-link"
            >
              Iniciar sesión
            </Link>
            <Link
              to={`/register?redirect=${encodeURIComponent("/dashboard")}`}
              className="checkout-secondary-link"
            >
              Crear cuenta
            </Link>
          </div>
          <Link to="/" className="enlace-seccion">
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="panel" data-colapsado={colapsado ? "true" : "false"}>
      <BannerCookies />

      {/* Barra lateral (drawer en móvil, compacta en escritorio) */}
      <aside
        id="panel-barra-principal"
        className="panel-barra"
        data-abierto={menuAbierto ? "true" : "false"}
        aria-label="Navegación del panel"
      >
        <div className="panel-barra-cabecera">
          <Link to="/" className="panel-marca" aria-label="ByGio, ir al inicio">
            <img src={logonegro} alt="ByGio" className="panel-logo" />
          </Link>

          <button
            type="button"
            className="panel-colapsar"
            onClick={alternarColapsado}
            aria-label={
              colapsado
                ? "Expandir menú lateral"
                : "Contraer menú lateral"
            }
            aria-expanded={!colapsado}
            aria-controls="panel-barra-principal"
            title={
              colapsado
                ? "Expandir menú lateral"
                : "Contraer menú lateral"
            }
          >
            <FontAwesomeIcon
              icon={colapsado ? faAnglesRight : faAnglesLeft}
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            className="panel-cerrar"
            onClick={() => setMenuAbierto(false)}
            aria-label="Cerrar menú"
          >
            <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
          </button>
        </div>

        <nav className="panel-nav">
          {bloques.map((bloque) => (
            <div className="panel-grupo" key={bloque.grupo}>
              <p className="panel-grupo-etiqueta">{bloque.grupo}</p>
              <ul className="panel-lista">
                {bloque.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      title={colapsado ? item.label : undefined}
                      className={({ isActive }) =>
                        `panel-enlace${isActive ? " activo" : ""}`
                      }
                    >
                      <FontAwesomeIcon icon={item.icon} aria-hidden="true" />
                      <span className="panel-enlace-texto">{item.label}</span>
                      {item.to === "/dashboard/notificaciones" &&
                        noLeidas > 0 && (
                          <span
                            className="panel-enlace-contador"
                            aria-label={`${noLeidas} notificaciones sin leer`}
                          >
                            {noLeidas > 99 ? "99+" : noLeidas}
                          </span>
                        )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="panel-barra-pie">
          <Link
            to="/"
            className="panel-ver-tienda"
            title={colapsado ? "Ver la tienda" : undefined}
          >
            <span className="panel-ver-tienda-texto">Ver la tienda</span>
            <FontAwesomeIcon
              icon={faArrowUpRightFromSquare}
              aria-hidden="true"
            />
          </Link>
        </div>
      </aside>

      <div
        className="panel-overlay"
        data-abierto={menuAbierto ? "true" : "false"}
        onClick={() => setMenuAbierto(false)}
        aria-hidden="true"
      />

      {/* Columna principal */}
      <div className="panel-principal">
        <header className="panel-cabecera">
          <div className="panel-cabecera-izq">
            <button
              type="button"
              className="panel-menu-btn"
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menú"
              aria-expanded={menuAbierto}
            >
              <FontAwesomeIcon icon={faBars} aria-hidden="true" />
            </button>

            <nav aria-label="Ruta de navegación">
              <ol className="panel-migas">
                {migas.map((miga, index) => (
                  <li key={`${miga.label}-${index}`}>
                    {miga.to ? (
                      <Link to={miga.to}>{miga.label}</Link>
                    ) : (
                      <span className="actual">{miga.label}</span>
                    )}
                    {index < migas.length - 1 && (
                      <span className="sep" aria-hidden="true">
                        {" / "}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          <div className="panel-cabecera-der">
            <SelectorTema />
            <MenuCuenta
              nombre={nombreUsuario}
              email={currentUser.email}
              esAdmin={esAdmin}
              avatar={currentUser.image}
              onCerrarSesion={cerrarSesion}
            />
          </div>
        </header>

        <main className="panel-contenido">
          {/* La clave por ruta reproduce la entrada de cada sección sin
              remontar la barra lateral ni la cabecera. */}
          <div className="panel-seccion" key={pathname}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
