import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../../config";
import { formatPrice } from "../../../Componentes/cartUtils";
import useEnVista from "../../../hooks/useEnVista";
import "../dashboard.css";

const ResumenAdmin = () => {
  const [stats, setStats] = useState(null);
  const [usuarios, setUsuarios] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refContenido, enVista] = useEnVista();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/orders/stats`, { withCredentials: true }),
        axios.get(`${API_URL}/api/admin/users`, {
          params: { limit: 1, offset: 0 },
          withCredentials: true,
        }),
      ]);
      setStats(statsRes.data);
      setUsuarios(Number(usersRes.data?.total) || 0);
    } catch (err) {
      setError("No pudimos cargar el resumen. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    load();
  }, [load]);

  if (loading) {
    return (
      <section className="panel-seccion-cabecera">
        <div className="checkout-loading">
          <span className="cargador" aria-hidden="true" />
          <p className="parrafos">Cargando resumen...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel-seccion-cabecera">
        <div className="estado">
          <h2 className="estado-titulo">No pudimos cargar el resumen</h2>
          <p className="estado-texto">{error}</p>
          <button
            type="button"
            className="btn-tema btn-tema--contorno"
            onClick={load}
          >
            Reintentar
          </button>
        </div>
      </section>
    );
  }

  const pendingPayment = stats?.byStatus?.pendiente_pago?.count || 0;
  const toShip =
    (stats?.byStatus?.pagado?.count || 0) +
    (stats?.byStatus?.en_preparacion?.count || 0);
  const approvedRevenue = stats?.approvedRevenue || 0;

  return (
    <section
      ref={refContenido}
      className={`panel-seccion-cabecera revelar${enVista ? " is-visible" : ""}`}
    >
      <header className="panel-titulo revelar-linea" style={{ "--i": 0 }}>
        <span className="etiqueta-seccion">Panel de administración</span>
        <h1 className="panel-titulo-texto">Resumen</h1>
        <p className="texto-seccion">
          Indicadores del negocio de un vistazo.
        </p>
      </header>

      <div className="admin-stats">
        <div className="admin-stat revelar-linea" style={{ "--i": 1 }}>
          <span>Pedidos totales</span>
          <strong>{stats?.totalOrders ?? 0}</strong>
          <small>{stats?.ordersToday ?? 0} hoy</small>
        </div>
        <div className="admin-stat revelar-linea" style={{ "--i": 2 }}>
          <span>Pendientes de pago</span>
          <strong>{pendingPayment}</strong>
          <small>Requieren confirmación</small>
        </div>
        <div className="admin-stat revelar-linea" style={{ "--i": 3 }}>
          <span>Por despachar</span>
          <strong>{toShip}</strong>
          <small>Pagados o en preparación</small>
        </div>
        <div className="admin-stat revelar-linea" style={{ "--i": 4 }}>
          <span>Ventas aprobadas</span>
          <strong>{formatPrice(approvedRevenue)}</strong>
          <small>Pagos confirmados</small>
        </div>
        <div className="admin-stat revelar-linea" style={{ "--i": 5 }}>
          <span>Usuarios registrados</span>
          <strong>{usuarios}</strong>
          <small>Cuentas en la tienda</small>
        </div>
      </div>

      <div className="admin-accesos-rapidos">
        <Link to="/dashboard/admin/pedidos" className="btn-tema btn-tema--contorno">
          Gestionar pedidos
        </Link>
        <Link to="/dashboard/admin/ventas" className="btn-tema btn-tema--contorno">
          Contabilidad
        </Link>
        <Link to="/dashboard/admin/usuarios" className="btn-tema btn-tema--contorno">
          Usuarios
        </Link>
        <Link to="/dashboard/admin/precios" className="btn-tema btn-tema--contorno">
          Precios
        </Link>
      </div>
    </section>
  );
};

export default ResumenAdmin;
