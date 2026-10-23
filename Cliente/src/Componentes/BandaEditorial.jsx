import { Link } from "react-router-dom";
import useEnVista from "../hooks/useEnVista";
import imagenEditorial from "../assets/coleccion/Editorial.jpeg";

/*
 * Banda editorial (divisor tipo banner, como el bloque de Sabina
 * entre el producto y los relacionados): foto a un lado y texto
 * al otro sobre fondo suave. No vende un artículo concreto: cuenta
 * la casa y lleva a la colección.
 *
 * Entrada: `.revelar` + líneas escalonadas (`useEnVista`), la misma
 * receta del hero. No anima nada por su cuenta.
 */
const BandaEditorial = () => {
  const [ref, enVista] = useEnVista();

  return (
    <section
      ref={ref}
      className={`banda-editorial revelar${enVista ? " is-visible" : ""}`}
      aria-labelledby="banda-editorial-titulo"
    >
      <div className="contenedor banda-editorial-interior">
        <figure className="banda-editorial-media revelar-linea">
          <img
            src={imagenEditorial}
            alt="Perchero con camisetas ByGio en tonos neutros"
            loading="lazy"
          />
        </figure>

        <div className="banda-editorial-texto">
          <span className="etiqueta-seccion revelar-linea" style={{ "--i": 1 }}>
            La casa
          </span>

          <h2
            id="banda-editorial-titulo"
            className="titulo-seccion revelar-linea"
            style={{ "--i": 2 }}
          >
            Comodidad sin renunciar al estilo
          </h2>

          <p className="texto-seccion revelar-linea" style={{ "--i": 3 }}>
            Elegimos cada pieza por su caída y su tela: ropa que aguanta el día
            entero, combina con lo que ya tienes y se siente bien puesta.
          </p>

          <ul
            className="banda-editorial-puntos revelar-linea"
            style={{ "--i": 4 }}
          >
            <li>
              <strong>Hecho para el día a día</strong>
              <span>Telas frescas y costuras que aguantan el uso.</span>
            </li>
            <li>
              <strong>Piezas que combinan</strong>
              <span>Básicos y oversize pensados para mezclarse entre sí.</span>
            </li>
          </ul>

          <Link
            to="/productos"
            className="enlace-seccion revelar-linea"
            style={{ "--i": 5 }}
          >
            Ver la colección
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BandaEditorial;
