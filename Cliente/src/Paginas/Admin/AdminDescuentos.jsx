import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Form } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { API_URL } from "../../config";
import { AuthContext } from "../../context/authContext";
import { formatPrice } from "../../Componentes/cartUtils";
import { getApiErrorMessage } from "../../Componentes/orderUtils";
import useEnVista from "../../hooks/useEnVista";
import "../pedidos.css";
import "./admin.css";

/*
 * Descuentos individuales por articulo.
 *
 * El porcentaje vive en `articulos.descuentoPorcentaje` y se aplica sobre el
 * precio ya resuelto por la tarifa global (o un precio propio). El calculo
 * lo hace siempre el backend; aqui solo se asigne/edita/elimina el %.
 * Los combos quedan excluidos por decision de negocio.
 */

const precioOriginal = (articulo) =>
  Number(articulo?.precioOriginal ?? articulo?.precioAnterior ?? articulo?.precio) ||
  0;

const precioFinal = (articulo) => Number(articulo?.precio) || 0;

const AdminDescuentos = () => {
  const { currentUser } = useContext(AuthContext);
  const isAdmin = Boolean(currentUser?.admin);

  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [borradores, setBorradores] = useState({});
  const [guardandoId, setGuardandoId] = useState(null);

  /*
   * El observer se engancha al contenedor exterior porque siempre está
   * montado (también durante la carga). Ver `AdminPrice.jsx`.
   */
  const [refContenido, contenidoEnVista] = useEnVista();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_URL}/api/posts`, {
        withCredentials: true,
      });
      setArticulos(Array.isArray(res.data) ? res.data : []);
      setBorradores({});
    } catch (err) {
      setError(getApiErrorMessage(err, "No pudimos cargar los artículos."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    window.scrollTo(0, 0);
    load();
  }, [isAdmin, load]);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return articulos.filter((articulo) => {
      const conDescuento = Number(articulo?.descuentoPorcentaje) > 0;
      if (filtro === "con-descuento" && !conDescuento) return false;
      if (texto && !String(articulo?.title || "").toLowerCase().includes(texto)) {
        return false;
      }
      return true;
    });
  }, [articulos, filtro, busqueda]);

  const totalConDescuento = useMemo(
    () => articulos.filter((a) => Number(a?.descuentoPorcentaje) > 0).length,
    [articulos],
  );

  const valorBorrador = (articulo) =>
    borradores[articulo.id] ??
    (Number(articulo?.descuentoPorcentaje) > 0
      ? String(articulo.descuentoPorcentaje)
      : "");

  const guardar = async (articulo) => {
    const texto = String(borradores[articulo.id] ?? "").trim();
    const pct = texto === "" ? null : Number(texto);

    if (pct !== null && (!Number.isInteger(pct) || pct < 0 || pct > 100)) {
      toast.error("El descuento debe ser un porcentaje entre 0 y 100.");
      return;
    }

    setGuardandoId(articulo.id);
    try {
      await axios.put(
        `${API_URL}/api/posts/${articulo.id}`,
        { descuentoPorcentaje: pct },
        { withCredentials: true },
      );
      toast.success(
        pct
          ? `Descuento del ${pct}% guardado`
          : "Descuento eliminado",
      );
      await load();
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "No se pudo guardar el descuento"),
      );
    } finally {
      setGuardandoId(null);
    }
  };

  if (!isAdmin) {
    return (
      <>
        <header className="catalogo-hero">
          <div className="contenedor">
            <h1 className="catalogo-hero-titulo">Acceso restringido</h1>
            <p className="catalogo-hero-texto">
              Esta sección es solo para administradores de ByGio.
            </p>
          </div>
        </header>
        <div className="checkout-page">
          <div className="checkout-gate-actions checkout-gate-actions--centrada">
            <Link to="/" className="checkout-primary-link">
              Volver al inicio
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="catalogo-hero">
        <div className="contenedor">
          <h1 className="catalogo-hero-titulo">Descuentos por artículo</h1>
          <p className="catalogo-hero-texto">
            Asigna un porcentaje de descuento a cada artículo, sin tocar la
            tarifa global. Los combos no llevan descuento individual. Los
            pedidos ya creados conservan el precio con el que se vendieron.
          </p>
        </div>
      </header>

      <div
        ref={refContenido}
        className={`checkout-page admin-page revelar${
          contenidoEnVista ? " is-visible" : ""
        }`}
      >
        {loading ? (
          <div className="checkout-loading">
            <span className="cargador" aria-hidden="true" />
            <p className="parrafos">Cargando artículos…</p>
          </div>
        ) : error ? (
          <div className="estado">
            <h2 className="estado-titulo">No pudimos cargar los artículos</h2>
            <p className="estado-texto">{error}</p>
            <button
              type="button"
              className="btn-tema btn-tema--contorno"
              onClick={load}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            <section className="checkout-card revelar-linea" style={{ "--i": 0 }}>
              <div className="admin-filters-actions">
                <div
                  className="filtros-grupo"
                  role="group"
                  aria-label="Filtrar artículos por descuento"
                >
                  <span className="filtros-etiqueta">Filtro</span>
                  {[
                    { id: "todos", etiqueta: "Todos" },
                    { id: "con-descuento", etiqueta: "Con descuento" },
                  ].map((opcion) => (
                    <button
                      key={opcion.id}
                      type="button"
                      className={`filtro-chip ${
                        filtro === opcion.id ? "activo" : ""
                      }`}
                      aria-pressed={filtro === opcion.id}
                      onClick={() => setFiltro(opcion.id)}
                    >
                      {opcion.etiqueta}
                    </button>
                  ))}
                </div>

                <Form.Group controlId="admin-descuentos-busqueda" className="mb-0">
                  <Form.Label className="parrafos visually-hidden">
                    Buscar por título
                  </Form.Label>
                  <Form.Control
                    type="search"
                    placeholder="Buscar por título…"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </Form.Group>

                <span className="parrafos admin-muted" aria-live="polite">
                  {totalConDescuento}{" "}
                  {totalConDescuento === 1 ? "artículo con" : "artículos con"}{" "}
                  descuento
                </span>
              </div>

              <p className="parrafos admin-muted mt-3 mb-0">
                El precio base sale de{" "}
                <Link to="/admin/precios" className="enlace-seccion">
                  Precios globales
                </Link>
                . Deja el campo vacío o en 0 para quitar el descuento. Un 100%
                deja el pedido en $0 y se confirma manualmente.
              </p>
            </section>

            {visibles.length === 0 ? (
              <div className="estado revelar-linea" style={{ "--i": 1 }}>
                <h2 className="estado-titulo">
                  {articulos.length === 0
                    ? "Todavía no hay artículos"
                    : "Sin resultados para este filtro"}
                </h2>
                <p className="estado-texto">
                  {articulos.length === 0
                    ? "Crea un artículo desde el editor para poder asignarle un descuento."
                    : "Prueba con otra búsqueda o revisa el filtro."}
                </p>
              </div>
            ) : (
              <div
                className="admin-table-wrap revelar-linea"
                style={{ "--i": 1 }}
              >
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="parrafos">Artículo</th>
                      <th className="parrafos">Precio original</th>
                      <th className="parrafos">Precio final</th>
                      <th className="parrafos">Descuento (%)</th>
                      <th aria-label="Acciones" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibles.map((articulo) => {
                      const esCombo = articulo?.combo === true;
                      const pctActual = Number(articulo?.descuentoPorcentaje) || 0;
                      const borrador = valorBorrador(articulo);
                      const guardando = guardandoId === articulo.id;

                      return (
                        <tr key={articulo.id}>
                          <td className="parrafos">
                            <strong>{articulo.title}</strong>
                            <span className="admin-muted">
                              {articulo.oversize ? "Oversize" : "Básico"}
                              {esCombo ? " · Combo" : ""}
                            </span>
                          </td>
                          <td className="parrafos admin-nowrap">
                            {formatPrice(precioOriginal(articulo))}
                          </td>
                          <td className="parrafos admin-nowrap">
                            <strong>{formatPrice(precioFinal(articulo))}</strong>
                          </td>
                          <td>
                            <Form.Control
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              inputMode="numeric"
                              placeholder="0"
                              aria-label={`Descuento de ${articulo.title} en porcentaje`}
                              value={borrador}
                              disabled={esCombo || guardando}
                              onChange={(e) =>
                                setBorradores((prev) => ({
                                  ...prev,
                                  [articulo.id]: e.target.value,
                                }))
                              }
                              style={{ maxWidth: "110px" }}
                            />
                          </td>
                          <td>
                            {esCombo ? (
                              <span className="parrafos admin-muted">
                                Combo (sin descuento)
                              </span>
                            ) : (
                              <div className="admin-filters-actions">
                                <button
                                  type="button"
                                  className="btn-tema btn-tema--primario btn-tema--pequeno"
                                  disabled={guardando}
                                  onClick={() => guardar(articulo)}
                                >
                                  {guardando ? "Guardando…" : "Guardar"}
                                </button>
                                {pctActual > 0 && (
                                  <button
                                    type="button"
                                    className="btn-tema btn-tema--contorno btn-tema--pequeno"
                                    disabled={guardando}
                                    onClick={() => {
                                      setBorradores((prev) => ({
                                        ...prev,
                                        [articulo.id]: "",
                                      }));
                                      setGuardandoId(articulo.id);
                                      axios
                                        .put(
                                          `${API_URL}/api/posts/${articulo.id}`,
                                          { descuentoPorcentaje: null },
                                          { withCredentials: true },
                                        )
                                        .then(async () => {
                                          toast.success("Descuento eliminado");
                                          await load();
                                        })
                                        .catch((err) => {
                                          toast.error(
                                            getApiErrorMessage(
                                              err,
                                              "No se pudo eliminar el descuento",
                                            ),
                                          );
                                        })
                                        .finally(() => setGuardandoId(null));
                                    }}
                                  >
                                    Quitar
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default AdminDescuentos;
