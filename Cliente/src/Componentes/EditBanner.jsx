import React, { useState } from "react";
import { toast } from "react-toastify";
import { toastpromise } from "./toastConfig/toastconfigs";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faImage,
  faPlus,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { Col, Spinner } from "react-bootstrap";
import { API_URL } from "../config";
import axios from "axios";

const URL = API_URL;

const EditBanner = ({ banner }) => {
  const [banerImg, setBannerImg] = useState(banner?.img || []);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const preset_name = "bygioBanners";
  const cloud_name = "ds1xggjvm";

  const uploadImageToCloudinary = async (image) => {
    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", preset_name);
    formData.append("cloud_name", cloud_name);
    formData.append("folder", "Banners");
    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        formData
      );

      return response.data.secure_url;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(`Error al Subir las imagenes: ${err.message}`);
      return null;
    }
  };

  const handleImageChange = async (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const localPreview = window.URL.createObjectURL(file);
      const newFileImg = [...banerImg];
      newFileImg[index] = localPreview;
      setBannerImg(newFileImg);
      setSelectedImageIndex(index);
    }
  };

  const deleteImgBanner = (index) =>
    setBannerImg(banerImg.filter((_, i) => i !== index));

  const handleClick = async (e) => {
    setLoading(true);
    e.preventDefault();

    try {
      if (banerImg.length === 0) {
        toast.error("Falta información para subir el artículo!", toastpromise);
        setLoading(false);
        return;
      }

      // Subir imágenes a Cloudinary
      const uploadedUrls = await Promise.all(
        banerImg.map(async (file, index) => {
          if (file) {
            // Convertir URL local a archivo para Cloudinary
            const blob = await fetch(file).then((res) => res.blob());
            return await uploadImageToCloudinary(blob);
          }
          // Si no hay imagen, mantener la URL existente
          return banerImg[index] || null;
        })
      );

      // Filtrar URLs válidas (puede haber `null` si alguna carga falló)
      const validUrls = uploadedUrls.filter((url) => url !== null);

      if (validUrls.length === 0) {
        toast.error("No se pudieron subir las imágenes!");
        setLoading(false);
        return;
      }

      const postData = {
        img: validUrls,
      };

      const promise =
        banner && banner.id
          ? axios.put(`${URL}/api/banner/${banner.id}`, postData, {
              withCredentials: true,
            })
          : axios.post(`${URL}/api/banner/addbanner`, postData, {
              withCredentials: true,
            });

      toast.promise(promise, {
        pending: `Subiendo ${validUrls.length} Banner`,
        success: `Banner subido exitosamente`,
        error: "Error al subir el Banner",
      });

      await promise;
      navigate("/");
    } catch (err) {
      toast.error(`Error al realizar la solicitud: ${err.message}`);
      console.error("Error al realizar la solicitud:", err);
    } finally {
      setLoading(false);
      window.location.reload(); // Recarga la página
    }
  };
  return (
    <div className="d-flex flex-column align-items-center ">
      <Col
        xs={12}
        md={12}
        className="d-flex flex-column align-items-center gap-2"
      >
        {/* Imagen principal */}
        <div className="h-100 w-100">
          {banerImg[selectedImageIndex] ? (
            <img
              src={banerImg[selectedImageIndex]}
              alt="Imagen seleccionada"
              class="previewBanner"
            />
          ) : (
            <div
              style={{ width: "100%", height: "auto", fontSize: "20px" }}
              className="d-flex flex-column align-items-center gap-2 p-md-5"
            >
              <FontAwesomeIcon icon={faImage} className="fs-1" />
              <p>Sube tus imágenes</p>
            </div>
          )}
        </div>
        <div className="thumbnail-images d-flex flex-row align-items-center justify-content-center w-100">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="d-flex flex-column align-items-center justify-content-center m-2"
            >
              {banerImg[index] && <div
                className=" d-flex text-center align-items-center justify-content-center"
                style={{
                  width: "1.3rem",
                  height: "1.3rem",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  borderRadius: "50%",
                  background: "#000",
                  cursor: "pointer",
                  position: "relative",
                  top: "0.95rem",
                  left: "1.8rem",
                  color: "#fff",
                  
                }}
                onClick={() => deleteImgBanner(index)}
              >
                x
              </div>}
              <label className="mb-2" style={{ cursor: "pointer" }}>
                <input
                  type="file"
                  style={{ display: "none" }}
                  onChange={(e) => handleImageChange(e, index)}
                />
                {banerImg[index] ? (
                  <div>
                    <img
                      className="add-img"
                      src={banerImg[index]}
                      alt={`Imagen ${index + 1}`}
                      style={{
                        width: "60px",
                        height: "60px",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                ) : (
                  <div className="add-hover">
                    <FontAwesomeIcon icon={faPlus} />
                  </div>
                )}
              </label>

              {banerImg[index] && (
                <span
                  className="fs-5"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setSelectedImageIndex(index);
                  }}
                >
                  <FontAwesomeIcon icon={faEye} />
                </span>
              )}
            </div>
          ))}
          <button
            type="button"
            class="btn btn-dark btn-lg fs-4 d-flex align-items-center justify-content-center"
            style={{ width: "6rem", height: "3rem", marginLeft:"1rem", marginBottom:"1rem" }}
            onClick={(e) => handleClick(e)}
          >
            {loading ? (
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
