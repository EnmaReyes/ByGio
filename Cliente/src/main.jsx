import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthContextProvider } from "./context/authContext.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ContextProvaider } from "./context/ContextProvaider.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./index.css";
import "./estilos/tema.css";
import "./estilos/componentes.css";
import "./estilos/movimiento.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// El provider de Google solo se monta si hay client ID configurado;
// sin el, los botones sociales se ocultan y el resto de la app no cambia.
const AppTree = GOOGLE_CLIENT_ID
  ? ({ children }) => (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {children}
      </GoogleOAuthProvider>
    )
  : ({ children }) => <>{children}</>;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthContextProvider>
      <ContextProvaider>
        <AppTree>
          <App />
        </AppTree>
      </ContextProvaider>
    </AuthContextProvider>
  </StrictMode>,
);
