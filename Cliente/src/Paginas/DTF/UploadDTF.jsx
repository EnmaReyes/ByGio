import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImage,
  faPlus,
  faSpinner,
  faTrash,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { toast } from "react-toastify";
import { useContextProvaider } from "../../context/ContextProvaider";
import Categories from "../../Componentes/Categories/Categories";
import AddCategory from "../../Componentes/Categories/AddCategory.jsx";
import useEnVista from "../../hooks/useEnVista";

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

  const [refContenido, contenidoEnVista] = useEnVista();

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

    // Permite volver a elegir el mismo archivo después de un error.
    event.target.value = "";
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
    <section
      ref={refContenido}
      className={`editor-admin revelar${
        contenidoEnVista ? " is-visible" : ""
      }`}
      aria-labelledby="dtf-editor-titulo"
    >
      <header
        className="editor-admin-cabecera revelar-linea"
        style={{ "--i": 0 }}
      >
        <div className="editor-admin-intro">
          <span className="etiqueta-seccion">Panel ByGio</span>
          <h1 className="editor-admin-titulo" id="dtf-editor-titulo">
            {editingDtf ? "Editar diseño DTF" : "Nuevo diseño DTF"}
          </h1>
          <p className="editor-admin-texto">
            Sube el diseño, asígnalo a una categoría y publícalo en el
            catálogo.
          </p>
        </div>

        <div className="editor-admin-meta">
          <span
            className="editor-admin-contador"
            data-completo={Boolean(selectedCategory)}
            aria-live="polite"
          >
            <FontAwesomeIcon icon={faImage} aria-hidden="true" />
            {selectedCategory ? selectedCategory.name : "Sin categoría"}
          </span>
        </div>
      </header>

      {openAddCategoryModal && (
        <AddCategory
          show={openAddCategoryModal}
          onHide={() => setOpenAddCategoryModal(false)}
        />
      )}

      <div className="editor-admin-cuerpo">
        {/* ==================================
            IMAGEN
        ================================== */}
        <div
          className="editor-admin-media revelar-linea"
          style={{ "--i": 1 }}
        >
          <div
            className="editor-admin-lienzo editor-admin-lienzo--dtf"
            data-vacia={!img}
          >
            {img ? (
              <>
                <img
                  key={img}
                  className="editor-admin-imagen editor-admin-imagen--contener"
                  src={img}
                  alt="Vista previa del DTF"
                />

                <button
                  type="button"
                  className="editor-admin-lienzo-eliminar"
                  onClick={handleRemoveImage}
                  disabled={loading}
                  aria-label="Eliminar imagen"
                >
                  <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                </button>
              </>
            ) : (
              <div className="editor-admin-vacio">
                <span
                  className="editor-admin-vacio-icono"
                  aria-hidden="true"
                >
                  <FontAwesomeIcon icon={faImage} />
                </span>
                <p className="editor-admin-vacio-titulo">
                  Sube la imagen del DTF
                </p>
                <p className="editor-admin-vacio-texto">
                  Solo PNG con fondo transparente
                </p>
              </div>
            )}

            <label className="editor-admin-lienzo-subir">
              <input
                id="dtf-image"
                type="file"
                accept=".png,image/png"
                onChange={handleImageChange}
                disabled={loading}
              />
              <FontAwesomeIcon icon={faUpload} aria-hidden="true" />
              <span>{img ? "Cambiar imagen" : "Seleccionar imagen"}</span>
            </label>
          </div>

          <p className="editor-admin-pie-texto">
            El archivo se guarda en la carpeta de la categoría (
            {selectedCategory ? `DTF/${selectedCategory.name}` : "DTF/…"}).
          </p>
        </div>

        {/* ==================================
            FORMULARIO
        ================================== */}
        <form
          className="editor-admin-form-panel revelar-linea"
          style={{ "--i": 2 }}
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="editor-admin-grupo">
            <div className="editor-admin-grupo-cabecera">
              <h2 className="editor-admin-grupo-titulo">Categoría</h2>
              <p className="editor-admin-ayuda">
                Cada diseño se organiza en una carpeta con el nombre de su
                categoría.
              </p>
            </div>

            <div className="editor-admin-campo">
              <label
                className="editor-admin-campo-etiqueta"
                htmlFor="dtf-categoria"
              >
                Categoría del diseño
              </label>

              <div className="editor-admin-select-fila">
                <Categories
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                />

                <button
                  type="button"
                  className="btn-tema btn-tema--contorno btn-tema--pequeno"
                  onClick={() => setOpenAddCategoryModal(true)}
                  disabled={loading}
                  aria-label="Agregar nueva categoría"
                >
                  <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
                  Nueva
                </button>
              </div>

              {!category && (
                <span className="editor-admin-ayuda">
                  Selecciona la categoría del diseño.
                </span>
              )}
            </div>
          </div>

          <div className="editor-admin-grupo">
            <div className="editor-admin-grupo-cabecera">
              <h2 className="editor-admin-grupo-titulo">Catálogo</h2>
              <p className="editor-admin-ayuda">
                Controla cómo se muestra el diseño en la tienda.
              </p>
            </div>

            <div className="editor-admin-opciones editor-admin-opciones--sola">
              <label className="editor-admin-opcion" data-activa={stock}>
                <span className="editor-admin-opcion-texto">
                  <strong>Stock</strong>
                  <small>
                    {stock ? "Disponible para comprar" : "Agotado"}
                  </small>
                </span>
                <input
                  className="editor-admin-interruptor"
                  type="checkbox"
                  checked={stock}
                  onChange={(event) => setStock(event.target.checked)}
                  disabled={loading}
                />
              </label>
            </div>
          </div>

          <div className="editor-admin-acciones">
            <button
              type="submit"
              className="btn-tema btn-tema--primario"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="fa-spin"
                    aria-hidden="true"
                  />
                  Guardando…
                </>
              ) : editingDtf ? (
                "Actualizar DTF"
              ) : (
                "Crear DTF"
              )}
            </button>

            <p className="editor-admin-nota">
              Los cambios se publican al guardar.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
};

export default UploadDTF;
