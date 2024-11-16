import React, { useContext, useState } from "react";
import { AuthContext } from "../context/authContext";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import "../index.css";
import axios from "axios";
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
  MDBCheckbox,
} from "mdb-react-ui-kit";
import { API_URL } from "../config";

const URL = API_URL;
const InicioSecion = () => {
  const [inputs, setInputs] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const {login} = useContext(AuthContext);

  const handlechange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    4;
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };
  const handlesubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("entraré al context");
      
      await login(inputs);
      console.log("pasé por el context");
      
      navigate("/");
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
          <MDBRow>
            <MDBCol
              md="10"
              lg="6"
              className="order-2 order-lg-1 d-flex flex-column align-items-center"
            >
              <h1 className=" text-center fw-bold mb-5 mx-1 mx-md-4 mt-4">
                Inicia Seción
              </h1>

              <div className="d-flex flex-row align-items-center mb-4 ">
                <MDBIcon fas icon="user me-3" size="lg" />
                <MDBInput
                  label="Nombre"
                  id="form1"
                  type="text"
                  className="w-100"
                  name="username"
                  onChange={handlechange}
                />
              </div>

              <div className="d-flex flex-row align-items-center mb-4">
                <MDBIcon fas icon="lock me-3" size="lg" />
                <MDBInput
                  label="Contraseña"
                  id="form3"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  onChange={handlechange}
                />
              </div>

              <MDBBtn
                className="mb-4 btn btn-light"
                size="lg"
                onClick={handlesubmit}
              >
                Entrar
              </MDBBtn>
              {error && <span>{error}</span>}
              <h5 className="d-flex align-items-center ">
                ¿No Posees cuenta?
                <Link to={"/register"}>
                  <span class="badge bg-secondary m-2 badge-hover">
                    Registrate
                  </span>
                </Link>
              </h5>
            </MDBCol>

            <MDBCol
              md="10"
              lg="6"
              className="order-1 order-lg-2 d-flex align-items-center"
            >
              <MDBCardImage
                className="imgstyle"
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

export default InicioSecion;
