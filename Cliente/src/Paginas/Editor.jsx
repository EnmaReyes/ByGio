import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_URL } from "../config";
import { Col, Container, Row, Button, Form } from "react-bootstrap";

const Editor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const state = useLocation().state;
  const [title, setTitle] = useState(state?.title || "");
  const [description, setDescription] = useState(state?.desc || "");
  const [fileImg, setFileImg] = useState(
    state?.img || [null, null, null, null]
  );
  const [selectedImage, setSelectedImage] = useState(null);
  const [sizes, setSizes] = useState(state?.sizes || ["", "", ""]);
  const [overSize, setOverSze] = useState(state?.overSize);
  const [cost, setCost] = useState(state?.cost || null);
  const [stock, setStock] = useState(state?.stock || "");

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
  console.log(fileImg);

  //! subir o editar articulo
  const handleClick = async () => {
    setLoading(!loading);
    try {
      // Verificar si title, fileImg o description están vacíos o en false
      if (!title || !description || !cost) {
        toast.error("Falta información para subir el Blog!!!", toastpromise);
        setLoading(false);
        return;
      }

      let imgUrl = state?.img;

      if (fileImg && fileImg !== state?.img) {
        imgUrl = await UploadImg(fileImg);
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
        : axios.post(`${URL}/api/posts/`, postData, { withCredentials: true });

      //! notificación del post
      toast.promise(
        promise,
        {
          pending: "Subiendo Blog...",
          success: {
            render({ data }) {
              const responseData = JSON.parse(data.config.data);
              return `${responseData.title} subido exitosamente`;
            },
          },
          error: {
            render({ data }) {
              return `${data.message}`;
            },
          },
        },
        toastpromise // estilo
      );

      await promise;
      navigate("/");
    } catch (err) {
      toast.error(`Error al realizar la solicitud: ${err.message}`);
      console.log("Error al realizar la solicitud:", err);
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
          {/* Imagen principal (grande) */}
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
                <p>Sube tus imagenes Perra</p>
              </div>
            )}
          </div>

          {/* Labels para subir imágenes (4 en total) */}
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
          <Form>
            <Form.Group className="mb-3" controlId="formTitle">
              <Form.Label>Título</Form.Label>
              <Form.Control
                type="text"
                name="title"
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
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del producto"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formPrice">
              <Form.Label>Precio</Form.Label>
              <Form.Control
                className="w-2"
                type="text"
                name="precio"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="Precio"
              />
            </Form.Group>
            <Form.Label className="mb-3 d-flex justify-content-center align-items-center">
              Tallas
            </Form.Label>
            <Form.Group
              className="mb-3 d-flex flex-row justify-content-evenly align-items-center"
              controlId="formPrice"
            >
              <div className="d-flex flex-row fs-5 gap-3">
                <Form.Label>Oversizes:</Form.Label>
                <Form.Switch
                  type="switch"
                  name="overSize"
                  value={overSize}
                  onChange={(e) => setOverSze(!overSize)}
                  placeholder="Precio"
                />
              </div>
              <Form.Group className="mb-3 " controlId="formSize">
                <Form.Control
                  type="text"
                  name="size"
                  value={sizes[0]}
                  onChange={(e) => {
                    const newSizes = [...sizes];
                    newSizes[0] = e.target.value;
                    setSizes(newSizes);
                  }}
                  placeholder="S"
                />
                <Form.Control
                  type="text"
                  name="size"
                  value={sizes[1]}
                  onChange={(e) => {
                    const newSizes = [...sizes];
                    newSizes[1] = e.target.value;
                    setSizes(newSizes);
                  }}
                  placeholder="M"
                />
                <Form.Control
                  type="text"
                  name="size"
                  value={sizes[2]}
                  onChange={(e) => {
                    const newSizes = [...sizes];
                    newSizes[2] = e.target.value;
                    setSizes(newSizes);
                  }}
                  placeholder="L"
                />
              </Form.Group>
            </Form.Group>

            <Button variant="dark" type="submit">
              Agregar Producto
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default Editor;
