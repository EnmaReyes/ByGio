import React, { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/authContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import EditBanner from "./EditBanner";
import { API_URL } from "../config";
const URL = API_URL;
const Banner = () => {
  const [banner, setBanner] = useState([]);
  const location = useLocation().search;
  const [loading, setLoading] = useState(true);
  const { currentUser } = useContext(AuthContext);
  const [editorVisible, setEditorVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${URL}/api/banner/${location}`);
        const data = res.data;
        // Verificar y transformar los datos de `img` y `size`
        const formattedData = Array.isArray(data)
          ? data.map((art) => ({
              ...art,
              img: typeof art.img === "string" ? JSON.parse(art.img) : art.img,
              sizes:
                typeof art.sizes === "string"
                  ? JSON.parse(art.sizes)
                  : art.sizes,
            }))
          : [];

        setBanner(formattedData[0]);
        setLoading(false);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, [location]);

  return (
    <div>
      {editorVisible ? (
        <EditBanner banner={banner} />
      ) : (
        <div
          id="carouselExampleControls"
          className="carousel slide"
          data-bs-ride="carousel"
        >
          <div className="carousel-inner">
            {loading ? (
              <div className="d-flex justify-content-center p-4 m-4">
                <div className="spinner-border" role="status"></div>
              </div>
            ) : (
              banner.img.map((bann, index) => (
                <div
                  key={index}
                  className={`carousel-item previewBanner ${
                    index === 0 ? "active" : ""
                  }`}
                >
                  <img
                    src={bann}
                    className="d-block w-100"
                    alt={`Banner ${index + 1}`}
                    style={{ objectFit: "inherit", height: "100%" }}
                  />
                </div>
              ))
            )}
          </div>
          <button
            className="carousel-control-prev"
            type="button"
            data-bs-target="#carouselExampleControls"
            data-bs-slide="prev"
          >
            <span
              className="carousel-control-prev-icon"
              aria-hidden="true"
            ></span>
            <span className="visually-hidden">Previous</span>
          </button>
          <button
            className="carousel-control-next"
            type="button"
            data-bs-target="#carouselExampleControls"
            data-bs-slide="next"
          >
            <span
              className="carousel-control-next-icon"
              aria-hidden="true"
            ></span>
            <span className="visually-hidden">Next</span>
          </button>
        </div>
      )}

      {currentUser?.admin === true && (
        <div
          className="upload-img"
          onClick={() => {
            setEditorVisible(!editorVisible);
          }}
        >
          <FontAwesomeIcon icon={faPenToSquare} />
        </div>
      )}
    </div>
  );
};

export default Banner;
