import React, { useState } from "react";
import {Link, useNavigate } from "react-router-dom";
import "../index.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faUser,
  faLock,
  faEnvelope,
  faKey,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { API_URL } from "../config";
import { Button, Form} from "react-bootstrap";

const URL = API_URL;

const Registro = () => {
  const [inputs, setInputs] = useState({
    email: "",
    username: "",
    password: "",
    checkPass: "",
  });
  const [checkPass, setCheckPass] = useState("");
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handlechange = (e) => {
    const { name, value } = e.target;
    if (name === "checkPass") {
      setCheckPass(value);
    }
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handlesubmit = async (e) => {
    e.preventDefault();

    if (!inputs.email || !inputs.password || !inputs.username || !checkPass) {
      setError("Complete todos los campos.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputs.email)) {
      setError("Ingrese un correo válido.");
      return;
    }

    if (inputs.password.length < 6) {
      setError("Incluya al menos 6 caracteres en la contraseña.");
      return;
    }

    if (inputs.password !== checkPass) {
      setError("Las contraseñas no coinciden ⚠");
      return;
    }

    try {
      await axios.post(`${URL}/api/auth/register`, inputs);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data || "Error en el registro");
    }
  };

  return (
    <div className="login-container">
      {/* Mural animado */}
      <div className="mural-box">
        <h1 className="mural parrafos">BYGIO</h1>
      </div>

      <div className="login-card">
        <h1 className="bygiotext">ByGio</h1>
        <h4>Crea tu cuenta</h4>

        {/* Username */}
        <div className="mb-3 input-wrapper parrafos">
          <FontAwesomeIcon icon={faUser} className="input-icon" />
          <Form.Control
            type="text"
            name="username"
            placeholder="Nombre de usuario"
            onChange={handlechange}
            className="input-field"
          />
        </div>

        {/* Email */}
        <div className="mb-3 input-wrapper parrafos">
          <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
          <Form.Control
            type="email"
            name="email"
            placeholder="Correo electrónico"
            onChange={handlechange}
            className="input-field"
          />
        </div>

        {/* Password */}
        <div className="mb-3 input-wrapper parrafos">
          <FontAwesomeIcon icon={faLock} className="input-icon" />
          <Form.Control
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Contraseña"
            onChange={handlechange}
            className="input-field"
          />
          <FontAwesomeIcon
            icon={showPassword ? faEye : faEyeSlash}
            onClick={togglePasswordVisibility}
            className="toggle-password"
          />
        </div>

        {/* Confirm Password */}
        <div className="mb-3 input-wrapper parrafos">
          <FontAwesomeIcon icon={faKey} className="input-icon" />
          <Form.Control
            type={showPassword ? "text" : "password"}
            name="checkPass"
            placeholder="Confirmar contraseña"
            value={checkPass}
            onChange={handlechange}
            className="input-field"
          />
        </div>

        {/* Error */}
        {error && <div className="error-message parrafos">{error}</div>}

        {/* Register Button */}
        <button onClick={handlesubmit} className="login-btn titulos">
          Registrar
        </button>

        {/* Login Link */}
        <p className="signup-text parrafos">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="signup-link titulos">
            Inicia sesión
          </Link>
        </p>
          <Link to="/" className="home-link parrafos">
            ir al inicio
          </Link>
      </div>
    </div>
  );
};

export default Registro;
