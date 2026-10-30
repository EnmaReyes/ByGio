import { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AuthContext } from "../../context/authContext";
import useEnVista from "../../hooks/useEnVista";
import { itemsDeNav } from "./navDashboard";

/*
 * Portada del panel. Saluda al usuario y ofrece accesos directos a cada
 * sección según su rol. Las secciones todavía no implementadas también
 * aparecen aquí; al abrirlas muestran su estado "en preparación".
 */
const DashboardInicio = () => {
  const { currentUser } = useContext(AuthContext);
  const [refContenido, contenidoEnVista] = useEnVista();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const esAdmin = Boolean(currentUser?.admin);
  const items = itemsDeNav(esAdmin);
  const nombre =
    currentUser?.name || currentUser?.username || currentUser?.email || "";

  return (
    <section
      ref={refContenido}
      className={`panel-seccion-cabecera revelar${
        contenidoEnVista ? " is-visible" : ""
      }`}
    >
      <header className="panel-titulo revelar-linea" style={{ "--i": 0 }}>
        <span className="etiqueta-seccion">
          {esAdmin ? "Panel de administración" : "Tu cuenta"}
        </span>
        <h1 className="panel-titulo-texto">Hola, {nombre}</h1>
        <p className="texto-seccion">
          {esAdmin
            ? "Gestiona la tienda, revisa tus indicadores y administra pedidos desde un solo lugar."
            : "Consulta tus pedidos, edita tu perfil y mantén el control de tu cuenta."}
        </p>
      </header>

      <div className="panel-accesos">
        {items.map((item, index) => (
          <div
            key={item.to}
            className="revelar-linea"
            style={{ "--i": index + 1 }}
          >
            <Link to={item.to} className="panel-acceso">
              <span className="panel-acceso-icono" aria-hidden="true">
                <FontAwesomeIcon icon={item.icon} />
              </span>
              <strong>{item.label}</strong>
              <span>{item.descripcion}</span>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DashboardInicio;
