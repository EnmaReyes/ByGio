import { useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/authContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import EditBanner from "./EditBanner";
import { API_URL } from "../config";

const URL = API_URL;

const Banner = () => {
  const [banner, setBanner] = useState([]);
  const location = useLocation().search;
  const [loading, setLoading] = useState(true);
  const { currentUser } = useContext(AuthContext);
  const [editorVisible, seteditorVisible] = useState(false);

  /* Imagen visible y control de las imágenes que ya no existen en el CDN. */
  const [indice, setIndice] = useState(0);
  const [imagenesFallidas, setImagenesFallidas] = useState([]);

  /**
   * Función reutilizable para obtener datos del banner
   */
  const fetchBannerData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${URL}/api/banner/${location}`, {
        withCredentials: true,
      });
      const data = res.data;

      // Verificar y transformar los datos de `img` y `size`
      const formattedData = Array.isArray(data)
        ? data.map((art) => ({
            ...art,
            img: typeof art.img === "string" ? JSON.parse(art.img) : art.img,
            sizes:
              typeof art.sizes === "string" ? JSON.parse(art.sizes) : art.sizes,
          }))
        : [];

      setBanner(formattedData[0] || []);
    } catch (error) {
      console.error("Error cargando banner:", error);
    } finally {
      setLoading(false);
    }
  }, [location]);

  /**
   * Cargar datos cuando cambia la ruta
   */
  useEffect(() => {
    fetchBannerData();
  }, [fetchBannerData, location]);

  /**
   * Callback cuando se actualiza el banner desde el editor
   */
  const handleBannerUpdated = useCallback(async () => {
    // Esperar un pequeño delay para que el servidor procese la actualización
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Refrescar los datos del banner
    await fetchBannerData();
  }, [fetchBannerData]);

  const totalImagenes = banner?.img?.length || 0;

  /* Si cambia la lista de imágenes del banner se reinicia la vista. */
  const claveImagenes = JSON.stringify(banner?.img || []);

  useEffect(() => {
    setIndice(0);
    setImagenesFallidas([]);
  }, [claveImagenes]);

  /* Índices de las imágenes que sí existen en el CDN. */
  const disponibles = useMemo(
    () =>
      Array.from({ length: totalImagenes }, (_, posicion) => posicion).filter(
        (posicion) => !imagenesFallidas.includes(posicion),
      ),
    [totalImagenes, imagenesFallidas],
  );

  /* Imagen visible: si la elegida ya no existe, se usa la siguiente. */
  const indiceVisible = useMemo(() => {
    if (!disponibles.length) return 0;
    if (disponibles.includes(indice)) return indice;
    return disponibles[0];
  }, [disponibles, indice]);

  /* Hay datos pero ninguna imagen del CDN está disponible. */
  const todasFallidas = totalImagenes > 0 && disponibles.length === 0;

  /* El marco se muestra mientras haya datos; se oculta si no hay ninguno o si
     ninguna imagen existe. El administrador siempre lo ve para poder editar. */
  const mostrarFrame =
    currentUser?.admin === true ||
    loading ||
    (totalImagenes > 0 && !todasFallidas);

  /**
   * Una imagen que no existe en el CDN deja de tenerse en cuenta y pasa a
   * mostrarse la siguiente disponible.
   */
  const manejarErrorImagen = () => {
    setImagenesFallidas((previas) =>
      previas.includes(indiceVisible) ? previas : [...previas, indiceVisible],
    );
  };

  /* Navegación del carrusel (sin depender del JS de Bootstrap). */
  const cambiarSlide = (paso) => {
    if (disponibles.length < 2) return;

    const posicionActual = disponibles.indexOf(indiceVisible);
    const siguiente =
      (posicionActual + paso + disponibles.length) % disponibles.length;

    setIndice(disponibles[siguiente]);
  };

  return (
    <div
      className={`banner-section${
        mostrarFrame ? "" : " banner-section--vacia"
      }`}
    >
      {editorVisible ? (
        <EditBanner
          banner={banner}
          seteditorVisible={seteditorVisible}
          onBannerUpdated={handleBannerUpdated}
        />
      ) : mostrarFrame ? (
        <div
          id="carouselExampleControls"
          className="carousel slide carrusel-banner banner-frame"
        >
          <div className="carousel-inner">
            {loading ? (
              <div className="d-flex justify-content-center p-4 m-4">
                <div className="spinner-border" role="status"></div>
              </div>
            ) : (
              <div className="carousel-item banner-slide active">
                <img
                  key={indiceVisible}
                  src={banner?.img?.[indiceVisible]}
                  className="banner-img"
                  alt="Promoción ByGio"
                  onError={manejarErrorImagen}
                />
              </div>
            )}
          </div>
          {disponibles.length > 1 && (
            <>
              <button
                className="carousel-control-prev"
                type="button"
                onClick={() => cambiarSlide(-1)}
              >
                <span
                  className="carousel-control-prev-icon"
                  aria-hidden="true"
                ></span>
                <span className="visually-hidden">Anterior</span>
              </button>
              <button
                className="carousel-control-next"
                type="button"
                onClick={() => cambiarSlide(1)}
              >
                <span
                  className="carousel-control-next-icon"
                  aria-hidden="true"
                ></span>
                <span className="visually-hidden">Siguiente</span>
              </button>
            </>
          )}
        </div>
      ) : null}

      {currentUser?.admin === true && (
        <div
          className="upload-img"
          onClick={() => {
            seteditorVisible(!editorVisible);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            e.key === "Enter" && seteditorVisible(!editorVisible)
          }
          title="Editar banner"
        >
          <FontAwesomeIcon icon={faPenToSquare} />
        </div>
      )}
    </div>
  );
};

export default Banner;
