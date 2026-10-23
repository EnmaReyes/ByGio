/*
 * Esqueleto de carga de la rejilla DTF (misma receta que
 * RejillaEsqueleto, en Componentes/). Repite la geometría de DtfCard
 * —media cuadrada, bloque de información y botón— para que el cambio
 * a contenido real no mueva la página.
 *
 * El mensaje vive en un `.solo-lector`: la rejilla decorativa va
 * oculta a lectores de pantalla y el estado se anuncia por texto.
 */
const DtfEsqueleto = ({ mensaje = "Cargando diseños…", cantidad = 8 }) => (
  <div role="status" aria-live="polite">
    <p className="solo-lector">{mensaje}</p>

    <div className="dtf-grid" aria-hidden="true">
      {Array.from({ length: cantidad }, (_, indice) => (
        <div key={indice} className="dtf-esqueleto" style={{ "--i": indice }}>
          <span className="esqueleto esqueleto-media dtf-esqueleto-media" />

          <span className="dtf-esqueleto-info">
            <span className="esqueleto esqueleto-linea" />
            <span className="esqueleto esqueleto-linea esqueleto-linea--tallas" />
            <span className="esqueleto dtf-esqueleto-boton" />
          </span>
        </div>
      ))}
    </div>
  </div>
);

export default DtfEsqueleto;
