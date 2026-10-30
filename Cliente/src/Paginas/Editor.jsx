import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImage,
  faPenToSquare,
  faPlus,
  faSpinner,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { API_URL } from "../config";
import useEnVista from "../hooks/useEnVista";

const BASE_URL = API_URL;
const preset_name = import.meta.env.VITE_CLOUDINARY_PRESET;
const cloud_name = import.meta.env.VITE_CLOUDINARY_NAME;

const MAX_IMAGENES = 4;

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

  const [overSize, setOverSize] = useState(state?.oversize ?? false);
  const [stock, setStock] = useState(state?.stock ?? true);
  const [loading, setLoading] = useState(false);
  const [destacadas, setDestacadas] = useState(state?.destacadas ?? false);
  const [combo, setCombo] = useState(state?.combo ?? false);
  const [precioCombo, setPrecioCombo] = useState(
    state?.precioCombo ?? "",
  );
  const [precioAnteriorCombo, setPrecioAnteriorCombo] = useState(
    state?.precioAnteriorCombo ?? "",
  );

  const esEdicion = Boolean(state);
  const totalImagenes = imgUrls.filter((url) => Boolean(url)).length;
  const imagenVista = imgUrls[selectedImageIndex] || "";

  // Rastrea las blob URLs activas para poder revocarlas y evitar memory leaks
  const blobUrlsRef = useRef(new Set());

  const [refContenido, contenidoEnVista] = useEnVista();

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
    // Permite volver a elegir el mismo archivo después de un error.
    e.target.value = "";
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

    if (!title || !description || !sizes.some((size) => size)) {
      toast.error("Falta información para subir el artículo!");
      return;
    }

    if (combo && !(Number(precioCombo) > 0)) {
      toast.error("Un artículo combo necesita un precio de combo.");
      return;
    }

    if (
      combo &&
      Number(precioAnteriorCombo) > 0 &&
      Number(precioAnteriorCombo) <= Number(precioCombo)
    ) {
      toast.error("El precio anterior del combo debe ser mayor al actual.");
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
        stock,
        destacadas,
        combo,
        ...(combo && {
          precioCombo: Number(precioCombo),
          precioAnteriorCombo:
            Number(precioAnteriorCombo) > 0
              ? Number(precioAnteriorCombo)
              : null,
        }),
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
    <section
      ref={refContenido}
      className={`editor-admin revelar${
        contenidoEnVista ? " is-visible" : ""
      }`}
      aria-labelledby="editor-admin-titulo"
    >
      <header
        className="editor-admin-cabecera revelar-linea"
        style={{ "--i": 0 }}
      >
        <div className="editor-admin-intro">
          <span className="etiqueta-seccion">Panel ByGio</span>
          <h1 className="editor-admin-titulo" id="editor-admin-titulo">
            {esEdicion ? "Editar producto" : "Nuevo producto"}
          </h1>
          <p className="editor-admin-texto">
            Completa la información y publica la prenda en el catálogo.
          </p>
        </div>

        <div className="editor-admin-meta">
          <span
            className="editor-admin-contador"
            data-completo={totalImagenes >= MAX_IMAGENES}
            aria-live="polite"
          >
            <FontAwesomeIcon icon={faImage} aria-hidden="true" />
            {totalImagenes} de {MAX_IMAGENES} imágenes
          </span>
        </div>
      </header>

      <div className="editor-admin-cuerpo">
        {/* Galería: vista previa + miniaturas */}
        <div
          className="editor-admin-media revelar-linea"
          style={{ "--i": 1 }}
        >
          <div className="editor-admin-lienzo" data-vacia={!imagenVista}>
            {imagenVista ? (
              <img
                key={imagenVista}
                className="editor-admin-imagen"
                src={imagenVista}
                alt={`Vista previa de la imagen ${selectedImageIndex + 1}`}
              />
            ) : (
              <div className="editor-admin-vacio">
                <span
                  className="editor-admin-vacio-icono"
                  aria-hidden="true"
                >
                  <FontAwesomeIcon icon={faImage} />
                </span>
                <p className="editor-admin-vacio-titulo">
                  Sube tus imágenes
                </p>
                <p className="editor-admin-vacio-texto">
                  JPG, PNG o WebP · hasta {MAX_IMAGENES} imágenes
                </p>
              </div>
            )}

            {imagenVista && (
              <label className="editor-admin-lienzo-subir">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleImageChange(e, selectedImageIndex)
                  }
                  disabled={loading}
                />
                <FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" />
                <span>Cambiar</span>
              </label>
            )}
          </div>

          <ul
            className="editor-admin-miniaturas"
            aria-label="Imágenes del producto"
          >
            {Array.from({ length: MAX_IMAGENES }).map((_, index) => {
              const url = imgUrls[index];
              const activa = Boolean(url) && index === selectedImageIndex;

              return (
                <li key={index}>
                  <div
                    className="editor-admin-miniatura"
                    data-activa={activa}
                    data-vacia={!url}
                  >
                    {url ? (
                      <button
                        type="button"
                        className="editor-admin-miniatura-seleccionar"
                        onClick={() => setSelectedImageIndex(index)}
                        aria-pressed={activa}
                        aria-label={`Ver imagen ${index + 1} en grande`}
                      >
                        <img
                          src={url}
                          alt={`Imagen ${index + 1}`}
                          loading="lazy"
                        />
                      </button>
                    ) : (
                      <label className="editor-admin-miniatura-agregar">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, index)}
                          disabled={loading}
                          aria-label={`Subir imagen ${index + 1}`}
                        />
                        <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
                        <span>Imagen {index + 1}</span>
                      </label>
                    )}

                    {url && (
                      <div className="editor-admin-miniatura-acciones">
                        <label
                          className="editor-admin-miniatura-reemplazar"
                          title="Cambiar imagen"
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, index)}
                            disabled={loading}
                            aria-label={`Cambiar imagen ${index + 1}`}
                          />
                          <FontAwesomeIcon
                            icon={faPenToSquare}
                            aria-hidden="true"
                          />
                        </label>

                        <button
                          type="button"
                          className="editor-admin-miniatura-eliminar"
                          onClick={() => deleteImgArticule(index)}
                          disabled={loading}
                          aria-label={`Eliminar imagen ${index + 1}`}
                        >
                          <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                        </button>
                      </div>
                    )}

                    {activa && (
                      <span className="editor-admin-miniatura-etiqueta">
                        En vista
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="editor-admin-pie-texto">
            La primera imagen abre la ficha del producto. Usa las demás para
            mostrar detalles y variantes.
          </p>
        </div>

        {/* Formulario */}
        <form
          className="editor-admin-form-panel revelar-linea"
          style={{ "--i": 2 }}
          onSubmit={handleClick}
          noValidate
        >
          <div className="editor-admin-grupo">
            <div className="editor-admin-grupo-cabecera">
              <h2 className="editor-admin-grupo-titulo">Información</h2>
              <p className="editor-admin-ayuda">
                El nombre y la descripción aparecen en el catálogo y en la
                ficha del producto.
              </p>
            </div>

            <div className="editor-admin-campo">
              <label
                className="editor-admin-campo-etiqueta"
                htmlFor="editor-admin-titulo-campo"
              >
                Título
              </label>
              <input
                id="editor-admin-titulo-campo"
                className="form-control"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título del producto"
                autoComplete="off"
                disabled={loading}
              />
            </div>

            <div className="editor-admin-campo">
              <label
                className="editor-admin-campo-etiqueta"
                htmlFor="editor-admin-descripcion"
              >
                Descripción
              </label>
              <textarea
                id="editor-admin-descripcion"
                className="form-control"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el material, el corte y los detalles de la prenda"
                disabled={loading}
              />
              <span className="editor-admin-contador-caracteres">
                {description.length} caracteres
              </span>
            </div>
          </div>

          <div className="editor-admin-grupo">
            <div className="editor-admin-grupo-cabecera">
              <h2 className="editor-admin-grupo-titulo">Precio</h2>
              <p className="editor-admin-ayuda">
                El precio base se configura una sola vez en{" "}
                <Link to="/admin/precios" className="enlace-seccion">
                  Precios globales
                </Link>
                . Aquí solo se define el precio propio si el artículo es combo.
              </p>
            </div>

            <div className="editor-admin-opciones">
              <label
                className="editor-admin-opcion"
                data-activa={combo}
              >
                <span className="editor-admin-opcion-texto">
                  <strong>Combo</strong>
                  <small>Precio propio por varias prendas</small>
                </span>
                <input
                  className="editor-admin-interruptor"
                  type="checkbox"
                  checked={combo}
                  onChange={() => setCombo(!combo)}
                  disabled={loading}
                />
              </label>

              <label
                className="editor-admin-opcion"
                data-activa={overSize}
              >
                <span className="editor-admin-opcion-texto">
                  <strong>Oversize</strong>
                  <small>Corte amplio</small>
                </span>
                <input
                  className="editor-admin-interruptor"
                  type="checkbox"
                  checked={overSize}
                  onChange={() => setOverSize(!overSize)}
                  disabled={loading}
                />
              </label>
            </div>

            {combo && (
              <div className="editor-admin-condicional">
                <div className="editor-admin-fila">
                  <div className="editor-admin-campo">
                    <label
                      className="editor-admin-campo-etiqueta"
                      htmlFor="editor-admin-precio-combo"
                    >
                      Precio del combo
                    </label>
                    <input
                      id="editor-admin-precio-combo"
                      className="form-control"
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={precioCombo}
                      onChange={(e) => setPrecioCombo(e.target.value)}
                      placeholder="Precio del combo"
                      disabled={loading}
                    />
                  </div>

                  <div className="editor-admin-campo">
                    <label
                      className="editor-admin-campo-etiqueta"
                      htmlFor="editor-admin-precio-anterior"
                    >
                      Precio anterior
                    </label>
                    <input
                      id="editor-admin-precio-anterior"
                      className="form-control"
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={precioAnteriorCombo}
                      onChange={(e) =>
                        setPrecioAnteriorCombo(e.target.value)
                      }
                      placeholder="Opcional"
                      disabled={loading}
                    />
                    <span className="editor-admin-contador-caracteres">
                      Opcional · se muestra tachado
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="editor-admin-grupo">
            <div className="editor-admin-grupo-cabecera">
              <h2 className="editor-admin-grupo-titulo">Catálogo</h2>
              <p className="editor-admin-ayuda">
                Controla cómo se muestra la prenda en la tienda.
              </p>
            </div>

            <div className="editor-admin-opciones">
              <label
                className="editor-admin-opcion"
                data-activa={stock}
              >
                <span className="editor-admin-opcion-texto">
                  <strong>Stock</strong>
                  <small>Disponible para comprar</small>
                </span>
                <input
                  className="editor-admin-interruptor"
                  type="checkbox"
                  checked={stock}
                  onChange={() => setStock(!stock)}
                  disabled={loading}
                />
              </label>

              <label
                className="editor-admin-opcion"
                data-activa={destacadas}
              >
                <span className="editor-admin-opcion-texto">
                  <strong>Destacadas</strong>
                  <small>Aparece en la portada</small>
                </span>
                <input
                  className="editor-admin-interruptor"
                  type="checkbox"
                  checked={destacadas}
                  onChange={() => setDestacadas(!destacadas)}
                  disabled={loading}
                />
              </label>
            </div>
          </div>

          <div className="editor-admin-grupo">
            <div className="editor-admin-grupo-cabecera">
              <h2 className="editor-admin-grupo-titulo">Tallas</h2>
              <p className="editor-admin-ayuda">
                Escribe cada talla y añade todas las que necesites.
              </p>
            </div>

            <div className="editor-admin-tallas">
              {sizes.map((size, index) => (
                <div className="editor-admin-talla" key={index}>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => {
                      const newSizes = [...sizes];
                      newSizes[index] = e.target.value.toUpperCase();
                      setSizes(newSizes);
                    }}
                    placeholder={`Talla ${index + 1}`}
                    aria-label={`Talla ${index + 1}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="editor-admin-talla-eliminar"
                    onClick={() => deleteSizeField(index)}
                    disabled={loading}
                    aria-label={`Eliminar talla ${index + 1}`}
                  >
                    <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="btn-tema btn-tema--contorno btn-tema--pequeno editor-admin-anadir-talla"
                onClick={addSizeField}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
                Talla
              </button>
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
              ) : esEdicion ? (
                "Actualizar artículo"
              ) : (
                "Crear artículo"
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

export default Editor;
