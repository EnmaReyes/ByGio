import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faUser,
  faLock,
  faCheckCircle,
  faExclamationCircle,
  faSpinner,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import "../index.css";
import { API_URL } from "../config";
import { Form } from "react-bootstrap";

const URL = API_URL;

// =========================================
// InputField - Extracted outside to prevent remounting on every keystroke
// =========================================
const InputField = React.memo(
  ({
    label,
    name,
    type,
    placeholder,
    icon,
    showToggle,
    onToggle,
    autoComplete,
    inputMode,
    value,
    onChange,
    onBlur,
    error,
    hasError,
    isValid,
    describedBy,
    disabled,
    showPassword,
    isSubmitting,
  }) => {
    return (
      <div className="input-wrapper parrafos">
        <label htmlFor={name} className="form-label visually-hidden">
          {label}
        </label>
        {/* Control box: icon + input + toggle are anchored to each other,
            so messages appearing below never shift their alignment */}
        <div className="input-control">
          <FontAwesomeIcon icon={icon} className="input-icon" />
          <Form.Control
            id={name}
            name={name}
            type={type}
            placeholder={placeholder}
            value={value || ""}
            onChange={onChange}
            onBlur={onBlur}
            className={`input-field ${hasError ? "is-invalid" : isValid ? "is-valid" : ""}`}
            aria-invalid={hasError}
            aria-describedby={describedBy || undefined}
            autoComplete={autoComplete}
            inputMode={inputMode}
            disabled={disabled}
          />
          {showToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="toggle-password"
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              aria-pressed={showPassword}
              disabled={isSubmitting}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
          )}
        </div>
        {hasError && (
          <div
            id={`${name}-error`}
            className="field-error"
            role="alert"
            aria-live="polite"
          >
            <FontAwesomeIcon icon={faExclamationCircle} className="me-1" />
            {error}
          </div>
        )}
        {isValid && (
          <div className="field-success" aria-live="polite">
            <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
            Correcto
          </div>
        )}
      </div>
    );
  },
);

InputField.displayName = "InputField";

const InicioSecion = () => {
  const [inputs, setInputs] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // Validation rules (accepts a snapshot of the inputs for consistency)
  const validateField = (name, value, all = inputs) => {
    switch (name) {
      case "username":
        if (!value.trim()) return "El nombre de usuario es obligatorio";
        return "";

      case "password":
        if (!value) return "La contraseña es obligatoria";
        return "";

      default:
        return "";
    }
  };

  // Validate single field on blur
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const next = { ...inputs, [name]: value };
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value, next),
    }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  // Handle input change - re-validate live for fields already touched
  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...inputs, [name]: value };
    setInputs(next);

    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value, next),
      }));
    }
  };

  // Validate all fields
  const validateAll = () => {
    const newErrors = {};
    Object.keys(inputs).forEach((key) => {
      const error = validateField(key, inputs[key], inputs);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);
    setTouched({
      username: true,
      password: true,
    });

    // Focus first invalid field after re-render
    const firstKey = Object.keys(newErrors)[0];
    if (firstKey) {
      setTimeout(() => {
        document.querySelector(`.login-card [name="${firstKey}"]`)?.focus();
      }, 0);
    }

    return Object.keys(newErrors).length === 0;
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateAll()) return;

    setIsSubmitting(true);

    try {
      await login(inputs);
      navigate("/");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data ||
        "Credenciales inválidas. Verifique su usuario y contraseña.";
      setSubmitError(message);
      // Focus error summary for accessibility
      document.getElementById("error-summary")?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute derived state for each field
  const usernameError = touched.username ? errors.username : "";
  const usernameHasError = !!usernameError;
  const usernameIsValid = touched.username && !usernameError && inputs.username;
  const usernameDescribedBy = usernameHasError ? "username-error" : null;

  const passwordError = touched.password ? errors.password : "";
  const passwordHasError = !!passwordError;
  const passwordIsValid = touched.password && !passwordError && inputs.password;
  const passwordDescribedBy = passwordHasError ? "password-error" : null;

  return (
    <div className="login-container">
      <div className="mural-box" aria-hidden="true">
        <h1 className="mural parrafos">BYGIO</h1>
      </div>

      <div className="login-card" role="main">
        {/* Logo */}
        <h1 className="bygiotext">ByGio</h1>
        <h4>Bienvenido</h4>

        {/* Submit-level error */}
        {submitError && (
          <div
            id="error-summary"
            className="error-summary"
            role="alert"
            aria-live="assertive"
            tabIndex={-1}
          >
            <FontAwesomeIcon icon={faExclamationCircle} className="me-2" />
            <strong>Error al iniciar sesión:</strong> {submitError}
          </div>
        )}

        <Form noValidate onSubmit={handleSubmit}>
          {/* Username */}
          <InputField
            label="Nombre de usuario"
            name="username"
            type="text"
            placeholder="Nombre de usuario"
            icon={faUser}
            autoComplete="username"
            inputMode="text"
            value={inputs.username}
            onChange={handleChange}
            onBlur={handleBlur}
            error={usernameError}
            hasError={usernameHasError}
            isValid={usernameIsValid}
            describedBy={usernameDescribedBy}
            disabled={isSubmitting}
            showPassword={showPassword}
            isSubmitting={isSubmitting}
          />

          {/* Password */}
          <InputField
            label="Contraseña"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            icon={faLock}
            showToggle
            onToggle={togglePasswordVisibility}
            autoComplete="current-password"
            inputMode="text"
            value={inputs.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={passwordError}
            hasError={passwordHasError}
            isValid={passwordIsValid}
            describedBy={passwordDescribedBy}
            disabled={isSubmitting}
            showPassword={showPassword}
            isSubmitting={isSubmitting}
          />

          {/* Login Button */}
          <button
            type="submit"
            className="login-btn titulos"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="me-2 fa-spin"
                  aria-hidden="true"
                />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </Form>

        {/* Sign Up */}
        <p className="signup-text parrafos">
          ¿Nuevo usuario?{" "}
          <Link to="/register" className="signup-link titulos">
            Regístrate
          </Link>
        </p>
        <Link to="/" className="home-link parrafos">
          <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
          Ir al inicio
        </Link>
      </div>
    </div>
  );
};

export default InicioSecion;
