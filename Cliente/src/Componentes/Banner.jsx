import React from "react";
import img1 from "../assets/Banner/Banner1.png";
import img2 from "../assets/Banner/Banner2.png";
import img3 from "../assets/Banner/Banner3.png";

const Banner = () => {
  return (
   <div>
      <div
        id="carouselExampleControls"
        className="carousel slide"
        data-bs-ride="carousel"
      >
        <div className="carousel-inner">
          <div className="carousel-item active">
            <img src={img1} class="d-block w-100 h-100" alt="..." />
          </div>
          <div className="carousel-item">
            <img src={img2} class="d-block w-100" alt="..." />
          </div>
          <div className="carousel-item">
            <img src={img3} class="d-block w-100" alt="..." />
          </div>
        </div>
        <button
          className="carousel-control-prev"
          type="button"
          data-bs-target="#carouselExampleControls"
          data-bs-slide="prev"
        >
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Previous</span>
        </button>
        <button
          className="carousel-control-next"
          type="button"
          data-bs-target="#carouselExampleControls"
          data-bs-slide="next"
        >
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Next</span>
        </button>
      </div>
     </div>
  );
};

export default Banner;
