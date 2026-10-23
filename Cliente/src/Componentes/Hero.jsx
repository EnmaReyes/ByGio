import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import heroImagen from "../assets/hero.jpeg";

/*
 * Hero a sangre (estilo Sabina): foto completa, texto abajo a la izquierda
 * y titular con la tipografía display de ByGio.
 * La imagen es obligatoriamente src/assets/hero.jpeg.
 *
 * Entrada: las líneas usan las utilidades .revelar / .revelar-linea
 * (estilos/movimiento.css). El bloque arranca oculto y se revela con
 * stagger una vez montado, igual que el hero de Sabina (fade + subida
 * de ~26px, ~420ms, resorte leve, 100ms entre líneas).
 */
const Hero = () => {
  const [visible, setVisible] = useState(false);

  // useEffect corre después del primer paint: el navegador ya registró
  // el estado inicial (oculto) y la transición sí se reproduce.
  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <section
      className={`hero revelar${visible ? " is-visible" : ""}`}
      aria-labelledby="hero-titulo"
    >
      <img
        className="hero-fondo"
        src={heroImagen}
        alt="Perchero con prendas de la colección ByGio en un interior cálido"
        loading="eager"
      />
      <span className="hero-velo" aria-hidden="true" />

      <div className="contenedor hero-contenido">
        <p className="hero-eyebrow revelar-linea" style={{ "--i": 0 }}>
          Viste · Crea · Emprende{" "}
        </p>

        <h1
          id="hero-titulo"
          className="hero-titulo revelar-linea"
          style={{ "--i": 1 }}
        >
          Viste con intención, <em>crea sin límites</em>
        </h1>

        <p className="hero-texto revelar-linea" style={{ "--i": 2 }}>
          Camisetas básicas y oversize confeccionadas para acompañarte todos los
          días, más diseños DTF para imprimir tu propio estilo.
        </p>

        <div className="hero-acciones revelar-linea" style={{ "--i": 3 }}>
          <Link to="/productos" className="btn-tema btn-tema--primario">
            Ver productos
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
