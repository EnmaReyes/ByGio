import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faSpinner,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { toast } from "react-toastify";
import { API_URL } from "../../config";
import { AuthContext } from "../../context/authContext";
import { getApiErrorMessage } from "../../Componentes/orderUtils";
import { NOTIFICACIONES_EVENT } from "../../Componentes/notificaciones";
import "./dashboard.css";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_NAME;
const PRESET = import.meta.env.VITE_CLOUDINARY_PRESET;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const uploadImageToCloudinary = async (file) => {
  if (!CLOUD_NAME || !PRESET) {
    throw new Error("Falta la configuración de imágenes.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", PRESET);

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    formData,
  );
  return response.data?.secure_url || "";
};

const Perfil = () => {
  const { currentUser, refreshUserData } = useContext(AuthContext);
  const inputFileRef = useRef(null);

  const [form, setForm] = useState({ name: "", lastName: "" });
  const [email, setEmail] = useState("");
  const [image, setImage] = useState(null);
  const [initial, setInitial] = useState({ name: "", lastName: "", image: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  const aplicar = useCallback((user) => {
    const datos = {
      name: user?.name || "",
      lastName: user?.lastName || "",
      image: user?.image || null,
    };
    setForm({ name: datos.name, lastName: datos.lastName });
    setImage(datos.image);
    setEmail(user?.email || "");
    setInitial(datos);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_URL}/api/user/edit`, {
        withCredentials: true,
      });
      aplicar(res.data);
    } catch (err) {
      setError(
        getApiErrorMessage(err, "No pudimos cargar tus datos. Intenta de nuevo."),
      );
    } finally {
      setLoading(false);
    }
  }, [aplicar]);

  useEffect(() => {
    window.scrollTo(0, 0);
    load();
  }, [load]);

  const dirty =
    form.name !== initial.name ||
    form.lastName !== initial.lastName ||
    (image || null) !== (initial.image || null);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("La imagen no debe superar 5 MB");
      return;
    }

    setSubiendo(true);
    try {
      const url = await uploadImageToCloudinary(file);
      if (!url) throw new Error("No se pudo subir la imagen");
      setImage(url);
      toast.success("Imagen lista. Guarda para aplicarla.");
    } catch (err) {
      toast.error(err.message || "No se pudo subir la imagen");
    } finally {
      setSubiendo(false);
    }
  };

  const guardar = async (event) => {
    event.preventDefault();

    if (form.name.trim().length < 2) {
      toast.error("Escribe tu nombre");
      return;
    }

    setSaving(true);
    try {
      await axios.put(
        `${API_URL}/api/user/edit`,
        {
          name: form.name.trim(),
          lastName: form.lastName.trim(),
          image,
        },
        { withCredentials: true },
      );

      await refreshUserData();
      setInitial({
        name: form.name.trim(),
        lastName: form.lastName.trim(),
        image: image || null,
      });
      window.dispatchEvent(new Event(NOTIFICACIONES_EVENT));
      toast.success("Datos actualizados");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "No pudimos guardar tus datos"));
    } finally {
      setSaving(false);
    }
  };

  const esAdmin = Boolean(currentUser?.admin);
  const nombreMostrado =
    [form.name, form.lastName].filter(Boolean).join(" ") ||
    currentUser?.username ||
    "Tu cuenta";

  if (loading) {
    return (
      <section className="panel-seccion-cabecera">
        <div className="checkout-loading">
          <span className="cargador" aria-hidden="true" />
          <p className="parrafos">Cargando tu perfil...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel-seccion-cabecera">
        <div className="estado">
          <h2 className="estado-titulo">No pudimos cargar tu perfil</h2>
          <p className="estado-texto">{error}</p>
          <button
            type="button"
            className="btn-tema btn-tema--contorno"
            onClick={load}
          >
            Reintentar
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel-seccion-cabecera">
      <header className="panel-titulo">
        <span className="etiqueta-seccion">Tu cuenta</span>
        <h1 className="panel-titulo-texto">Mi perfil</h1>
        <p className="texto-seccion">
          Actualiza tu nombre y tu foto. El correo y el rol se gestionan por
          seguridad y no se editan aquí.
        </p>
      </header>

      <Form onSubmit={guardar} className="perfil-grid">
        <section className="checkout-card perfil-foto-card">
          <div className="perfil-avatar">
            {image ? (
              <img src={image} alt="" />
            ) : (
              <span aria-hidden="true">{nombreMostrado.charAt(0)}</span>
            )}
            {subiendo && (
              <span className="perfil-avatar-cargando" aria-hidden="true">
                <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
              </span>
            )}
          </div>

          <input
            ref={inputFileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFile}
          />

          <div className="perfil-foto-acciones">
            <button
              type="button"
              className="btn-tema btn-tema--contorno btn-tema--pequeno"
              onClick={() => inputFileRef.current?.click()}
              disabled={subiendo}
            >
              <FontAwesomeIcon icon={faCamera} aria-hidden="true" />
              {image ? "Cambiar foto" : "Subir foto"}
            </button>

            {image && (
              <button
                type="button"
                className="btn-tema btn-tema--contorno btn-tema--pequeno perfil-quitar"
                onClick={() => setImage(null)}
                disabled={subiendo}
              >
                <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                Quitar
              </button>
            )}
          </div>
        </section>

        <section className="checkout-card">
          <h2 className="checkout-section-title titulos">Datos personales</h2>

          <div className="perfil-campos">
            <Form.Group controlId="perfilNombre">
              <Form.Label className="parrafos">Nombre</Form.Label>
              <Form.Control
                value={form.name}
                maxLength={150}
                autoComplete="given-name"
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </Form.Group>

            <Form.Group controlId="perfilApellido">
              <Form.Label className="parrafos">Apellido</Form.Label>
              <Form.Control
                value={form.lastName}
                maxLength={150}
                autoComplete="family-name"
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, lastName: event.target.value }))
                }
              />
            </Form.Group>

            <Form.Group controlId="perfilCorreo">
              <Form.Label className="parrafos">Correo</Form.Label>
              <Form.Control
                value={email || currentUser?.email || ""}
                readOnly
                disabled
              />
              <Form.Text className="parrafos">
                El correo se usa para iniciar sesión y no se puede cambiar aquí.
              </Form.Text>
            </Form.Group>

            <Form.Group controlId="perfilRol">
              <Form.Label className="parrafos">Rol</Form.Label>
              <div className="perfil-rol">
                <span className={`order-badge ${esAdmin ? "paid" : "pending"}`}>
                  {esAdmin ? "Administrador" : "Cliente"}
                </span>
              </div>
            </Form.Group>
          </div>

          <div className="perfil-acciones">
            <button
              type="submit"
              className="btn-tema btn-tema--primario"
              disabled={saving || subiendo || !dirty}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              type="button"
              className="btn-tema btn-tema--contorno"
              disabled={saving || !dirty}
              onClick={() => {
                setForm({ name: initial.name, lastName: initial.lastName });
                setImage(initial.image);
              }}
            >
              Descartar
            </button>
          </div>
        </section>
      </Form>
    </section>
  );
};

export default Perfil;
