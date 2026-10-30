import { useCallback, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../../context/authContext";
import EditBanner from "../../../Componentes/EditBanner";
import { API_URL } from "../../../config";
import "../dashboard.css";

const Banners = () => {
  const location = useLocation().search;
  const { currentUser } = useContext(AuthContext);
  const [banner, setBanner] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorVisible, setEditorVisible] = useState(true);

  const fetchBanner = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/banner/${location}`, {
        withCredentials: true,
      });
      const data = res.data;
      const formatted = Array.isArray(data)
        ? data.map((art) => ({
            ...art,
            img:
              typeof art.img === "string" ? JSON.parse(art.img) : art.img,
          }))
        : [];
      setBanner(formatted[0] || []);
    } catch (err) {
      // silencioso: el editor permite crear un banner nuevo
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchBanner();
  }, [fetchBanner]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleBannerUpdated = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await fetchBanner();
  }, [fetchBanner]);

  if (loading) {
    return (
      <section className="panel-seccion-cabecera">
        <div className="checkout-loading">
          <span className="cargador" aria-hidden="true" />
          <p className="parrafos">Cargando banner...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel-seccion-cabecera">
      <header className="panel-titulo">
        <span className="etiqueta-seccion">Panel de administración</span>
        <h1 className="panel-titulo-texto">Editar banners</h1>
        <p className="texto-seccion">
          Sube hasta 4 imágenes para el carrusel de la portada.
        </p>
      </header>

      {editorVisible ? (
        <EditBanner
          banner={banner}
          seteditorVisible={setEditorVisible}
          onBannerUpdated={handleBannerUpdated}
        />
      ) : (
        <button
          type="button"
          className="btn-tema btn-tema--primario"
          onClick={() => setEditorVisible(true)}
        >
          Editar banner
        </button>
      )}
    </section>
  );
};

export default Banners;
