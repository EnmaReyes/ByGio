import React, { useContext, useState } from "react";
import { AuthContext } from "../context/authContext";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const InicioSecion = () => {
  const [inputs, setInputs] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [focus, setFocus] = useState(false);
  const navigate = useNavigate();
  const login = useContext(AuthContext);

  const handlechange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const hadleFocus = () => {
    setFocus(true);
  };
  const handleBlur = () => {
    setFocus(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };
  const handlesubmit = async (e) => {
    e.preventDefault();
    try {
      await login(inputs);
      navigate("/");
    } catch (err) {
      setError(err.response.data);
    }
  };
  return (
    <div>
      <form>
        <div className="mb-3">
          <label for="exampleInputEmail1" class="form-label">
            Usuario
          </label>
          <input
            type="text"
            className="form-control"
            id="exampleInputEmail1"
            placeholder="Usuario"
            name="username"
            onChange={handlechange}
            onFocus={hadleFocus}
            onBlur={handleBlur}
          />
          <div id="emailHelp" class="form-text">
            No compartiremos tu correo con nadie más 🤐
          </div>
        </div>
        <div className="mb-3">
          <label for="exampleInputPassword1" class="form-label">
            Contraseña
          </label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            name="password"
            onChange={handlechange}
            onFocus={hadleFocus}
            className="form-control"
            id="exampleInputPassword1"
          />
          <a onClick={togglePasswordVisibility} className="">
            {showPassword ? (
              <FontAwesomeIcon icon={faEye} />
            ) : (
              <FontAwesomeIcon icon={faEyeSlash} />
            )}
          </a>
        </div>
        <button type="submit" className="btn btn-primary">
          Entrar
        </button>
        {error && <p className="error">{error}</p>}
        <span>
          ¿No posees cuenta?{" "}
          <Link className="register" to="/register">
            Registrate
          </Link>
        </span>
      </form>
    </div>
  );
};

export default InicioSecion;
