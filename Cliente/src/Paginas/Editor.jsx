import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_URL } from "../config";
import { Col, Container, Row, Button, Form } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faImage, faPlus } from "@fortawesome/free-solid-svg-icons";
import Spinner from "react-bootstrap/Spinner";

const BASE_URL = API_URL;
const preset_name = import.meta.env.VITE_CLOUDINARY_PRESET;
const cloud_name = import.meta.env.VITE_CLOUDINARY_NAME;

// Mismo helper que en el Context, para no romper si el JSON viene malformado
const parseJsonValue = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const Editor = () => {
  const navigate = useNavigate();
  const state = useLocation().state;

  const [title, setTitle] = useState(state?.title || "");
  const [description, setDescription] = useState(state?.desc || "");

  const parsedImg = parseJsonValue(state?.img);
  const [imgUrls, setImgUrls] = useState(
    Array.isArray(parsedImg) ? parsedImg : ["", "", "", ""],
  );
  // Guarda los File reales seleccionados por el usuario, paralelo a imgUrls.
  // Si la posición i es null, significa "sin cambios" (se mantiene la URL existente).
  const [imgFiles, setImgFiles] = useState([null, null, null, null]);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const parsedSizes = parseJsonValue(state?.sizes);
  const [sizes, setSizes] = useState(
    Array.isArray(parsedSizes) ? parsedSizes : ["S", "M", "L"],
  );

  const [overSize, setOverSize] = useState(state?.overSize ?? false);
  const [stock, setStock] = useState(state?.stock ?? true);
  const [cost, setCost] = useState(state?.cost || "");
  const [descuento, setDescuento] = useState(state?.descuento ?? 0);
  const [loading, setLoading] = useState(false);
  const [destacadas, setDestacadas] = useState(state?.destacadas ?? false);

  // Rastrea las blob URLs activas para poder revocarlas y evitar memory leaks
  const blobUrlsRef = useRef(new Set());

  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadImageToCloudinary = async (file) => {
    if (!preset_name || !cloud_name) {
      // Falla rápido y con un mensaje claro en vez de dejar que Cloudinary
      // devuelva un 404 críptico por una URL armada con "undefined".
      throw new Error(
        "Faltan las variables de entorno VITE_CLOUDINARY_PRESET / VITE_CLOUDINARY_NAME.",
      );
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset_name);
    formData.append("cloud_name", cloud_name);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        formData,
      );
      return response.data.secure_url;
    } catch (error) {
      // Log detallado: Cloudinary suele devolver el motivo real en error.response.data
      console.error(
        "Error subiendo imagen a Cloudinary:",
        error.response?.data || error.message,
      );
      throw error;
    }
  };

  const handleImageChange = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    // Si esa posición ya tenía una blob URL propia, la liberamos antes de reemplazarla
    const previous = imgUrls[index];
    if (previous?.startsWith("blob:")) {
      URL.revokeObjectURL(previous);
      blobUrlsRef.current.delete(previous);
    }

    const localPreview = URL.createObjectURL(file);
    blobUrlsRef.current.add(localPreview);

    const newImgUrls = [...imgUrls];
    newImgUrls[index] = localPreview;
    setImgUrls(newImgUrls);

    const newImgFiles = [...imgFiles];
    newImgFiles[index] = file;
    setImgFiles(newImgFiles);

    setSelectedImageIndex(index);
  };

  const addSizeField = () => setSizes([...sizes, ""]);

  const deleteSizeField = (index) =>
    setSizes(sizes.filter((_, i) => i !== index));

  const deleteImgArticule = (index) => {
    const url = imgUrls[index];
    if (url?.startsWith("blob:")) {
      URL.revokeObjectURL(url);
      blobUrlsRef.current.delete(url);
    }

    const newImgUrls = imgUrls.filter((_, i) => i !== index);
    const newImgFiles = imgFiles.filter((_, i) => i !== index);
    setImgUrls(newImgUrls);
    setImgFiles(newImgFiles);

    // Si borramos la imagen seleccionada (o una anterior a ella), reajustamos el índice
    setSelectedImageIndex((current) => {
      if (index === current) return 0;
      if (index < current) return current - 1;
      return current;
    });
  };

  const handleClick = async (e) => {
    e.preventDefault();

    if (!title || !description || !cost || !sizes.some((size) => size)) {
      toast.error("Falta información para subir el artículo!");
      return;
    }

    setLoading(true);

    try {
      // Subir solo las imágenes que son File nuevos; mantener el resto tal cual
      const uploadedUrls = await Promise.all(
        imgUrls.map(async (url, index) => {
          const file = imgFiles[index];
          if (file) {
            return await uploadImageToCloudinary(file);
          }
          return url || null;
        }),
      );

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
        descuento,
        destacadas,
      };

      const promise = state
        ? axios.put(`${BASE_URL}/api/posts/${state.id}`, postData, {
            withCredentials: true,
          })
        : axios.post(`${BASE_URL}/api/posts/add`, postData, {
            withCredentials: true,
          });

      // toast.promise ya maneja pending/success/error por sí solo;
      // no volvemos a mostrar un toast.error manual sobre el mismo promise,
      // así evitamos el doble toast en caso de fallo.
      await toast.promise(promise, {
        pending: "Subiendo artículo...",
        success: `${title} subido exitosamente`,
        error: "Error al subir el artículo",
      });

      navigate("/");
    } catch (err) {
      console.error("Error al realizar la solicitud:", err);
      // Si fue un fallo de Cloudinary (no del toast.promise del backend),
      // mostramos el detalle para no quedarnos solo con un 404 genérico.
      if (
        !axios.isAxiosError(err) ||
        !err.config?.url?.includes("/api/posts")
      ) {
        toast.error(err.message || "Error al subir las imágenes");
      }
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
            {imgUrls[selectedImageIndex] ? (
              <img
                src={imgUrls[selectedImageIndex]}
                alt="Imagen seleccionada"
                style={{ width: "100%", maxWidth: "400px" }}
              />
            ) : (
              <div
                style={{ width: "100%", height: "auto", fontSize: "20px" }}
                className="d-flex flex-column align-items-center gap-2 p-md-5 parrafos"
              >
                <FontAwesomeIcon icon={faImage} className="fs-1" />
                <p>Sube tus imágenes</p>
              </div>
            )}
          </div>

          {/* Subir imágenes (4 en total) */}
          <div className="thumbnail-images d-flex flex-column">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className="d-flex align-items-center justifyContent-center"
              >
                <label className="mb-2" style={{ cursor: "pointer" }}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleImageChange(e, index)}
                  />
                  {imgUrls[index] ? (
                    <img
                      className="add-img"
                      src={imgUrls[index]}
                      alt={`Imagen ${index + 1}`}
                      style={{
                        width: "60px",
                        height: "60px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div className="add-hover">
                      <FontAwesomeIcon icon={faPlus} />
                    </div>
                  )}
                </label>

                {imgUrls[index] && (
                  <div
                    className=" d-flex text-center align-items-center justify-content-center deleteimg"
                    onClick={() => deleteImgArticule(index)}
                  >
                    x
                  </div>
                )}
                {imgUrls[index] && (
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
        <Col xs={12} md={6} className="p-md-5">
          <Form className=" align-items-center justify-content-center">
            <Form.Group className="mb-3" controlId="formTitle">
              <Form.Label className="titulos">Titulo</Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título del producto"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formDescription">
              <Form.Label className="titulos">Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del producto"
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="formPrice">
                  <Form.Label className="titulos">Precio</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="Precio"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3" controlId="formDescuento">
                  <Form.Label className="titulos">Precio anterior</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={descuento}
                    onChange={(e) => setDescuento(e.target.value)}
                    placeholder="Descuento"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group
              className="d-flex align-items-center justifyContent-center mb-3 gap-3"
              controlId="formStock"
            >
              <Form.Label className="d-flex align-items-center titulos">
                Stock
              </Form.Label>
              <Form.Switch
                className="fs-5"
                checked={stock}
                onChange={() => setStock(!stock)}
              />
              <Form.Label className="d-flex align-items-center titulos">
                Destacadas
              </Form.Label>
              <Form.Switch
                className="fs-5"
                checked={destacadas}
                onChange={() => setDestacadas(!destacadas)}
              />
            </Form.Group>

            <Form.Group className="d-flex align-items-center mb-3 gap-3">
              <Form.Label className="titulos">Oversize</Form.Label>
              <Form.Switch
                className="fs-5"
                checked={overSize}
                onChange={() => setOverSize(!overSize)}
              />
            </Form.Group>
            <Form.Label className="mb-3 d-flex justify-content-center align-items-center titulos">
              Tallas
            </Form.Label>
            <div className="mb-3 d-flex flex-column justify-content-center align-items-center">
              <Form.Group className="d-flex flex-row align-items-center justify-content-center gap-2">
                {sizes.map((size, index) => (
                  <div key={index} className="d-flex align-items-center gap-2">
                    <Form.Control
                      className="text-center parrafos"
                      style={{ width: "50px" }}
                      type="text"
                      value={size}
                      onChange={(e) => {
                        const newSizes = [...sizes];
                        newSizes[index] = e.target.value.toUpperCase();
                        setSizes(newSizes);
                      }}
                      placeholder={size}
                    />
                    <div
                      className=" d-flex text-center align-items-center justify-content-center deletesizes"
                      onClick={() => deleteSizeField(index)}
                    >
                      x
                    </div>
                  </div>
                ))}
              </Form.Group>

              <Button
                className="mt-3 parrafos"
                variant="dark"
                size="sm"
                onClick={addSizeField}
              >
                + Talla
              </Button>
            </div>

            <Button
              className="w-100 mt-3 titulos"
              variant="dark"
              disabled={loading}
              size="lg"
              onClick={handleClick}
            >
              {loading ? (
                <>
                  <Spinner
                    className="mx-2 "
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                  Loading
                </>
              ) : state ? (
                "Actualizar Articulo"
              ) : (
                "Crear Articulo"
              )}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default Editor;
