import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { toast } from "react-toastify";
import Spinner from "react-bootstrap/Spinner";
import { useContextProvaider } from "../../context/ContextProvaider";
import Categories from "../../Componentes/Categories/Categories";
import AddCategory from "../../Componentes/Categories/AddCategory.jsx";

const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET_DTF;
const CLOUDINARY_NAME = import.meta.env.VITE_CLOUDINARY_NAME;

const isValidPng = (file) => {
  if (!file) return false;

  const isPngType = file.type === "image/png";

  const isPngExtension = file.name.toLowerCase().endsWith(".png");

  return isPngType && isPngExtension;
};

/*
 * ==========================================
 * SANITIZAR NOMBRE DE CARPETA
 * ==========================================
 *
 * Evita caracteres problemáticos en el nombre
 * de la carpeta de Cloudinary.
 */

const sanitizeFolderName = (name) => {
  return name
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

/*
 * ==========================================
 * COMPONENTE
 * ==========================================
 */

const UploadDTF = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /*
   * Cuando editamos un DTF, React Router
   * nos entrega el objeto mediante state.
   */

  const editingDtf = location.state;

  /*
   * ==========================================
   * CONTEXT
   * ==========================================
   */

  const { saveDtf, categories } = useContextProvaider();

  /*
   * ==========================================
   * STATES
   * ==========================================
   */

  const [openAddCategoryModal, setOpenAddCategoryModal] = useState(false);

  const [category, setCategory] = useState(
    editingDtf?.categoryId || editingDtf?.category?.id || "",
  );

  const [img, setImg] = useState(editingDtf?.img || "");

  const [imgFile, setImgFile] = useState(null);

  const [stock, setStock] = useState(editingDtf?.stock ?? true);

  const [loading, setLoading] = useState(false);

  /*
   * Guarda la última blob URL para evitar
   * memory leaks.
   */

  const blobUrlRef = useRef(null);

  /*
   * ==========================================
   * CATEGORÍA SELECCIONADA
   * ==========================================
   */

  const selectedCategory = categories?.find((item) => item.id === category);

  /*
   * ==========================================
   * LIMPIAR BLOB URL
   * ==========================================
   */

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  /*
   * ==========================================
   * CLOUDINARY
   * ==========================================
   */

  const uploadImageToCloudinary = async (file, categoryName) => {
    if (!file) {
      throw new Error("No se proporcionó ninguna imagen.");
    }

    /*
     * ======================================
     * VALIDAR PNG
     * ======================================
     */

    if (!isValidPng(file)) {
      throw new Error("Solo se permiten imágenes en formato PNG.");
    }

    /*
     * ======================================
     * VALIDAR CATEGORÍA
     * ======================================
     */

    if (!categoryName) {
      throw new Error("No se encontró el nombre de la categoría.");
    }

    /*
     * ======================================
     * VALIDAR CLOUDINARY
     * ======================================
     */

    if (!CLOUDINARY_PRESET || !CLOUDINARY_NAME) {
      throw new Error("La configuración de Cloudinary no está disponible.");
    }

    /*
     * ======================================
     * SANITIZAR CATEGORÍA
     * ======================================
     */

    const folderName = sanitizeFolderName(categoryName);

    if (!folderName) {
      throw new Error(
        "El nombre de la categoría no es válido para crear la carpeta.",
      );
    }

    /*
     * ======================================
     * CARPETA DTF
     * ======================================
     *
     * Ejemplo:
     *
     * DTF/Anime
     * DTF/Navideno
     * DTF/Halloween
     */

    const dtfFolder = `DTF/${folderName}`;

    /*
     * ======================================
     * FORMDATA
     * ======================================
     */

    const formData = new FormData();

    formData.append("file", file);

    formData.append("upload_preset", CLOUDINARY_PRESET);

    formData.append("cloud_name", CLOUDINARY_NAME);

    /*
     * ======================================
     * CARPETA CLOUDINARY
     * ======================================
     *
     * folder:
     * Ubicación del recurso.
     *
     * asset_folder:
     * Ubicación organizativa del asset.
     */

    formData.append("folder", dtfFolder);

    formData.append("asset_folder", dtfFolder);

    /*
     * ======================================
     * SUBIR IMAGEN
     * ======================================
     */

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_NAME}/image/upload`,
      formData,
    );

    /*
     * ======================================
     * VALIDAR RESPUESTA
     * ======================================
     */

    if (!response.data?.secure_url) {
      throw new Error("Cloudinary no devolvió la URL de la imagen.");
    }

    /*
     * ======================================
     * DEBUG
     * ======================================
     *
     * Puedes revisar en consola dónde
     * terminó realmente el archivo.
     */

    console.log("DTF subido a Cloudinary:", {
      folder: response.data.folder,
      asset_folder: response.data.asset_folder,
      public_id: response.data.public_id,
      secure_url: response.data.secure_url,
    });

    return response.data.secure_url;
  };

  /*
   * ==========================================
   * CAMBIAR IMAGEN
   * ==========================================
   */

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    /*
     * ======================================
     * VALIDAR PNG
     * ======================================
     */

    if (!isValidPng(file)) {
      toast.error("Solo se permiten imágenes en formato PNG.");

      event.target.value = "";

      return;
    }

    /*
     * ======================================
     * LIBERAR BLOB ANTERIOR
     * ======================================
     */

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);

      blobUrlRef.current = null;
    }

    /*
     * ======================================
     * CREAR PREVIEW
     * ======================================
     */

    const previewUrl = URL.createObjectURL(file);

    blobUrlRef.current = previewUrl;

    setImg(previewUrl);
    setImgFile(file);
  };

  /*
   * ==========================================
   * ELIMINAR IMAGEN
   * ==========================================
   */

  const handleRemoveImage = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);

      blobUrlRef.current = null;
    }

    setImg("");
    setImgFile(null);

    /*
     * Limpiar el input file para permitir
     * seleccionar nuevamente el mismo archivo.
     */

    const input = document.getElementById("dtf-image");

    if (input) {
      input.value = "";
    }
  };

  /*
   * ==========================================
   * VALIDACIÓN
   * ==========================================
   */

  const validateForm = () => {
    /*
     * ======================================
     * VALIDAR CATEGORÍA
     * ======================================
     */

    if (!category) {
      toast.error("Debes seleccionar una categoría.");

      return false;
    }

    /*
     * Verificar que la categoría realmente
     * exista en el contexto.
     */

    if (!selectedCategory) {
      toast.error("La categoría seleccionada no existe.");

      return false;
    }

    /*
     * ======================================
     * VALIDAR IMAGEN
     * ======================================
     */

    if (!img) {
      toast.error("Debes incluir una imagen PNG.");

      return false;
    }

    /*
     * ======================================
     * VALIDAR ARCHIVO PNG
     * ======================================
     *
     * Solo se ejecuta cuando el usuario
     * seleccionó una nueva imagen.
     *
     * En modo edición puede existir una URL
     * previamente almacenada.
     */

    if (imgFile && !isValidPng(imgFile)) {
      toast.error("La imagen del DTF debe estar en formato PNG.");

      return false;
    }

    return true;
  };

  /*
   * ==========================================
   * SUBMIT
   * ==========================================
   */

  const handleSubmit = async (event) => {
    event.preventDefault();

    /*
     * ======================================
     * VALIDAR FORMULARIO
     * ======================================
     */

    if (!validateForm()) return;

    setLoading(true);

    try {
      /*
       * ======================================
       * IMAGEN
       * ======================================
       *
       * Si seleccionó una imagen nueva,
       * se sube a:
       *
       * DTF/CATEGORIA
       *
       * Si estamos editando y no cambió
       * la imagen, conservamos la URL actual.
       */

      let imageUrl = img;

      if (imgFile) {
        imageUrl = await uploadImageToCloudinary(
          imgFile,
          selectedCategory.name,
        );
      }

      /*
       * ======================================
       * PAYLOAD
       * ======================================
       *
       * Solo enviamos los datos que actualmente
       * utiliza el DTF.
       */

      const payload = {
        categoryId: category,

        img: imageUrl,

        stock,
      };

      /*
       * ======================================
       * GUARDAR
       * ======================================
       */

      await toast.promise(saveDtf(payload, editingDtf?.id), {
        pending: editingDtf ? "Actualizando DTF..." : "Subiendo DTF...",

        success: editingDtf ? "DTF actualizado" : "DTF creado exitosamente",

        error: "Error al guardar el DTF",
      });

      navigate("/");
    } catch (error) {
      console.error("Error al guardar el DTF:", error);

      toast.error(error.message || "Ocurrió un error al guardar el DTF.");
    } finally {
      setLoading(false);
    }
  };

  /*
   * ==========================================
   * RENDER
   * ==========================================
   */

  return (
    <Container className="mb-4 dtf-editor" style={{ paddingTop: "90px" }}>
      {openAddCategoryModal && (
        <AddCategory
          show={openAddCategoryModal}
          onHide={() => setOpenAddCategoryModal(false)}
        />
      )}

      <Row>
        {/* ==================================
            IMAGEN
        ================================== */}

        <Col xs={12} md={6} className="d-flex justify-content-center p-2">
          <div className="dtf-image-preview">
            {img ? (
              <>
                <img src={img} alt="Vista previa del DTF" />

                <button
                  type="button"
                  className="dtf-remove-image"
                  onClick={handleRemoveImage}
                  aria-label="Eliminar imagen"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </>
            ) : (
              <div className="dtf-empty-image parrafos">
                <FontAwesomeIcon icon={faImage} className="fs-1" />

                <span>Sube la imagen del DTF</span>
              </div>
            )}

            <label className="dtf-upload-button" htmlFor="dtf-image">
              <FontAwesomeIcon icon={faPlus} />

              <span>{img ? "Cambiar imagen" : "Seleccionar imagen"}</span>
            </label>

            <input
              id="dtf-image"
              type="file"
              accept=".png,image/png"
              onChange={handleImageChange}
              hidden
            />
          </div>
        </Col>

        {/* ==================================
            FORMULARIO
        ================================== */}

        <Col xs={12} md={6} className="p-md-5">
          <Form onSubmit={handleSubmit}>
            {/* ==============================
                CATEGORÍA
            ============================== */}

            <Form.Group className="mb-4" controlId="dtfCategory">
              <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                <Form.Label className="titulos mb-0">Categoría</Form.Label>

                <Button
                  type="button"
                  variant="outline-dark"
                  size="sm"
                  className="dtf-add-category-btn"
                  onClick={() => setOpenAddCategoryModal(true)}
                  aria-label="Agregar nueva categoría"
                >
                  <FontAwesomeIcon icon={faPlus} className="me-1" />
                  Categoría
                </Button>
              </div>

              <Categories
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              />

              {!category && (
                <Form.Text className="text-muted">
                  Selecciona la categoría del diseño.
                </Form.Text>
              )}
            </Form.Group>

            {/* ==============================
                STOCK
            ============================== */}

            <Form.Group className="mb-4" controlId="dtfStock">
              <Form.Label className="titulos">Stock</Form.Label>

              <Form.Check
                type="switch"
                checked={stock}
                onChange={(event) => setStock(event.target.checked)}
                label={stock ? "Disponible" : "Agotado"}
              />
            </Form.Group>

            {/* ==============================
                GUARDAR
            ============================== */}

            <Button
              className="w-100 titulos mt-2"
              variant="dark"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner
                    className="me-2"
                    as="span"
                    animation="border"
                    size="sm"
                    aria-hidden="true"
                  />
                  Guardando...
                </>
              ) : editingDtf ? (
                "Actualizar DTF"
              ) : (
                "Crear DTF"
              )}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default UploadDTF;
