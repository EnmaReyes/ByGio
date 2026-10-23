/*
 * Esqueleto de carga de las rejillas de producto (receta
 * skeleton-reveal). Repite la geometría de TarjetaProducto — misma
 * rejilla, misma media cuadrada, mismas líneas de texto — para que
 * el cambio a contenido real no mueva nada.
 *
 * El mensaje vive en un `.solo-lector`: la rejilla decorativa va
 * oculta a lectores de pantalla y el estado se anuncia por texto.
 */
const RejillaEsqueleto = ({
  mensaje = "Cargando productos…",
  cantidad = 6,
}) => (
  <div role="status" aria-live="polite">
    <p className="solo-lector">{mensaje}</p>
    <ul className="grid-productos" aria-hidden="true">
      {Array.from({ length: cantidad }, (_, indice) => (
        <li
          key={indice}
          className="tarjeta-producto tarjeta-esqueleto"
          style={{ "--i": indice }}
        >
          <span className="esqueleto esqueleto-media" />
          <span className="tarjeta-cuerpo">
            <span className="esqueleto esqueleto-linea" />
            <span className="esqueleto esqueleto-linea esqueleto-linea--tallas" />
            <span className="esqueleto esqueleto-linea esqueleto-linea--precio" />
          </span>
        </li>
      ))}
    </ul>
  </div>
);

export default RejillaEsqueleto;
