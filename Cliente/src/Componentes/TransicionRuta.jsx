import { useContext, useLayoutEffect, useRef, useState } from "react";
import {
  UNSAFE_LocationContext,
  UNSAFE_RouteContext,
  useLocation,
  useOutlet,
} from "react-router-dom";
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";

/* Tiempos alineados con los tokens del sitio (--mov-rapido 160 ms de
   salida y --mov-base 260 ms de entrada): la salida dura ~62% de la
   entrada (recipe exit-faster-than-enter) y la navegación completa pasa
   de 500 ms a 420 ms. Con `mode="wait"` no hay dos páginas superpuestas. */
const ENTRADA = { duration: 0.26, ease: [0.22, 1, 0.36, 1] };
const SALIDA = { duration: 0.16, ease: [0.22, 1, 0.36, 1] };

/* Con movimiento reducido el fundido sigue existiendo (una opacidad no
   desplaza nada), pero es más corto y lineal: cambiar de página no debe
   ser un corte seco ni una animación larga. */
const ENTRADA_REDUCIDA = { duration: 0.16, ease: "linear" };
const SALIDA_REDUCIDA = { duration: 0.12, ease: "linear" };

/* `html { scroll-behavior: smooth }` convertiría el salto a "arriba" en
   un recorrido animado. Se fuerza "auto" en la raíz y se provoca un
   recálculo de estilo antes de mover: sin ese recálculo, el navegador
   alcanza a lanzar el scroll suave con el valor anterior. */
const desplazarSinAnimar = (top) => {
  const raiz = document.documentElement;
  const previo = raiz.style.scrollBehavior;

  raiz.style.scrollBehavior = "auto";
  void raiz.scrollTop;
  window.scrollTo(0, Math.max(0, top));
  raiz.style.scrollBehavior = previo;
};

/*
 * ContenidoRuta
 *
 * - `useOutlet()` devuelve el elemento que toca pintar y se congela al
 *   montar (`useState`). AnimatePresence mantiene montada esa copia
 *   mientras dura la salida y, para entonces, el router ya avanzó: sin
 *   el congelado, la página que se desvanece pintaría la ruta NUEVA.
 *
 * - Además se congela la ubicación y el contexto de ruta MIENTRAS la
 *   copia está saliendo. Si no, la página que se va recibiría los
 *   params/búsqueda de la ruta nueva y cambiaría de contenido a mitad
 *   del fundido (por ejemplo, el catálogo pasaría a "Todas" mientras se
 *   desvanece al abrir un producto).
 *
 *   Se usan los contextos `UNSAFE_` de react-router porque son la única
 *   forma de que un árbol ya superado siga viendo su ubicación anterior.
 *   Mientras la ruta está viva se reenvía el contexto real, así que el
 *   comportamiento normal (links, filtros, params) no cambia.
 */
const ContenidoRuta = () => {
  const outlet = useOutlet();
  const [arbol] = useState(outlet);

  const ubicacionActual = useLocation();
  const [ubicacionPropia] = useState(ubicacionActual);
  const saliendo = ubicacionActual.pathname !== ubicacionPropia.pathname;

  /* La copia nueva monta cuando la anterior ya salió y arranca en
     opacidad 0: subir el scroll aquí ocurre antes del primer pintado,
     así que no se ve el recorrido desde el pie. Aplica a cualquier
     navegación (colección, producto, atrás/adelante) para que el
     resultado sea siempre predecible. */
  useLayoutEffect(() => {
    if (saliendo) return;

    desplazarSinAnimar(0);
    // Solo al montar: la copia nueva es la única que ejecuta este efecto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ubicacionViva = useContext(UNSAFE_LocationContext);
  const rutaViva = useContext(UNSAFE_RouteContext);

  const ubicacionPrevia = useRef(ubicacionViva);
  const rutaPrevia = useRef(rutaViva);

  if (!saliendo) {
    ubicacionPrevia.current = ubicacionViva;
    rutaPrevia.current = rutaViva;
  }

  return (
    <UNSAFE_LocationContext.Provider
      value={saliendo ? ubicacionPrevia.current : ubicacionViva}
    >
      <UNSAFE_RouteContext.Provider
        value={saliendo ? rutaPrevia.current : rutaViva}
      >
        {arbol}
      </UNSAFE_RouteContext.Provider>
    </UNSAFE_LocationContext.Provider>
  );
};

/*
 * Transición entre páginas. Se monta dentro de <main>, así la cabecera
 * y el pie no se mueven ni se vuelven a montar. Solo se anima opacidad:
 * un `transform` en el contenedor convertiría a este elemento en el
 * bloque contenedor de cualquier `position: fixed` de la página.
 *
 * La `key` es el pathname: cambiar solo la búsqueda (filtros) no
 * dispara la transición, que es lo que se espera al filtrar.
 */
const TransicionRuta = () => {
  const { pathname } = useLocation();
  const reducirMovimiento = useReducedMotion();

  /* Con movimiento reducido se mantiene el envoltorio (y por tanto el
     congelado de la ruta que sale), solo cambian los tiempos. */
  const entrada = reducirMovimiento ? ENTRADA_REDUCIDA : ENTRADA;
  const salida = reducirMovimiento ? SALIDA_REDUCIDA : SALIDA;

  return (
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={pathname}
          className="transicion-ruta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: entrada }}
          exit={{ opacity: 0, transition: salida }}
        >
          <ContenidoRuta />
        </m.div>
      </AnimatePresence>
    </LazyMotion>
  );
};

export default TransicionRuta;
