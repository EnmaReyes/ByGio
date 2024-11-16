import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_URL } from "../config";
import { Col, Container, Row, Button, Form } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import {
  notify,
  toastpromise,
} from "../Componentes/toastConfig/toastconfigs.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";

const URL = API_URL;

const Editor = () => {
  const navigate = useNavigate();
  const state = useLocation().state;

  const [title, setTitle] = useState(state?.title || "");
  const [description, setDescription] = useState(state?.desc || "");
  const [fileImg, setFileImg] = useState([null, null, null, null]);
  const [imgUrls, setImgUrls] = useState(state?.img || []);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [sizes, setSizes] = useState(state?.sizes || ["S", "M", "L"]);
  const [overSize, setOverSize] = useState(state?.overSize || false);
  const [stock, setStock] = useState(state?.stock || true);
  const [cost, setCost] = useState(state?.cost || "");
  const [loading, setLoading] = useState(false);

  const preset_name = "bygiostore";
  const cloud_name = "ds1xggjvm";

  const uploadImageToCloudinary = async (image) => {
    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", preset_name);
    formData.append("cloud_name", cloud_name);

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
      const newFileImg = [...fileImg];
      newFileImg[index] = localPreview;
      setFileImg(newFileImg);
      setSelectedImageIndex(index);
    }
  };
  const addSizeField = () => setSizes([...sizes, ""]);
  const deleteSizeField = (index) =>
    setSizes(sizes.filter((_, i) => i !== index));

  const handleClick = async (e) => {
    setLoading(true);
    e.preventDefault();

    try {
      if (!title || !description || !cost || !sizes.some((size) => size)) {
        toast.error("Falta información para subir el artículo!", toastpromise);
        setLoading(false);
        return;
      }

      // Subir imágenes a Cloudinary
      const uploadedUrls = await Promise.all(
        fileImg.map(async (file, index) => {
          if (file) {
            // Convertir URL local a archivo para Cloudinary
            const blob = await fetch(file).then((res) => res.blob());
            return await uploadImageToCloudinary(blob);
          }
          // Si no hay imagen, mantener la URL existente
          return imgUrls[index] || null;
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
        title,
        desc: description,
        img: validUrls,
        sizes,
        oversize: overSize,
        cost,
        stock,
      };

      const promise = state
        ? axios.put(`${URL}/api/posts/${state.id}`, postData, {
            withCredentials: true,
          })
        : axios.post(`${URL}/api/posts/add`, postData, {
            withCredentials: true,
          });

      toast.promise(promise, {
        pending: "Subiendo artículo...",
        success: `${title} subido exitosamente`,
        error: "Error al subir el artículo",
      });

      await promise;
      navigate("/");
    } catch (err) {
      toast.error(`Error al realizar la solicitud: ${err.message}`);
      console.error("Error al realizar la solicitud:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mb-4" style={{ paddingTop: "90px" }}>
      <Row>
        <Col
          xs={12}
          md={6}
          className="d-flex flex-row align-items-center gap-5 p-2"
        >
          {/* Imagen principal */}
          <div className="main-image mb-3">
            {fileImg[selectedImageIndex] ? (
              <img
                src={fileImg[selectedImageIndex]}
                alt="Imagen seleccionada"
                style={{ width: "100%", maxWidth: "400px" }}
              />
            ) : (
              <div
                style={{ width: "100%", maxWidth: "400px", height: "375px" }}
              >
                <p>Sube tus imágenes</p>
              </div>
            )}
          </div>

          {/* Subir imágenes (4 en total) */}
          <div className="thumbnail-images d-flex flex-column">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className="d-flex align-items-center justifyContent-center gap-2"
              >
                <label className="mb-2" style={{ cursor: "pointer" }}>
                  <input
                    type="file"
                    style={{ display: "none" }}
                    onChange={(e) => handleImageChange(e, index)}
                  />
                  {fileImg[index] ? (
                    <img
                      src={fileImg[index]}
                      alt={`Imagen ${index + 1}`}
                      style={{
                        width: "60px",
                        height: "60px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        backgroundColor: "#eee",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      +
                    </div>
                  )}
                </label>

                {fileImg[index] && (
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
          </div>
        </Col>

        {/* Información del producto */}
        <Col xs={12} md={6}>
          <Form>
            <Form.Group className="mb-3" controlId="formTitle">
              <Form.Label>Título</Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título del producto"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formDescription">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del producto"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formPrice">
              <Form.Label>Precio</Form.Label>
              <Form.Control
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="Precio"
              />
            </Form.Group>

            <Form.Group
              className="d-flex align-items-center justifyContent-center mb-3 gap-3"
              controlId="formStock"
            >
              <Form.Label className="d-flex align-items-center">
                Stock
              </Form.Label>
              <Form.Switch
                className="fs-5"
                checked={stock}
                onChange={() => setStock(!stock)}
              />
            </Form.Group>

            <Form.Label className="mb-3 d-flex justify-content-center align-items-center">
              Tallas
            </Form.Label>
            <div className="mb-3 d-flex flex-column justify-content-center align-items-center">
              <Form.Group className="d-flex flex-row align-items-center justify-content-center gap-2">
                {sizes.map((size, index) => (
                  <div key={index} className="d-flex align-items-center gap-2">
                    <Form.Control
                      className="text-center"
                      style={{ width: "50px" }}
                      type="text"
                      value={size}
                      onChange={(e) => {
                        const newSizes = [...sizes];
                        newSizes[index] = e.target.value;
                        setSizes(newSizes);
                      }}
                      placeholder={size}
                    />
                    <div
                      className=" d-flex text-center align-items-center justify-content-center"
                      style={{
                        width: "17px",
                        height: "17px",
                        fontSize: "14px",
                        fontFamily: "monospace",
                        borderRadius: "50%",
                        background: "#000",
                        cursor: "pointer",
                        position: "relative",
                        top: "-0.9rem",
                        left: "-1.3rem",
                        color: "#fff",
                      }}
                      onClick={() => deleteSizeField(index)}
                    >
                      x
                    </div>
                  </div>
                ))}
              </Form.Group>

              <Button
                className="mt-3"
                variant="dark"
                size="sm"
                onClick={addSizeField}
              >
                + Talla
              </Button>
            </div>
            <Form.Group className="d-flex align-items-center mb-3 gap-3">
              <Form.Label className="">Oversize</Form.Label>
              <Form.Switch
                className="fs-5"
                checked={overSize}
                onChange={() => setOverSize(!overSize)}
              />
            </Form.Group>

            <Button
              variant="dark"
              disabled={loading}
              size="lg"
              onClick={(e) => handleClick(e)}
            >
              {loading ? "Subiendo..." : "Agregar Producto"}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default Editor;
