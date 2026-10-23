import useEnVista from "../hooks/useEnVista";
import TarjetaProducto from "./TarjetaProducto";

/*
 * Rejilla compartida por catálogo, destacados y ofertas.
 * - Cada tarjeta recibe su índice (--i) para entrar escalonada.
 * - La entrada (`.rejilla-entrada`, ver movimiento.css) espera a
 *   que la rejilla esté en pantalla, así no se gasta por debajo
 *   del pliegue.
 * - Como es una animación de montaje, volver a montar la rejilla
 *   (cambio de filtro, con una `key` distinta) la reproduce sola.
 */
const RejillaProductos = ({ articulos, mostrarDescuento = false }) => {
  const [ref, enVista] = useEnVista();

  return (
    <ul
      ref={ref}
      className={`grid-productos rejilla-entrada${
        enVista ? " is-visible" : ""
      }`}
    >
      {articulos.map((articulo, indice) => (
        <TarjetaProducto
          key={articulo.id}
          articulo={articulo}
          indice={indice}
          mostrarDescuento={mostrarDescuento}
        />
      ))}
    </ul>
  );
};

export default RejillaProductos;
