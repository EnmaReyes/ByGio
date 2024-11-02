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

const Editor = () => {
  const navigate = useNavigate();
  const state = useLocation().state;

  const [title, setTitle] = useState(state?.title || "");
  const [description, setDescription] = useState(state?.desc || "");
  const [fileImg, setFileImg] = useState(
    state?.img || [null, null, null, null]
  );
  const [selectedImage, setSelectedImage] = useState(null);
  const [sizes, setSizes] = useState(state?.sizes || ["S", "M", "L"]);
  const [overSize, setOverSize] = useState(state?.overSize || false);
  const [cost, setCost] = useState(state?.cost || "");
  const [stock, setStock] = useState(state?.stock || true);
  const [loading, setLoading] = useState(false);

  const URL = API_URL;

  // Manejador para actualizar una imagen en una posición específica del array
  const handleImageChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        const newImages = [...fileImg];
        newImages[index] = reader.result;
        setFileImg(newImages);
        setSelectedImage(reader.result);
      };

      reader.readAsDataURL(file);
    }
  };

  // Función para agregar nuevas tallas
  const addSizeField = () => {
    setSizes([...sizes, ""]);
  };

  const deleteSizeField = (index) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };
  // Manejador de envío para agregar o editar el artículo
  const handleClick = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verificar si todos los campos obligatorios están completos
      if (!title || !description || !cost || !sizes.some((size) => size)) {
        toast.error("Falta información para subir el artículo!");
        setLoading(false);
        return;
      }

      let imgUrl = state?.img;

      if (fileImg && fileImg.some((img) => img !== null)) {
        imgUrl = await UploadImg(fileImg); // Subir las imágenes a tu servidor o servicio de almacenamiento
      }

      const postData = {
        title,
        desc: description,
        img: imgUrl,
        sizes,
        overSize,
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

      // Notificación del estado de la solicitud
      toast.promise(promise, {
        pending: "Subiendo artículo...",
        success: {
          render({ data }) {
            const responseData = JSON.parse(data.config.data);
            return `${responseData.title} subido exitosamente`;
          },
        },
        error: {
          render({ data }) {
            return `Error: ${data.message}`;
          },
        },
      });

      await promise;
      navigate("/");
    } catch (err) {
      toast.error(`Error al realizar la solicitud: ${err.message}`);
      console.log("Error al realizar la solicitud:", err);
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
            {selectedImage ? (
              <img
                src={selectedImage}
                alt="Imagen seleccionada"
                style={{ width: "100%", maxWidth: "400px" }}
              />
            ) : (
              <div
                className="d-flex flex-row align-items-center"
                style={{ width: "100%", maxWidth: "400px", height: "375px" }}
              >
                <p>Sube tus imágenes</p>
              </div>
            )}
          </div>

          {/* Subir imágenes (4 en total) */}
          <div className="thumbnail-images d-flex flex-column">
            {fileImg.map((image, index) => (
              <label key={index} className="mb-2" style={{ cursor: "pointer" }}>
                <input
                  type="file"
                  style={{ display: "none" }}
                  onChange={(e) => handleImageChange(e, index)}
                />
                {image ? (
                  <img
                    src={image}
                    alt={`Imagen ${index + 1}`}
                    style={{
                      width: "60px",
                      height: "60px",
                      objectFit: "cover",
                    }}
                    onClick={() => setSelectedImage(image)}
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
            ))}
          </div>
        </Col>

        {/* Información del producto */}
        <Col xs={12} md={6}>
          <Form onSubmit={handleClick}>
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

            <Button variant="dark" type="submit" disabled={loading} size="lg">
              {loading ? "Subiendo..." : "Agregar Producto"}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default Editor;
