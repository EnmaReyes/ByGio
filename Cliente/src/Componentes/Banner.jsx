import React, { useContext, useEffect, useState, useCallback } from "react";
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
              typeof art.sizes === "string"
                ? JSON.parse(art.sizes)
                : art.sizes,
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

  return (
    <div
      className="w-100 h-100 p-0"
      style={{ paddingTop: "3%", position: "relative" }}
    >
      {editorVisible ? (
        <EditBanner
          banner={banner}
          seteditorVisible={seteditorVisible}
          onBannerUpdated={handleBannerUpdated}
        />
      ) : (
        <div
          id="carouselExampleControls"
          className="carousel slide carrusel-banner"
          data-bs-ride="carousel"
        >
          <div
            className="carousel-inner"
            style={{ width: "100%", height: "100%" }}
          >
            {loading ? (
              <div className="d-flex justify-content-center p-4 m-4">
                <div className="spinner-border" role="status"></div>
              </div>
            ) : (
              banner?.img?.map((bann, index) => (
                <div
                  key={index}
                  className={`carousel-item previewBanner${
                    index === 0 ? " active" : ""
                  }`}
                  style={{ width: "100%", height: "100%" }}
                >
                  <img
                    src={bann}
                    className="banner-img"
                    alt={`Banner ${index + 1}`}
                  />
                </div>
              ))
            )}
          </div>
          <button
            className="carousel-control-prev"
            type="button"
            data-bs-target="#carouselExampleControls"
            data-bs-slide="prev"
          >
            <span
              className="carousel-control-prev-icon"
              aria-hidden="true"
            ></span>
            <span className="visually-hidden">Previous</span>
          </button>
          <button
            className="carousel-control-next"
            type="button"
            data-bs-target="#carouselExampleControls"
            data-bs-slide="next"
          >
            <span
              className="carousel-control-next-icon"
              aria-hidden="true"
            ></span>
            <span className="visually-hidden">Next</span>
          </button>
        </div>
      )}

      {currentUser?.admin === true && (
        <div
          className="upload-img"
          onClick={() => {
            seteditorVisible(!editorVisible);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && seteditorVisible(!editorVisible)}
          title="Editar banner"
        >
          <FontAwesomeIcon icon={faPenToSquare} />
        </div>
      )}
    </div>
  );
};

export default Banner;

