import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import useEnVista from "../hooks/useEnVista";
import basicaImagen from "../assets/coleccion/basica.jpeg";
import oversizeImagen from "../assets/coleccion/oversize.jpeg";
import fondoMarca from "../assets/coleccion/DTF.jpeg";

const colecciones = [
  {
    id: "basicas",
    titulo: "Básicas",
    imagen: basicaImagen,
    alt: "Franela básica de la colección ByGio",
  },
  {
    id: "oversize",
    titulo: "Oversize",
    imagen: oversizeImagen,
    alt: "Franela oversize de la colección ByGio",
  },
  {
    id: "dtf",
    titulo: "DTF",
    imagen: fondoMarca,
    alt: "Diseños DTF de ByGio",
  },
];

const TarjetaColeccion = ({ coleccion, principal = false, indice = 0 }) => (
  <Link
    to={`/productos?coleccion=${coleccion.id}`}
    className={`coleccion-card revelar-linea${
      principal ? " coleccion-card--principal" : ""
    }`}
    style={{ "--i": indice }}
  >
    <div className="coleccion-media">
      <img
        className="coleccion-imagen"
        src={coleccion.imagen}
        alt={coleccion.alt}
        loading="lazy"
      />
      <h3 className="coleccion-titulo">{coleccion.titulo}</h3>
    </div>
  </Link>
);

const Colecciones = () => {
  const [gridRef, enVista] = useEnVista();

  return (
    <section
      className="seccion seccion--suave"
      id="colecciones"
      aria-labelledby="colecciones-titulo"
    >
      <div className="contenedor">
        <div className="seccion-cabecera">
          <div>
            <span className="etiqueta-seccion">Explora</span>
            <h2 id="colecciones-titulo" className="titulo-seccion">
              Nuestras colecciones
            </h2>
            <p className="texto-seccion">
              Tres formas de vestir tu estilo. Elige la que mejor te represente
              y descubre todas las piezas disponibles.
            </p>
          </div>

          <Link to="/productos" className="enlace-seccion">
            Ver catálogo completo
            <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
          </Link>
        </div>

        <div
          ref={gridRef}
          className={`colecciones-grid revelar${enVista ? " is-visible" : ""}`}
        >
          <TarjetaColeccion coleccion={colecciones[0]} principal indice={0} />
          <div className="colecciones-stack">
            {colecciones.slice(1).map((coleccion, posicion) => (
              <TarjetaColeccion
                key={coleccion.id}
                coleccion={coleccion}
                indice={posicion + 1}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Colecciones;
