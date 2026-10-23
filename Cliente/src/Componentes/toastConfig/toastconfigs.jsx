import React from "react";
import { Slide } from "react-toastify";
import Swal from "sweetalert2";
import "react-toastify/dist/ReactToastify.css";
import "sweetalert2/src/sweetalert2.scss";


export const toastpromise = {
  position: "bottom-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  /* "light" en vez de "colored": el color va en el icono y en la
     barra de progreso (ver componentes.css), la tarjeta sigue el
     tema claro/oscuro del sitio. */
  theme: "light",
  /* Slide en vez de Bounce: el rebote no pertenece a la curva del
     sitio, que no sobrepasa. */
  transition: Slide,
};

export const toastComments = {
  position: "bottom-right",
  /* 700 ms no daba tiempo a leer el aviso; ahora que el botón también
     confirma la acción (botón y contador), el aviso puede quedarse un
     poco más sin tapar el contenido. */
  autoClose: 2400,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light",
  transition: Slide,
};

export const notify = (handleClick, texto) => {
  Swal.fire({
    title: texto,
    autoClose: 700,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Aceptar",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      handleClick(); // Llama a la función pasada por parámetro
    }
  });
};
