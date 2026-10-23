import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImage,
  faPenToSquare,
  faPlus,
  faSpinner,
  faTrash,
  faUpload,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { API_URL } from "../config";
import axios from "axios";

// ============ CONSTANTES ============
const CLOUDINARY_CONFIG = {
  uploadUrl: `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload`,
  preset: import.meta.env.VITE_CLOUDINARY_PRESET_BANNER,
  folder: "Banners",
};

const CONFIG = {
  MAX_IMAGES: 4,
  UPLOAD_TIMEOUT: 30000,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
};

// ============ COMPONENTE PRINCIPAL ============
const EditBanner = ({ banner, seteditorVisible, onBannerUpdated }) => {
  // Estado
  const [images, setImages] = useState(() =>
    Array.isArray(banner?.img) ? [...banner.img] : [],
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* Vista previa local (blob) por índice mientras la imagen viaja a
     Cloudinary. La imagen remota solo se reemplaza cuando la subida
     termina bien, así un fallo no borra la foto que ya estaba. */
  const [uploads, setUploads] = useState({});
  const [arrastrando, setArrastrando] = useState(false);

  /* Blob URLs vivas: se revocan al desmontar (cerrar el editor). */
  const blobsRef = useRef(new Set());
  const uploadingSlotsRef = useRef(new Set());

  useEffect(
    () => () => {
      blobsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobsRef.current.clear();
    },
    [],
  );

  /**
   * Valida archivo antes de subir
   */
  const validateFile = useCallback((file) => {
    if (!file.type?.startsWith("image/")) {
      throw new Error("Solo se permiten archivos de imagen");
    }

    if (file.size > CONFIG.MAX_FILE_SIZE) {
      throw new Error("La imagen no debe exceder 5MB");
    }

    return true;
  }, []);

  /**
   * Sube una imagen a Cloudinary
   */
  const uploadImageToCloudinary = useCallback(async (file) => {
    if (!CLOUDINARY_CONFIG.preset || !import.meta.env.VITE_CLOUDINARY_NAME) {
      throw new Error("La configuración de Cloudinary no está disponible");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_CONFIG.preset);
    formData.append("folder", CLOUDINARY_CONFIG.folder);

    try {
      const response = await axios.post(CLOUDINARY_CONFIG.uploadUrl, formData, {
        timeout: CONFIG.UPLOAD_TIMEOUT,
      });

      if (!response.data?.secure_url) {
        throw new Error("Cloudinary no retornó URL");
      }

      return response.data.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new Error(error.response?.data?.error?.message || error.message);
    }
  }, []);

  /**
   * Sube una imagen y la coloca en el índice indicado.
   */
  const subirImagen = useCallback(
    async (file, index) => {
      if (uploadingSlotsRef.current.has(index)) {
        toast.info("Ya hay una imagen cargándose en este espacio.");
        return;
      }

      try {
        validateFile(file);
      } catch (error) {
        toast.error(error.message);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      uploadingSlotsRef.current.add(index);
      blobsRef.current.add(previewUrl);
      setUploads((prev) => ({ ...prev, [index]: previewUrl }));

      try {
        const cloudinaryUrl = await uploadImageToCloudinary(file);

        setImages((prev) => {
          const newImages = [...prev];
          newImages[index] = cloudinaryUrl;
          return newImages;
        });
        setSelectedImageIndex(index);
        toast.success("Imagen cargada");
      } catch (error) {
        toast.error(error.message || "No se pudo cargar la imagen");
      } finally {
        URL.revokeObjectURL(previewUrl);
        blobsRef.current.delete(previewUrl);
        uploadingSlotsRef.current.delete(index);
        setUploads((prev) => {
          if (prev[index] !== previewUrl) return prev;
          const next = { ...prev };
          delete next[index];
          return next;
        });
      }
    },
    [uploadImageToCloudinary, validateFile],
  );

  const subiendoAlgo = Object.keys(uploads).length > 0;

  const totalImagenes = useMemo(
    () =>
      images.filter((img) => typeof img === "string" && img.trim().length > 0)
        .length,
    [images],
  );

  /* Índices sin imagen y sin subida en curso. */
  const indicesLibres = useMemo(() => {
    const libres = [];
    for (let index = 0; index < CONFIG.MAX_IMAGES; index += 1) {
      if (!images[index] && !uploads[index]) libres.push(index);
    }
    return libres;
  }, [images, uploads]);

  /* Imagen que se muestra en grande: la elegida o la primera válida. */
  const indiceVista = useMemo(() => {
    const actual = images[selectedImageIndex];
    if (typeof actual === "string" && actual.trim()) return selectedImageIndex;

    const primero = images.findIndex(
      (img) => typeof img === "string" && img.trim(),
    );
    return primero === -1 ? 0 : primero;
  }, [images, selectedImageIndex]);

  const imagenVista = images[indiceVista] || null;
  const previewVista = uploads[indiceVista] || null;
  const urlVista = previewVista || imagenVista;
  const destinoPrincipal = imagenVista ? indiceVista : (indicesLibres[0] ?? 0);

  /**
   * Reparte los archivos recibidos entre los huecos libres (o reemplaza
   * la imagen en vista cuando es un único archivo).
   */
  const iniciarSubidas = useCallback(
    (files, indicePreferido = 0) => {
      const seleccionados = Array.from(files || []);
      const archivos = seleccionados.filter(
        (file) => file && file.type?.startsWith("image/"),
      );

      if (!archivos.length) {
        if (seleccionados.length) {
          toast.error("Solo se permiten archivos de imagen");
        }
        return;
      }

      if (archivos.length !== seleccionados.length) {
        toast.error("Se omitieron archivos que no son imágenes.");
      }

      const slotPreferido =
        Number.isInteger(indicePreferido) &&
        indicePreferido >= 0 &&
        indicePreferido < CONFIG.MAX_IMAGES
          ? indicePreferido
          : null;
      const huecosDisponibles = indicesLibres.filter(
        (index) => !uploadingSlotsRef.current.has(index),
      );
      const destinos =
        archivos.length === 1
          ? [
              slotPreferido ??
                (imagenVista ? indiceVista : (huecosDisponibles[0] ?? 0)),
            ]
          : huecosDisponibles.slice(0, archivos.length);

      if (!destinos.length) {
        toast.info(
          `El banner ya tiene ${CONFIG.MAX_IMAGES} imágenes. Elimina una para cambiarla.`,
        );
        return;
      }

      archivos.slice(0, destinos.length).forEach((file, posicion) => {
        subirImagen(file, destinos[posicion]);
      });

      if (archivos.length > destinos.length) {
        toast.info(
          `Solo se cargaron ${destinos.length} de ${archivos.length} imágenes.`,
        );
      }
    },
    [imagenVista, indiceVista, indicesLibres, subirImagen],
  );

  /**
   * Input de archivo de una miniatura o del lienzo principal.
   */
  const handleFileInput = useCallback(
    (event, index) => {
      /* La FileList de un input es "viva": si se limpia el value antes
         de copiar los archivos, la lista queda vacía y no sube nada. */
      const archivos = Array.from(event.target.files || []);
      // Permite volver a elegir el mismo archivo después de un error.
      event.target.value = "";
      if (archivos.length) iniciarSubidas(archivos, index);
    },
    [iniciarSubidas],
  );

  const handleDragOver = useCallback((event) => {
    if (!event.dataTransfer?.types?.includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setArrastrando(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setArrastrando(false);
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setArrastrando(false);
      const { files } = event.dataTransfer || {};
      if (files?.length) iniciarSubidas(files, destinoPrincipal);
    },
    [destinoPrincipal, iniciarSubidas],
  );

  /**
   * Elimina una imagen del estado
   */
  const deleteImage = useCallback(
    (index) => {
      if (subiendoAlgo || uploadingSlotsRef.current.size > 0) return;

      setImages((prev) => prev.filter((_, i) => i !== index));
      setSelectedImageIndex((prev) => {
        if (prev > index) return prev - 1;
        if (prev === index) return Math.max(0, index - 1);
        return prev;
      });
    },
    [subiendoAlgo],
  );

  const cerrarEditor = useCallback(() => {
    seteditorVisible?.(false);
  }, [seteditorVisible]);

  /**
   * Valida imágenes antes de guardar
   */
  const validateImages = useCallback(() => {
    if (!images || images.length === 0) {
      throw new Error("Agrega al menos una imagen para continuar");
    }

    const validImages = images.filter(
      (img) => typeof img === "string" && img.trim().length > 0,
    );

    if (validImages.length === 0) {
      throw new Error("No hay imágenes válidas para guardar");
    }

    return validImages;
  }, [images]);

  /**
   * Guarda el banner en la BD
   */
  const saveBanner = useCallback(
    async (validImages) => {
      const payload = { img: validImages };
      const isUpdate = Boolean(banner?.id);

      const endpoint = isUpdate
        ? `${API_URL}/api/banner/${banner.id}`
        : `${API_URL}/api/banner/addbanner`;

      const config = {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (isUpdate) {
        await axios.put(endpoint, payload, config);
        return { success: true, message: "Banner actualizado exitosamente" };
      } else {
        await axios.post(endpoint, payload, config);
        return { success: true, message: "Banner creado exitosamente" };
      }
    },
    [banner?.id],
  );

  /**
   * Refrescar datos del banner desde el servidor
   */
  const refreshBannerData = useCallback(async () => {
    if (onBannerUpdated) {
      await onBannerUpdated();
    }
  }, [onBannerUpdated]);

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (uploadingSlotsRef.current.size > 0) {
      toast.info("Espera a que terminen las cargas antes de guardar.");
      return;
    }

    try {
      // Validar imágenes
      const validImages = validateImages();

      setIsSubmitting(true);

      // Guardar banner
      const result = await saveBanner(validImages);
      toast.success(result.message);

      // Refrescar datos y cerrar editor
      await refreshBannerData();
      cerrarEditor();
    } catch (error) {
      console.error("Error al guardar banner:", error);

      let errorMsg = "Error desconocido al guardar el banner";

      if (error.response?.data) {
        errorMsg =
          typeof error.response.data === "string"
            ? error.response.data
            : error.response.data?.message || error.response.data?.error;
      } else if (error.message) {
        errorMsg = error.message;
      }

      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = totalImagenes > 0 && !isSubmitting && !subiendoAlgo;
  const cargandoCount = Object.keys(uploads).length;

  const tituloGuardar = isSubmitting
    ? "Guardando…"
    : subiendoAlgo
      ? "Espera a que terminen las cargas"
      : totalImagenes === 0
        ? "Agrega al menos una imagen"
        : "Guardar banner";

  return (
    <section className="banner-editor" aria-labelledby="banner-editor-titulo">
      <header className="banner-editor-cabecera">
        <div className="banner-editor-intro">
          <span className="etiqueta-seccion">Panel ByGio</span>
          <h2 className="banner-editor-titulo" id="banner-editor-titulo">
            Editar banner
          </h2>
          <p className="banner-editor-texto">
            Sube hasta {CONFIG.MAX_IMAGES} imágenes. La primera abre el
            carrusel del inicio; arrástralas sobre la vista previa o usa el
            botón de cada recuadro.
          </p>
        </div>

        <div className="banner-editor-meta">
          <span
            className="banner-editor-contador"
            data-completo={totalImagenes >= CONFIG.MAX_IMAGES}
            aria-live="polite"
          >
            <FontAwesomeIcon icon={faImage} aria-hidden="true" />
            {totalImagenes} de {CONFIG.MAX_IMAGES} imágenes
          </span>

          <button
            type="button"
            className="banner-editor-cerrar"
            onClick={cerrarEditor}
            aria-label="Cerrar editor de banner"
          >
            <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="banner-editor-cuerpo">
        {/* Vista previa principal */}
        <div className="banner-editor-vista">
          <div
            className="banner-editor-lienzo"
            data-arrastrando={arrastrando}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {urlVista ? (
              <img
                className="banner-editor-imagen"
                src={urlVista}
                alt="Vista previa del banner seleccionado"
                onError={() =>
                  toast.error("No se pudo cargar la vista previa de la imagen")
                }
              />
            ) : (
              <div className="banner-editor-vacio">
                <span className="banner-editor-vacio-icono" aria-hidden="true">
                  <FontAwesomeIcon icon={faImage} />
                </span>
                <p className="banner-editor-vacio-titulo">
                  Arrastra una imagen aquí
                </p>
                <p className="banner-editor-vacio-texto">
                  JPG, PNG o WebP · máximo 5 MB
                </p>
              </div>
            )}

            {previewVista && (
              <div className="banner-editor-cargando" role="status">
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="fa-spin"
                  aria-hidden="true"
                />
                <span>Subiendo imagen…</span>
              </div>
            )}

            {arrastrando && (
              <div className="banner-editor-soltar" aria-hidden="true">
                Suelta para cargar
              </div>
            )}

            <label className="banner-editor-subir">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileInput(e, destinoPrincipal)}
                disabled={isSubmitting}
              />
              <FontAwesomeIcon icon={faUpload} aria-hidden="true" />
              <span>{urlVista ? "Cambiar imagen" : "Subir imagen"}</span>
            </label>
          </div>

          <p className="banner-editor-pie-texto">
            Formato recomendado 16:7. Las imágenes se recortan al centro.
          </p>
        </div>

        {/* Miniaturas + acciones */}
        <div className="banner-editor-panel">
          <div className="banner-editor-panel-cabecera">
            <h3 className="banner-editor-subtitulo">Imágenes del banner</h3>
            <p className="banner-editor-ayuda">
              Arrastra varias a la vez o usa el botón de cada recuadro. Pulsa
              una miniatura para verla en grande.
            </p>
          </div>

          <ul className="banner-editor-miniaturas">
            {Array.from({ length: CONFIG.MAX_IMAGES }).map((_, index) => {
              const subiendoSlot = Boolean(uploads[index]);
              const urlSlot = uploads[index] || images[index] || null;
              const activa = Boolean(images[index]) && index === indiceVista;

              return (
                <li key={index}>
                  <div
                    className="banner-editor-miniatura"
                    data-activa={activa}
                    data-vacia={!urlSlot}
                  >
                    {urlSlot ? (
                      <button
                        type="button"
                        className="banner-editor-miniatura-seleccionar"
                        onClick={() => setSelectedImageIndex(index)}
                        aria-label={`Ver imagen ${index + 1} en grande`}
                        aria-pressed={activa}
                      >
                        <img
                          src={urlSlot}
                          alt={`Miniatura ${index + 1}`}
                          loading="lazy"
                        />
                      </button>
                    ) : (
                      <label className="banner-editor-miniatura-agregar">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileInput(e, index)}
                          disabled={isSubmitting}
                          aria-label={`Cargar imagen ${index + 1}`}
                        />
                        <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
                        <span>Imagen {index + 1}</span>
                      </label>
                    )}

                    {subiendoSlot && (
                      <span
                        className="banner-editor-miniatura-cargando"
                        aria-hidden="true"
                      >
                        <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
                      </span>
                    )}

                    {urlSlot && !subiendoSlot && (
                      <div className="banner-editor-miniatura-acciones">
                        <label
                          className="banner-editor-miniatura-reemplazar"
                          title="Cambiar imagen"
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileInput(e, index)}
                            disabled={isSubmitting}
                            aria-label={`Cambiar imagen ${index + 1}`}
                          />
                          <FontAwesomeIcon
                            icon={faPenToSquare}
                            aria-hidden="true"
                          />
                        </label>

                        <button
                          type="button"
                          className="banner-editor-miniatura-eliminar"
                          onClick={() => deleteImage(index)}
                          disabled={subiendoAlgo || isSubmitting}
                          aria-label={`Eliminar imagen ${index + 1}`}
                        >
                          <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                        </button>
                      </div>
                    )}

                    {activa && (
                      <span className="banner-editor-miniatura-etiqueta">
                        En vista
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {subiendoAlgo && (
            <p className="banner-editor-estado" role="status">
              Cargando {cargandoCount}{" "}
              {cargandoCount === 1 ? "imagen" : "imágenes"}… espera un momento.
            </p>
          )}

          <div className="banner-editor-acciones">
            <button
              type="button"
              className="btn-tema btn-tema--primario"
              onClick={handleSubmit}
              disabled={!canSubmit}
              aria-busy={isSubmitting}
              title={tituloGuardar}
            >
              {isSubmitting ? (
                <>
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="fa-spin"
                    aria-hidden="true"
                  />
                  Guardando…
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUpload} aria-hidden="true" />
                  {banner?.id ? "Guardar cambios" : "Publicar banner"}
                </>
              )}
            </button>

            <button
              type="button"
              className="btn-tema btn-tema--contorno"
              onClick={cerrarEditor}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          </div>

          <p className="banner-editor-nota">
            Los cambios se aplican al guardar. Si cierras sin guardar, el
            banner conserva sus imágenes actuales.
          </p>
        </div>
      </div>
    </section>
  );
};

export default EditBanner;
