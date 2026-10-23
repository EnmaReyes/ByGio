import { useEffect, useRef, useState } from "react";

/*
 * useEnVista
 * Devuelve [ref, enVista]. `enVista` pasa a true la primera vez que
 * el nodo entra en el viewport y ya no vuelve a false: las entradas
 * se reproducen una sola vez, no se repiten al subir y bajar.
 *
 * `threshold: 0` a proposito. Una rejilla de productos puede medir
 * mas que la pantalla; con un umbral alto (0.15) nunca llegaria a
 * alcanzarlo y el contenido se quedaria oculto para siempre.
 */
const useEnVista = () => {
  const ref = useRef(null);
  const [enVista, setEnVista] = useState(false);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return undefined;

    // Sin IntersectionObserver mostramos de inmediato: nunca
    // dejamos contenido escondido esperando un observador.
    if (typeof IntersectionObserver === "undefined") {
      setEnVista(true);
      return undefined;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) {
            setEnVista(true);
            observador.disconnect();
          }
        });
      },
      { threshold: 0 }
    );

    observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  return [ref, enVista];
};

export default useEnVista;
