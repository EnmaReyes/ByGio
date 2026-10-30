import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faBoxOpen,
  faCheckDouble,
  faTrash,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import useNotificaciones from "../../hooks/useNotificaciones";
import {
  limpiarNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
} from "../../Componentes/notificaciones";
import { formatDateTime } from "../../Componentes/orderUtils";
import "./dashboard.css";

const ICONO_POR_TIPO = {
  pedido: faBoxOpen,
  cuenta: faUser,
};

const Notificaciones = () => {
  const navigate = useNavigate();
  const { items, noLeidas } = useNotificaciones();
  const [filtro, setFiltro] = useState("todas");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const visibles = useMemo(
    () =>
      filtro === "no-leidas"
        ? items.filter((notificacion) => !notificacion.leida)
        : items,
    [items, filtro],
  );

  const abrir = async (notificacion) => {
    if (!notificacion.leida) await marcarLeida(notificacion.id);
    if (notificacion.to) navigate(notificacion.to);
  };

  return (
    <section className="panel-seccion-cabecera">
      <header className="panel-titulo">
        <span className="etiqueta-seccion">Tu cuenta</span>
        <h1 className="panel-titulo-texto">Notificaciones</h1>
        <p className="texto-seccion">
          Novedades sobre tus pedidos y la actividad de tu cuenta.
          {noLeidas > 0 ? ` Tienes ${noLeidas} sin leer.` : ""}
        </p>
      </header>

      <div className="catalogo-filtros notif-filtros">
        <div className="filtros-grupo" role="group" aria-label="Filtrar notificaciones">
          <button
            type="button"
            className={`filtro-chip ${filtro === "todas" ? "activo" : ""}`}
            aria-pressed={filtro === "todas"}
            onClick={() => setFiltro("todas")}
          >
            Todas
          </button>
          <button
            type="button"
            className={`filtro-chip ${
              filtro === "no-leidas" ? "activo" : ""
            }`}
            aria-pressed={filtro === "no-leidas"}
            onClick={() => setFiltro("no-leidas")}
          >
            No leídas {noLeidas > 0 ? `(${noLeidas})` : ""}
          </button>
        </div>

        {items.length > 0 && (
          <div className="notif-acciones">
            <button
              type="button"
              className="btn-tema btn-tema--contorno btn-tema--pequeno"
              onClick={marcarTodasLeidas}
              disabled={noLeidas === 0}
            >
              <FontAwesomeIcon icon={faCheckDouble} aria-hidden="true" />
              Marcar todas como leídas
            </button>
            <button
              type="button"
              className="btn-tema btn-tema--contorno btn-tema--pequeno"
              onClick={limpiarNotificaciones}
            >
              <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
              Limpiar
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="estado">
          <span className="panel-proximamente-icono" aria-hidden="true">
            <FontAwesomeIcon icon={faBell} />
          </span>
          <h2 className="estado-titulo">No tienes notificaciones</h2>
          <p className="estado-texto">
            Aquí aparecerán las novedades de tus pedidos y de tu cuenta.
          </p>
        </div>
      ) : visibles.length === 0 ? (
        <div className="estado">
          <h2 className="estado-titulo">Todo al día</h2>
          <p className="estado-texto">
            No tienes notificaciones sin leer.
          </p>
        </div>
      ) : (
        <ul className="notif-lista">
          {visibles.map((notificacion) => (
            <li key={notificacion.id}>
              <button
                type="button"
                className={`notif-item ${
                  notificacion.leida ? "" : "no-leida"
                }`}
                onClick={() => abrir(notificacion)}
              >
                <span className="notif-icono" aria-hidden="true">
                  <FontAwesomeIcon
                    icon={ICONO_POR_TIPO[notificacion.tipo] || faBell}
                  />
                </span>
                <span className="notif-cuerpo">
                  <strong>{notificacion.titulo}</strong>
                  {notificacion.texto && (
                    <span className="notif-texto">{notificacion.texto}</span>
                  )}
                  <span className="notif-fecha">
                    {formatDateTime(notificacion.fecha)}
                  </span>
                </span>
                {!notificacion.leida && (
                  <span className="notif-punto" aria-label="No leída" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default Notificaciones;
