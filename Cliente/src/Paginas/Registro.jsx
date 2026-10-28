import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "../index.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faUser,
  faLock,
  faEnvelope,
  faKey,
  faCheckCircle,
  faExclamationCircle,
  faSpinner,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { API_URL } from "../config";
import { Form } from "react-bootstrap";
import SocialAuthButtons from "../Componentes/SocialAuthButtons";
import { safeRedirectPath } from "../Componentes/redirectUtils";

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
    children,
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
        {children}
      </div>
    );
  },
);

InputField.displayName = "InputField";

const Registro = () => {
  const [inputs, setInputs] = useState({
    username: "",
    email: "",
    password: "",
    checkPass: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get("redirect"));

  // Validation rules (accepts a snapshot of the inputs so cross-field
  // checks always use the latest values, even inside event handlers)
  const validateField = (name, value, all = inputs) => {
    switch (name) {
      case "username":
        if (!value.trim()) return "El nombre de usuario es obligatorio";
        if (value.trim().length < 3) return "Mínimo 3 caracteres";
        if (!/^[a-zA-Z0-9_]+$/.test(value.trim()))
          return "Solo letras, números y guión bajo";
        return "";

      case "email":
        if (!value.trim()) return "El correo electrónico es obligatorio";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
          return "Ingrese un correo válido (ej: usuario@dominio.com)";
        return "";

      case "password":
        if (!value) return "La contraseña es obligatoria";
        if (value.length < 8) return "Mínimo 8 caracteres";
        if (!/[A-Z]/.test(value)) return "Debe contener al menos una mayúscula";
        if (!/[a-z]/.test(value)) return "Debe contener al menos una minúscula";
        if (!/[0-9]/.test(value)) return "Debe contener al menos un número";
        return "";

      case "checkPass":
        if (!value) return "Confirme su contraseña";
        if (value !== all.password) return "Las contraseñas no coinciden";
        return "";

      default:
        return "";
    }
  };

  // Re-validate checkPass whenever the password field changes
  const revalidateCheckPass = (snapshot) => {
    if (!touched.checkPass) return;
    setErrors((prev) => ({
      ...prev,
      checkPass: validateField("checkPass", snapshot.checkPass, snapshot),
    }));
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

    if (name === "password") revalidateCheckPass(next);
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

    // Changing the password re-validates the confirmation field
    if (name === "password") revalidateCheckPass(next);
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
      email: true,
      password: true,
      checkPass: true,
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
    setSubmitSuccess(false);

    if (!validateAll()) return;

    setIsSubmitting(true);

    try {
      await axios.post(`${URL}/api/auth/register`, {
        username: inputs.username.trim(),
        email: inputs.email.trim(),
        password: inputs.password,
      });
      setSubmitSuccess(true);
      // Redirect after brief success display
      setTimeout(
        () =>
          navigate(
            redirectTo === "/"
              ? "/login"
              : `/login?redirect=${encodeURIComponent(redirectTo)}`,
          ),
        1500,
      );
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data ||
        "Error en el registro. Intente nuevamente.";
      setSubmitError(message);
      // Focus error summary for accessibility
      document.getElementById("error-summary")?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { level: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 1, label: "Débil", color: "strength-weak" };
    if (score <= 3)
      return { level: 2, label: "Media", color: "strength-medium" };
    if (score <= 4)
      return { level: 3, label: "Fuerte", color: "strength-strong" };
    return { level: 4, label: "Muy fuerte", color: "strength-very-strong" };
  };

  const passwordStrength = getPasswordStrength(inputs.password);

  // Compute derived state for each field
  const usernameError = touched.username ? errors.username : "";
  const usernameHasError = !!usernameError;
  const usernameIsValid = touched.username && !usernameError && inputs.username;
  const usernameDescribedBy = usernameHasError ? "username-error" : null;

  const emailError = touched.email ? errors.email : "";
  const emailHasError = !!emailError;
  const emailIsValid = touched.email && !emailError && inputs.email;
  const emailDescribedBy = emailHasError ? "email-error" : null;

  const passwordError = touched.password ? errors.password : "";
  const passwordHasError = !!passwordError;
  const passwordIsValid = touched.password && !passwordError && inputs.password;
  const passwordDescribedBy = [
    passwordHasError ? "password-error" : null,
    inputs.password ? "password-hint" : null,
  ]
    .filter(Boolean)
    .join(" ");

  const checkPassError = touched.checkPass ? errors.checkPass : "";
  const checkPassHasError = !!checkPassError;
  const checkPassIsValid =
    touched.checkPass && !checkPassError && inputs.checkPass;
  const checkPassDescribedBy = checkPassHasError ? "checkPass-error" : null;

  // Password strength content (only for password field)
  const passwordStrengthContent = inputs.password ? (
    <div id="password-hint" className="password-strength" aria-live="polite">
      <div className="strength-bar">
        <div
          className={`strength-fill ${passwordStrength.color}`}
          style={{ transform: `scaleX(${passwordStrength.level / 4})` }}
        />
      </div>
      <span className="strength-text">
        Fortaleza: <strong>{passwordStrength.label}</strong>
      </span>
      <p className="password-requirements">
        <small>Mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número</small>
      </p>
    </div>
  ) : null;

  return (
    <div className="login-container">
      {/* Mural animado */}
      <div className="mural-box" aria-hidden="true">
        <h1 className="mural parrafos">BYGIO</h1>
      </div>

      <div className="login-card" role="main">
        <h1 className="bygiotext">ByGio</h1>
        <h4>Crea tu cuenta</h4>

        {/* Submit-level error/success */}
        {submitSuccess && (
          <div
            id="success-message"
            className="success-message"
            role="status"
            aria-live="polite"
          >
            <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
            ¡Cuenta creada exitosamente! Redirigiendo...
          </div>
        )}

        {submitError && (
          <div
            id="error-summary"
            className="error-summary"
            role="alert"
            aria-live="assertive"
            tabIndex={-1}
          >
            <FontAwesomeIcon icon={faExclamationCircle} className="me-2" />
            <strong>No se pudo registrar:</strong> {submitError}
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

          {/* Email */}
          <InputField
            label="Correo electrónico"
            name="email"
            type="email"
            placeholder="Correo electrónico"
            icon={faEnvelope}
            autoComplete="email"
            inputMode="email"
            value={inputs.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={emailError}
            hasError={emailHasError}
            isValid={emailIsValid}
            describedBy={emailDescribedBy}
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
            autoComplete="new-password"
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
            children={passwordStrengthContent}
          />

          {/* Confirm Password */}
          <InputField
            label="Confirmar contraseña"
            name="checkPass"
            type={showPassword ? "text" : "password"}
            placeholder="Confirmar contraseña"
            icon={faKey}
            autoComplete="new-password"
            inputMode="text"
            value={inputs.checkPass}
            onChange={handleChange}
            onBlur={handleBlur}
            error={checkPassError}
            hasError={checkPassHasError}
            isValid={checkPassIsValid}
            describedBy={checkPassDescribedBy}
            disabled={isSubmitting}
            showPassword={showPassword}
            isSubmitting={isSubmitting}
          />

          {/* Register Button */}
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
                Registrando...
              </>
            ) : (
              "Registrar"
            )}
          </button>
        </Form>

        <SocialAuthButtons
          onError={setSubmitError}
          redirectTo={redirectTo}
        />

        {/* Login Link */}
        <p className="signup-text parrafos">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="signup-link titulos">
            Inicia sesión
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

export default Registro;
