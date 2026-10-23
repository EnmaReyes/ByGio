import { useCallback, useEffect, useRef, useState } from "react";

/*
 * useConfirmacion
 * Marca una acción como "recién hecha" durante `ms` y vuelve sola.
 *
 * Devuelve [clave, confirmar]: `confirmar(valor)` guarda qué acaba de
 * confirmarse (el id del producto, por ejemplo) y `clave` permite
 * pintar el estado "Añadido" solo en el botón que se pulsó.
 *
 * No es una animación: es estado de interfaz, así que usa un
 * temporizador de un solo disparo (se limpia al desmontar y al
 * repetir la acción, para que dos toques seguidos no se pisen).
 */
const useConfirmacion = (ms = 1400) => {
  const [clave, setClave] = useState(null);
  const temporizadorRef = useRef(null);

  const confirmar = useCallback(
    (valor = true) => {
      setClave(valor);
      clearTimeout(temporizadorRef.current);
      temporizadorRef.current = setTimeout(() => setClave(null), ms);
    },
    [ms],
  );

  useEffect(() => () => clearTimeout(temporizadorRef.current), []);

  return [clave, confirmar];
};

export default useConfirmacion;
