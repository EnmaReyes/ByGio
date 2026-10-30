import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../../config";
import { formatPrice } from "../../../Componentes/cartUtils";
import { getApiErrorMessage } from "../../../Componentes/orderUtils";
import useEnVista from "../../../hooks/useEnVista";
import "../dashboard.css";

const PERIODOS = [
  { id: "dia", label: "Día" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mes" },
  { id: "anio", label: "Año" },
];

const Ventas = () => {
  const [periodo, setPeriodo] = useState("mes");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refContenido, enVista] = useEnVista();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_URL}/api/admin/orders/ventas`, {
        params: { periodo },
        withCredentials: true,
      });
      setData(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "No pudimos cargar las ventas."));
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    window.scrollTo(0, 0);
    load();
  }, [load]);

  const maxTotal = (data?.serie || []).reduce(
    (m, x) => Math.max(m, x.total || 0),
    0,
  );

  const variacion = (() => {
    if (!data?.anterior || !data?.actual) return null;
    const ant = data.anterior.total || 0;
    const act = data.actual.total || 0;
    if (ant === 0 && act === 0) return null;
    if (ant === 0) return null;
    return ((act - ant) / ant) * 100;
  })();

  return (
    <section
      ref={refContenido}
      className={`panel-seccion-cabecera revelar${enVista ? " is-visible" : ""}`}
    >
      <header className="panel-titulo revelar-linea" style={{ "--i": 0 }}>
        <span className="etiqueta-seccion">Panel de administración</span>
        <h1 className="panel-titulo-texto">Contabilidad de ventas</h1>
        <p className="texto-seccion">
          Solo cuentan los pedidos con pago aprobado y no cancelados.
        </p>
      </header>

      <div className="catalogo-filtros ventas-filtros revelar-linea" style={{ "--i": 1 }}>
        <div className="filtros-grupo" role="group" aria-label="Periodo">
          {PERIODOS.map((opcion) => {
            const activo = periodo === opcion.id;
            return (
              <button
                key={opcion.id}
                type="button"
                className={`filtro-chip ${activo ? "activo" : ""}`}
                aria-pressed={activo}
                onClick={() => setPeriodo(opcion.id)}
              >
                {opcion.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="estado">
          <h2 className="estado-titulo">No pudimos cargar las ventas</h2>
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

      {loading ? (
        <div className="checkout-loading">
          <span className="cargador" aria-hidden="true" />
          <p className="parrafos">Cargando ventas...</p>
        </div>
      ) : !error && data ? (
        <>
          <div className="admin-stats ventas-stats">
            <div className="admin-stat">
              <span>Total vendido</span>
              <strong>{formatPrice(data.total)}</strong>
              <small>{data.count} pedidos</small>
            </div>
            <div className="admin-stat">
              <span>Periodo actual</span>
              <strong>{formatPrice(data.actual?.total || 0)}</strong>
              <small>{data.actual?.count || 0} pedidos</small>
            </div>
            <div className="admin-stat">
              <span>Periodo anterior</span>
              <strong>{formatPrice(data.anterior?.total || 0)}</strong>
              <small>{data.anterior?.count || 0} pedidos</small>
            </div>
            <div className="admin-stat">
              <span>Variación</span>
              <strong>
                {variacion === null
                  ? "—"
                  : `${variacion >= 0 ? "+" : ""}${variacion.toFixed(1)}%`}
              </strong>
              <small>vs. periodo anterior</small>
            </div>
          </div>

          <section className="checkout-card">
            <h2 className="checkout-section-title titulos">
              Gráfica de ventas
            </h2>
            {data.serie && data.serie.length > 0 ? (
              <div className="ventas-grafica">
                {data.serie.map((item) => {
                  const altura =
                    maxTotal > 0
                      ? Math.max(4, (item.total / maxTotal) * 100)
                      : 4;
                  return (
                    <div className="ventas-barra" key={item.fecha}>
                      <div
                        className="ventas-barra-fill"
                        style={{ height: `${altura}%` }}
                        title={`${item.label}: ${formatPrice(item.total)}`}
                      />
                      <span className="ventas-barra-label">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="parrafos">No hay ventas en este periodo.</p>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
};

export default Ventas;
