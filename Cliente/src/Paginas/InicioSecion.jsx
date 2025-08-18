import React, { useContext, useState } from "react";
import { AuthContext } from "../context/authContext";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faUser,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import "../index.css";
import { API_URL } from "../config";
import { Button, Form } from "react-bootstrap";

const URL = API_URL;

const InicioSecion = () => {
  const [inputs, setInputs] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handlechange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handlesubmit = async (e) => {
    e.preventDefault();
    try {
      await login(inputs);
      navigate("/");
    } catch (err) {
      setError(err.response?.data);
    }
  };

  return (
    <div className="login-container ">
      <div className="mural-box">
        <h1 className="mural parrafos">BYGIO</h1>
      </div>

      <div className="login-card">
        {/* Logo */}
        <h1 className="bygiotext">ByGio</h1>
        <h4>Bienvenido</h4>

        {/* Username */}
        <div className="mb-3 input-wrapper parrafos">
          <FontAwesomeIcon icon={faUser} className="input-icon" />
          <Form.Control
            type="text"
            name="username"
            placeholder="Username"
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
            placeholder="Password"
            onChange={handlechange}
            className="input-field"
          />
          <FontAwesomeIcon
            icon={showPassword ? faEye : faEyeSlash}
            onClick={togglePasswordVisibility}
            className="toggle-password"
          />
        </div>

        {/* Error */}
        {error && <div className="error-message parrafos">{error}</div>}

        {/* Login Button */}
        <button onClick={handlesubmit} className="login-btn titulos">
          Iniciar Sesión
        </button>

        {/* Sign Up */}
        <p className="signup-text">
          Nuevo Usuario?{" "}
          <Link to="/register" className="signup-link parrafos">
            Registrate
          </Link>
        </p>
        <Link to="/" className="home-link parrafos">
          ir al inicio
        </Link>
      </div>
    </div>
  );
};

export default InicioSecion;
