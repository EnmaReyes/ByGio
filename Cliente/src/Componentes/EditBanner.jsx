import React, { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faImage,
  faPlus,
  faUpload,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { Col, Spinner } from "react-bootstrap";
import { API_URL } from "../config";
import axios from "axios";

// ============ CONSTANTES ============
const CLOUDINARY_CONFIG = {
  uploadUrl: "https://api.cloudinary.com/v1_1/ds1xggjvm/image/upload",
  preset: "bygioBanners",
  folder: "Banners",
};

const CONFIG = {
  MAX_IMAGES: 4,
  UPLOAD_TIMEOUT: 30000,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  DEBOUNCE_DELAY: 300,
};

const BUTTON_STYLES = {
  delete: {
    width: "1.3rem",
    height: "1.3rem",
    fontSize: "18px",
    fontFamily: "monospace",
    borderRadius: "50%",
    background: "#d32f2f",
    cursor: "pointer",
    position: "relative",
    top: "0.95rem",
    left: "1.8rem",
    color: "#fff",
    transition: "background 0.3s ease",
    zIndex: 1,
  },
};

// ============ COMPONENTES ============
const DeleteButton = ({ onClick }) => (
  <div
    style={BUTTON_STYLES.delete}
    onClick={onClick}
    onMouseEnter={(e) => (e.currentTarget.style.background = "#b71c1c")}
    onMouseLeave={(e) => (e.currentTarget.style.background = "#d32f2f")}
    title="Eliminar imagen"
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === "Enter" && onClick()}
  >
    ×
  </div>
);

const ThumbnailItem = React.memo(
  ({ imageUrl, index, isProcessing, onImageChange, onDelete, onView }) => {
    const hasImage = Boolean(imageUrl);

    return (
      <div className="d-flex flex-column align-items-center justify-content-center m-2">
        {hasImage && <DeleteButton onClick={() => onDelete(index)} />}

        <label
          className="mb-2"
          style={{
            cursor: isProcessing ? "not-allowed" : "pointer",
            opacity: isProcessing ? 0.6 : 1,
            transition: "opacity 0.3s ease",
          }}
        >
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => onImageChange(e, index)}
            disabled={isProcessing}
            aria-label={`Cargar imagen ${index + 1}`}
          />

          {hasImage ? (
            <div style={{ position: "relative" }}>
              <img
                className="add-img"
                src={imageUrl}
                alt={`Foto ${index + 1}`}
                style={{
                  width: "60px",
                  height: "60px",
                  objectFit: "cover",
                  borderRadius: "4px",
                  opacity: isProcessing ? 0.6 : 1,
                }}
              />
              {isProcessing && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                  aria-hidden="true"
                >
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="fa-spin"
                    style={{ color: "#6C6868", fontSize: "1.2rem" }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="add-hover">
              <FontAwesomeIcon icon={faPlus} />
            </div>
          )}
        </label>

        {hasImage && (
          <span
            className="fs-5"
            role="button"
            tabIndex={0}
            style={{
              cursor: "pointer",
              color: "#6C6868",
              transition: "opacity 0.3s ease",
            }}
            onClick={() => onView(index)}
            onKeyDown={(e) => e.key === "Enter" && onView(index)}
            title="Ver imagen grande"
          >
            <FontAwesomeIcon icon={faEye} />
          </span>
        )}
      </div>
    );
  }
);

ThumbnailItem.displayName = "ThumbnailItem";

// ============ COMPONENTE PRINCIPAL ============
const EditBanner = ({ banner, seteditorVisible, onBannerUpdated }) => {
  // Estado
  const [images, setImages] = useState(banner?.img ? [...banner.img] : []);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingIndices, setUploadingIndices] = useState(new Set());

  /**
   * Valida archivo antes de subir
   */
  const validateFile = useCallback((file) => {
    if (!file.type.startsWith("image/")) {
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
      throw new Error(
        error.response?.data?.error?.message || error.message
      );
    }
  }, []);

  /**
   * Maneja el cambio de imagen con validaciones y subida
   */
  const handleImageChange = useCallback(
    (e, index) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        validateFile(file);
      } catch (error) {
        toast.error(error.message);
        return;
      }

      // Marcar como en carga
      setUploadingIndices((prev) => new Set([...prev, index]));

      // Subir a Cloudinary inmediatamente
      uploadImageToCloudinary(file)
        .then((cloudinaryUrl) => {
          setImages((prev) => {
            const newImages = [...prev];
            newImages[index] = cloudinaryUrl;
            return newImages;
          });

          setSelectedImageIndex(index);
          toast.success("Imagen cargada exitosamente");
        })
        .catch((error) => {
          toast.error(error.message);
        })
        .finally(() => {
          setUploadingIndices((prev) => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
          });
        });
    },
    [uploadImageToCloudinary, validateFile]
  );

  /**
   * Elimina una imagen del estado
   */
  const deleteImage = useCallback((index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (selectedImageIndex === index) {
      setSelectedImageIndex(0);
    }
  }, [selectedImageIndex]);

  /**
   * Valida imágenes antes de guardar
   */
  const validateImages = useCallback(() => {
    if (!images || images.length === 0) {
      throw new Error("Agrega al menos una imagen para continuar");
    }

    const validImages = images.filter(
      (img) => typeof img === "string" && img.trim().length > 0
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
    [banner?.id]
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

    try {
      // Validar imágenes
      const validImages = validateImages();

      setIsSubmitting(true);

      // Guardar banner
      const result = await saveBanner(validImages);
      toast.success(result.message);

      // Refrescar datos y cerrar editor
      await refreshBannerData();
      seteditorVisible?.(false);
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

  const currentImageUrl = images[selectedImageIndex];
  const isLoading = isSubmitting || uploadingIndices.size > 0;
  const canSubmit = images.length > 0 && !isLoading;

  return (
    <div className="d-flex flex-column align-items-center">
      <Col xs={12} md={12} className="d-flex flex-column align-items-center gap-2">
        {/* Vista Previa Principal */}
        <div className="h-100 w-100">
          {currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt="Vista previa del banner"
              className="previewBanner"
              style={{ objectFit: "cover", width: "100%", height: "auto" }}
              onError={() =>
                toast.error("Error al cargar la vista previa de la imagen")
              }
            />
          ) : (
            <div className="d-flex flex-column align-items-center gap-2 p-md-5">
              <FontAwesomeIcon icon={faImage} className="fs-1" />
              <p>Sube tus imágenes de banner</p>
            </div>
          )}
        </div>

        {/* Miniaturas y Botón */}
        <div className="thumbnail-images d-flex flex-row align-items-center justify-content-center w-100 flex-wrap">
          {Array.from({ length: CONFIG.MAX_IMAGES }).map((_, index) => (
            <ThumbnailItem
              key={index}
              imageUrl={images[index] || null}
              index={index}
              isProcessing={uploadingIndices.has(index) || isSubmitting}
              onImageChange={handleImageChange}
              onDelete={deleteImage}
              onView={setSelectedImageIndex}
            />
          ))}

          {/* Botón de Envío */}
          <button
            type="button"
            className="btn btn-dark btn-lg fs-4 d-flex align-items-center justify-content-center"
            style={{
              width: "6rem",
              height: "3rem",
              marginLeft: "1rem",
              marginBottom: "1rem",
              transition: "opacity 0.3s ease",
            }}
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-busy={isSubmitting}
            title={
              images.length === 0
                ? "Agrega al menos una imagen"
                : uploadingIndices.size > 0
                  ? "Espera a que terminen las cargas..."
                  : isSubmitting
                    ? "Guardando..."
                    : "Guardar banner"
            }
          >
            {isSubmitting ? (
              <Spinner
                className="p-2"
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
            ) : (
              <FontAwesomeIcon icon={faUpload} />
            )}
          </button>
        </div>
      </Col>
    </div>
  );
};

export default EditBanner;
