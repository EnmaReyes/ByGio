import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../index.css";
import {
  MDBBtn,
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBCardImage,
  MDBInput,
  MDBIcon,
} from "mdb-react-ui-kit";
import { API_URL } from "../config";
import axios from "axios";
import { Button } from "react-bootstrap";

const URL = API_URL;

const Registro = () => {
  const [inputs, setInputs] = useState({
    email: "",
    username: "",
    password: "",
  });
  const [checkPass, setCheckPass] = useState("");
  const [error, setError] = useState(null);
  const [focus, setFocus] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const hadleFocus = () => {
    setFocus(true);
  };
  const handleBlur = () => {
    setFocus(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };
  const handlechange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const { name, value } = e.target;
    if (name === "checkPass") {
      setCheckPass(value); // Asigna el valor de 'checkPass' al estado
    } else {
      setInputs((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlesubmit = async (e) => {
    e.preventDefault();

    if (
      !inputs.email ||
      !inputs.password ||
      !inputs.username ||
      !inputs.checkPass
    ) {
      setError("complete todos los campos.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputs.email)) {
      setError("Ingrese un correo válido.");
      return;
    }

    if (inputs.password.length < 6) {
      setError("Incluir al menos 6 caracteres en la Contraseña.");
      return;
    }
    if (inputs.password == !checkPass) {
      setError("Las contraseñas no coinciden ⚠");
    }

    try {
      await axios.post(`${URL}/api/auth/register`, inputs);
      navigate("/login");
    } catch (err) {
      setError(err.response.data);
    }
  };

  return (
    <MDBContainer fluid>
      <MDBCard
        className="m-5 bgcard"
        style={{
          borderRadius: "25px",
          boxShadow: "0px 3px 2px -2px",
          color: "#fff",
        }}
      >
        <MDBCardBody>
          <MDBRow className="align-items-center">
            {/* Left Column */}
            <MDBCol
              md="10"
              lg="6"
              className="order-2 order-lg-1 d-flex flex-column align-items-center"
            >
              <h1 className="text-center fw-bold mb-5 mx-1 mx-md-4 mt-4">
                Registrate
              </h1>

              <div className="d-flex flex-row align-items-center mb-4 ">
                <MDBIcon fas icon="user me-3" size="lg" />
                <MDBInput
                  label="Nombre"
                  id="form1"
                  required
                  type="text"
                  name="username"
                  onChange={handlechange}
                  className="w-100"
                />
              </div>

              <div className="d-flex flex-row align-items-center mb-4">
                <MDBIcon fas icon="envelope me-3" size="lg" />
                <MDBInput
                  required
                  label="Correo"
                  id="form2"
                  type="email"
                  name="email"
                  onChange={handlechange}
                />
              </div>

              <div className="d-flex flex-row align-items-center mb-4">
                <MDBIcon fas icon="lock me-3" size="lg" />
                <MDBInput
                  label="Contraseña"
                  id="form3"
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  name="password"
                  onChange={handlechange}
                />
              </div>

              <div className="d-flex flex-row align-items-center mb-4">
                <MDBIcon fas icon="key me-3" size="lg" />
                <MDBInput
                  label="Confirma Contraseña"
                  id="form4"
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  name="checkPass"
                  value={checkPass}
                  onChange={handlechange}
                />
              </div>

              <Button
                className="mb-4 btn btn-light"
                size="lg"
                onClick={handlesubmit}
              >
                Registrar
              </Button>
              {error && <span>{error}</span>}
              <h5 className="d-flex align-items-center responsive">
                ¿Posees cuenta?
                <Link to={"/login"}>
                  <span className="badge bg-secondary m-2 badge-hover">
                    iniciar sesión
                  </span>
                </Link>
              </h5>
            </MDBCol>

            {/* Right Column */}
            <MDBCol
              md="10"
              lg="6"
              className="order-1 order-lg-2 d-flex justify-content-center align-items-center"
            >
              <MDBCardImage
                className="imgstyle w-100 h-100"
                src="https://i.pinimg.com/736x/b6/6e/d0/b66ed0a538c06d6ef2189487e22aaa2d.jpg"
                fluid
              />
            </MDBCol>
          </MDBRow>
        </MDBCardBody>
      </MDBCard>
    </MDBContainer>
  );
};

export default Registro;
