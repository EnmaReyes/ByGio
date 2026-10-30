import { useCallback, useEffect, useMemo, useState } from "react";
import { Form } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../../config";
import { getApiErrorMessage } from "../../../Componentes/orderUtils";
import useEnVista from "../../../hooks/useEnVista";
import "../dashboard.css";

const Usuarios = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [campanaAbierta, setCampanaAbierta] = useState(false);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [gmailAutorizado, setGmailAutorizado] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [resultadoEnvio, setResultadoEnvio] = useState(null);
  const [refContenido, enVista] = useEnVista();

  // Debounce del buscador.
  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(q.trim()), 400);
    return () => clearTimeout(timer);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_URL}/api/admin/users`, {
        params: {
          limit: 50,
          offset: 0,
          ...(searchTerm && { q: searchTerm }),
        },
        withCredentials: true,
      });
      const data = res.data || {};
      setUsers(Array.isArray(data.users) ? data.users : []);
      setTotal(Number(data.total) || 0);
    } catch (err) {
      setError(getApiErrorMessage(err, "No pudimos cargar los usuarios."));
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    window.scrollTo(0, 0);
    load();
  }, [load]);

  const toggleSeleccion = (id) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const seleccionarTodos = () => {
    setSeleccionados(new Set(users.map((u) => u.id)));
  };

  const limpiarSeleccion = () => setSeleccionados(new Set());

  const destinatarios = useMemo(() => {
    const mapa = new Map(users.map((u) => [u.id, u]));
    return [...seleccionados]
      .map((id) => mapa.get(id))
      .filter(Boolean);
  }, [seleccionados, users]);

  const correosSeleccionados = destinatarios
    .map((u) => u.email)
    .filter(Boolean)
    .join(", ");

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("authorized") === "1") {
      // eslint-disable-next-line no-alert
      alert("Gmail autorizado correctamente. Ya puedes enviar campañas.");
    }
  }, [location.search]);

  const verificarGmail = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/campaigns/status`, {
        withCredentials: true,
      });
      setGmailAutorizado(Boolean(res.data?.authorized));
    } catch {
      setGmailAutorizado(false);
    }
  }, []);

  useEffect(() => {
    verificarGmail();
  }, [verificarGmail]);

  const enviarCampana = async () => {
    if (!asunto.trim() || !mensaje.trim() || seleccionados.size === 0) return;
    setEnviando(true);
    setResultadoEnvio(null);
    try {
      const res = await axios.post(
        `${API_URL}/api/admin/campaigns/send`,
        {
          subject: asunto.trim(),
          body: mensaje.trim(),
          recipientIds: [...seleccionados],
        },
        { withCredentials: true },
      );
      setResultadoEnvio(res.data);
    } catch (err) {
      setResultadoEnvio({
        error: getApiErrorMessage(err, "No se pudo enviar la campaña."),
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section
      ref={refContenido}
      className={`panel-seccion-cabecera revelar${enVista ? " is-visible" : ""}`}
    >
      <header className="panel-titulo revelar-linea" style={{ "--i": 0 }}>
        <span className="etiqueta-seccion">Panel de administración</span>
        <h1 className="panel-titulo-texto">Usuarios registrados</h1>
        <p className="texto-seccion">
          {total} {total === 1 ? "cuenta registrada" : "cuentas registradas"}.
        </p>
      </header>

      <Form
        onSubmit={(e) => e.preventDefault()}
        className="admin-filtros revelar-linea"
        style={{ "--i": 1 }}
      >
        <Form.Group controlId="usuariosSearch">
          <Form.Label className="parrafos">Buscar</Form.Label>
          <Form.Control
            placeholder="Nombre, correo o usuario"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </Form.Group>
      </Form>

      {error && (
        <div className="estado">
          <h2 className="estado-titulo">No pudimos cargar los usuarios</h2>
          <p className="estado-texto">{error}</p>
          <button
            type="button"
            className="btn-tema btn-tema--contorno"
            onClick={load}
          >
            Reintentar
          </button>
        </div>
      )}

      {!error &&
        (loading ? (
          <div className="checkout-loading">
            <span className="cargador" aria-hidden="true" />
            <p className="parrafos">Cargando usuarios...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="estado">
            <h2 className="estado-titulo">No hay usuarios</h2>
            <p className="estado-texto">
              Ajusta la búsqueda o prueba con otro término.
            </p>
          </div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="parrafos" aria-label="Seleccionar" />
                    <th className="parrafos">Usuario</th>
                    <th className="parrafos">Correo</th>
                    <th className="parrafos">Rol</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={seleccionados.has(user.id)}
                          onChange={() => toggleSeleccion(user.id)}
                          aria-label={`Seleccionar ${user.email}`}
                        />
                      </td>
                      <td className="parrafos">
                        <strong>{user.name || user.username || "Sin nombre"}</strong>
                        {user.lastName ? ` ${user.lastName}` : ""}
                        <small className="parrafos admin-muted">
                          {user.username || "Sin usuario"}
                        </small>
                      </td>
                      <td className="parrafos admin-nowrap">{user.email}</td>
                      <td>
                        <span
                          className={`order-badge ${
                            user.admin ? "paid" : "pending"
                          }`}
                        >
                          {user.admin ? "Admin" : "Cliente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-campana-barra">
              <span className="parrafos admin-muted">
                {seleccionados.size}{" "}
                {seleccionados.size === 1 ? "seleccionado" : "seleccionados"}
              </span>
              <button
                type="button"
                className="btn-tema btn-tema--contorno btn-tema--pequeno"
                onClick={seleccionarTodos}
              >
                Seleccionar todos
              </button>
              <button
                type="button"
                className="btn-tema btn-tema--contorno btn-tema--pequeno"
                onClick={limpiarSeleccion}
                disabled={seleccionados.size === 0}
              >
                Limpiar
              </button>
              <button
                type="button"
                className="btn-tema btn-tema--primario btn-tema--pequeno"
                onClick={() => setCampanaAbierta((v) => !v)}
                disabled={seleccionados.size === 0}
              >
                Preparar campaña
              </button>
            </div>

            {campanaAbierta && (
              <section className="checkout-card admin-campana">
                <h2 className="checkout-section-title titulos">
                  Preparar campaña por correo
                </h2>
                <p className="checkout-help parrafos">
                  Esta interfaz prepara la campaña y los destinatarios. El envío
                  real requiere autorización y la conexión de un servicio de
                  correo (Gmail/API). No se envía nada automáticamente.
                </p>

                <Form.Group controlId="campanaAsunto" className="mb-3">
                  <Form.Label className="parrafos">Asunto</Form.Label>
                  <Form.Control
                    value={asunto}
                    onChange={(e) => setAsunto(e.target.value)}
                    placeholder="Asunto del correo"
                  />
                </Form.Group>

                <Form.Group controlId="campanaMensaje" className="mb-3">
                  <Form.Label className="parrafos">Mensaje</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Escribe el mensaje de la campaña..."
                  />
                </Form.Group>

                <Form.Group controlId="campanaDestinatarios" className="mb-3">
                  <Form.Label className="parrafos">Destinatarios</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    readOnly
                    value={correosSeleccionados}
                  />
                  <Form.Text className="parrafos">
                    {destinatarios.length} destinatario(s). Copia estos correos a
                    tu cliente de correo para enviar la campaña.
                  </Form.Text>
                </Form.Group>

                <div className="admin-campana-acciones">
                  {gmailAutorizado === false && (
                    <button
                      type="button"
                      className="btn-tema btn-tema--primario btn-tema--pequeno"
                      onClick={() => {
                        window.location.href = `${API_URL}/api/admin/campaigns/oauth/start`;
                      }}
                    >
                      Autorizar con Gmail
                    </button>
                  )}
                  {gmailAutorizado === true && (
                    <button
                      type="button"
                      className="btn-tema btn-tema--primario btn-tema--pequeno"
                      onClick={enviarCampana}
                      disabled={enviando || seleccionados.size === 0}
                    >
                      {enviando ? "Enviando..." : "Enviar campaña"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-tema btn-tema--contorno btn-tema--pequeno"
                    onClick={() => {
                      if (correosSeleccionados) {
                        navigator.clipboard
                          ?.writeText(correosSeleccionados)
                          .then(() => {
                            // eslint-disable-next-line no-alert
                            alert("Correos copiados al portapapeles");
                          })
                          .catch(() => {});
                      }
                    }}
                    disabled={destinatarios.length === 0}
                  >
                    Copiar correos
                  </button>
                  <button
                    type="button"
                    className="btn-tema btn-tema--contorno btn-tema--pequeno"
                    onClick={() => setCampanaAbierta(false)}
                  >
                    Cerrar
                  </button>
                </div>

                {resultadoEnvio && (
                  <p className="parrafos admin-muted">
                    {resultadoEnvio.error
                      ? resultadoEnvio.error
                      : `Enviados: ${resultadoEnvio.sent ?? 0} de ${resultadoEnvio.total ?? 0}`}
                  </p>
                )}
              </section>
            )}
          </>
        ))}
    </section>
  );
};

export default Usuarios;
