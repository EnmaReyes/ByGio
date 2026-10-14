import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook } from "@fortawesome/free-brands-svg-icons";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from "../context/authContext";
import { requestFacebookAccessToken } from "../facebookSdk";
import { API_URL } from "../config";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;

// Botones "Continuar con Google/Facebook". Solo se renderizan si hay IDs
// configurados. El backend valida cada credencial antes de crear la sesion.
const SocialAuthButtons = ({ onError }) => {
  const { loginWithSocial } = useContext(AuthContext);
  const [loadingFacebook, setLoadingFacebook] = useState(false);
  const navigate = useNavigate();

  const resolveError = (err, fallback) =>
    err.response?.data?.message || err.response?.data || fallback;

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(
        `${API_URL}/api/auth/google`,
        { credential: credentialResponse.credential },
        { withCredentials: true },
      );
      loginWithSocial(res.data);
      navigate("/");
    } catch (err) {
      onError?.(resolveError(err, "No se pudo iniciar sesión con Google"));
    }
  };

  const handleFacebook = async () => {
    setLoadingFacebook(true);
    try {
      const accessToken = await requestFacebookAccessToken();
      const res = await axios.post(
        `${API_URL}/api/auth/facebook`,
        { accessToken },
        { withCredentials: true },
      );
      loginWithSocial(res.data);
      navigate("/");
    } catch (err) {
      onError?.(
        err.response
          ? resolveError(err, "No se pudo iniciar sesión con Facebook")
          : err.message,
      );
    } finally {
      setLoadingFacebook(false);
    }
  };

  if (!GOOGLE_CLIENT_ID && !FACEBOOK_APP_ID) return null;

  return (
    <div className="d-flex flex-column align-items-center gap-3 mt-3 w-100">
      <div className="d-flex align-items-center w-100 gap-2">
        <hr className="flex-grow-1 m-0" />
        <span className="small text-body-secondary">o continúa con</span>
        <hr className="flex-grow-1 m-0" />
      </div>

      {GOOGLE_CLIENT_ID && (
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => onError?.("Google canceló o falló el inicio de sesión")}
          locale="es"
          shape="pill"
          text="continue_with"
          width="300"
        />
      )}

      {FACEBOOK_APP_ID && (
        <button
          type="button"
          className="btn btn-primary w-100"
          style={{ maxWidth: "300px", backgroundColor: "#1877F2", border: "none" }}
          onClick={handleFacebook}
          disabled={loadingFacebook}
        >
          {loadingFacebook ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className="me-2 fa-spin" />
              Conectando...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faFacebook} className="me-2" />
              Continuar con Facebook
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default SocialAuthButtons;
