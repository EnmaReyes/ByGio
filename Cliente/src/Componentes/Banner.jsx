import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/authContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPause,
  faPenToSquare,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import EditBanner from "./EditBanner";
import { API_URL } from "../config";

const URL = API_URL;

/* Cada cuánto avanza la diapositiva automáticamente. */
const ROTACION_MS = 2000;

const Banner = () => {
  const [banner, setBanner] = useState([]);
  const location = useLocation().search;
  const [loading, setLoading] = useState(true);
  const { currentUser } = useContext(AuthContext);
  const [editorVisible, seteditorVisible] = useState(false);

  /* Imagen visible y control de las imágenes que ya no existen en el CDN. */
  const [indice, setIndice] = useState(0);
  const [imagenesFallidas, setImagenesFallidas] = useState([]);

  /* Rotación automática: se detiene si el usuario la pausa, si el
     puntero/teclado está dentro del carrusel (WAI: auto-rotation-controls)
     o si el sistema pide movimiento reducido. */
  const [pausaManual, setPausaManual] = useState(false);
  const [pausaFoco, setPausaFoco] = useState(false);
  const [movimientoReducido, setMovimientoReducido] = useState(
    () =>
      typeof window !== "undefined" &&
      Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches),
  );

  /* Imagen que sale: se mantiene un instante detrás de la nueva para
     hacer el fundido sin que se vea el fondo. */
  const [imagenPrevia, setImagenPrevia] = useState(null);

  /* La preferencia de movimiento puede cambiar mientras la página está
     abierta (ajustes del sistema). */
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sincronizar = () => setMovimientoReducido(media.matches);

    sincronizar();

    if (media.addEventListener) {
      media.addEventListener("change", sincronizar);
      return () => media.removeEventListener("change", sincronizar);
    }

    // Navegadores antiguos (Safari < 14).
    media.addListener(sincronizar);
    return () => media.removeListener(sincronizar);
  }, []);

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
    setImagenPrevia(null);
  }, [claveImagenes]);

  /* Precarga: con una rotación de 2 s, la imagen siguiente debe estar en
     caché para que el fundido no muestre un hueco. */
  useEffect(() => {
    (banner?.img || []).forEach((url) => {
      if (typeof url !== "string" || !url.trim()) return;
      const precarga = new Image();
      precarga.src = url;
    });
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

  /**
   * Cambia de diapositiva guardando la anterior para el fundido.
   */
  const irAIndice = useCallback(
    (nuevoIndice) => {
      if (nuevoIndice === indiceVisible) return;

      const anterior = banner?.img?.[indiceVisible];
      setImagenPrevia(
        typeof anterior === "string" && anterior.trim() ? anterior : null,
      );
      setIndice(nuevoIndice);
    },
    [banner?.img, indiceVisible],
  );

  /* Navegación manual del carrusel (sin depender del JS de Bootstrap). */
  const cambiarSlide = (paso) => {
    if (disponibles.length < 2) return;

    const posicionActual = disponibles.indexOf(indiceVisible);
    const siguiente =
      (posicionActual + paso + disponibles.length) % disponibles.length;

    irAIndice(disponibles[siguiente]);
  };

  /* Avance automático: usa la lista de imágenes disponibles para saltarse
     las que fallaron en el CDN. */
  const avanzar = useCallback(() => {
    if (disponibles.length < 2) return;

    const posicionActual = disponibles.indexOf(indiceVisible);
    const siguiente = disponibles[(posicionActual + 1) % disponibles.length];

    irAIndice(siguiente);
  }, [disponibles, indiceVisible, irAIndice]);

  const rotacionPausada =
    pausaManual || pausaFoco || movimientoReducido || editorVisible;

  /* Un temporizador (no un interval) por diapositiva: se reinicia solo al
     cambiar de imagen, sea automático o manual. */
  useEffect(() => {
    if (loading || rotacionPausada || disponibles.length < 2) return undefined;

    const temporizador = window.setTimeout(avanzar, ROTACION_MS);

    return () => window.clearTimeout(temporizador);
  }, [avanzar, disponibles.length, loading, rotacionPausada]);

  const mostrarControlPausa =
    disponibles.length > 1 && !loading && !movimientoReducido;

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
          role="region"
          aria-roledescription="carrusel"
          aria-label="Promociones ByGio"
          onFocus={() => setPausaFoco(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setPausaFoco(false);
            }
          }}
        >
          <div className="carousel-inner">
            {loading ? (
              <div className="d-flex justify-content-center p-4 m-4">
                <div className="spinner-border" role="status"></div>
              </div>
            ) : (
              <div className="carousel-item banner-slide active">
                {imagenPrevia && (
                  <img
                    key={`previa-${imagenPrevia}`}
                    src={imagenPrevia}
                    className="banner-img banner-img--previa"
                    alt=""
                    aria-hidden="true"
                    decoding="async"
                    onAnimationEnd={() => setImagenPrevia(null)}
                  />
                )}

                <img
                  key={`actual-${indiceVisible}`}
                  src={banner?.img?.[indiceVisible]}
                  className="banner-img banner-img--actual"
                  alt="Promoción ByGio"
                  decoding="async"
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

          {mostrarControlPausa && (
            <button
              type="button"
              className="carousel-control-pausa"
              onClick={() => setPausaManual((pausada) => !pausada)}
              aria-label={
                pausaManual
                  ? "Reanudar rotación automática"
                  : "Pausar rotación automática"
              }
              aria-pressed={pausaManual}
            >
              <FontAwesomeIcon
                icon={pausaManual ? faPlay : faPause}
                aria-hidden="true"
              />
            </button>
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
