import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  UNSAFE_LocationContext,
  UNSAFE_RouteContext,
  useLocation,
  useNavigationType,
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

/* ------------------------------------------------------------------ *
 * Memoria de scroll por entrada del historial
 *
 * `location.key` identifica cada entrada del historial: al volver atrás
 * (o adelante) react-router devuelve la MISMA key de esa entrada, así que
 * es la clave correcta para recordar dónde estaba el usuario.
 *
 * El mapa vive en el módulo: sobrevive a las navegaciones (la SPA no se
 * recarga) y desaparece al recargar, que es justo lo que queremos.
 * ------------------------------------------------------------------ */
const posiciones = new Map();

/* Tras una recarga el mapa está vacío; con la restauración nativa
   activa el navegador intentaría su propio salto y competiría con el
   nuestro, provocando un tirón. La controlamos por completo. */
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

const leerScroll = () => window.scrollY || window.pageYOffset || 0;

/* La página que entra puede ser más baja que la que salió (esqueleto de
   carga, imágenes por aparecer): el primer intento se recorta y hay que
   repetirlo mientras el documento crece. Se abandona en cuanto el
   usuario toma el control o se agota el plazo (~2 s). */
const PLAZO_RESTAURACION = 2000;

const TECLAS_QUE_DESPLAZAN = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
]);

const restaurarPosicion = (destino, alTerminar) => {
  let activo = true;
  let frame = 0;
  let observador = null;

  const programar = () => {
    if (!activo || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!activo) return;
      desplazarSinAnimar(destino);
      if (leerScroll() >= destino - 1) terminar();
    });
  };

  const alTeclear = (evento) => {
    if (TECLAS_QUE_DESPLAZAN.has(evento.key)) terminar();
  };

  const soltar = () => {
    window.removeEventListener("wheel", terminar, true);
    window.removeEventListener("touchstart", terminar, true);
    window.removeEventListener("pointerdown", terminar, true);
    window.removeEventListener("keydown", alTeclear, true);
    if (observador) observador.disconnect();
    if (frame) cancelAnimationFrame(frame);
    clearTimeout(plazo);
  };

  function terminar() {
    if (!activo) return;
    activo = false;
    soltar();
    // La posición final es la que cuenta para la próxima vuelta.
    if (alTerminar) alTerminar(leerScroll());
  }

  const plazo = setTimeout(terminar, PLAZO_RESTAURACION);

  if (typeof ResizeObserver !== "undefined") {
    observador = new ResizeObserver(programar);
    observador.observe(document.body);
  }

  // Cualquier intención de desplazamiento del usuario gana.
  window.addEventListener("wheel", terminar, { passive: true, capture: true });
  window.addEventListener("touchstart", terminar, {
    passive: true,
    capture: true,
  });
  window.addEventListener("pointerdown", terminar, {
    passive: true,
    capture: true,
  });
  window.addEventListener("keydown", alTeclear, true);

  desplazarSinAnimar(destino);
  if (leerScroll() >= destino - 1) terminar();

  return terminar;
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
  const tipoNavegacion = useNavigationType();
  const [ubicacionPropia] = useState(ubicacionActual);
  const saliendo = ubicacionActual.pathname !== ubicacionPropia.pathname;

  /* Key de la entrada que se está viendo. Durante la salida el router ya
     apunta a la ruta nueva, pero lo que está en pantalla (y por tanto lo
     que hay que recordar) sigue siendo la entrada propia. */
  const claveVisible = useRef(ubicacionPropia.key);
  if (!saliendo) claveVisible.current = ubicacionActual.key;

  const restaurando = useRef(false);
  const detenerRestauracion = useRef(null);

  /* La copia nueva monta cuando la anterior ya salió y arranca en
     opacidad 0: mover el scroll aquí ocurre antes del primer pintado,
     así que nunca se ve el recorrido desde el pie.
     - PUSH/REPLACE (abrir una colección, un producto): arriba del todo.
     - POP (atrás/adelante): la posición exacta que tenía esa entrada. */
  useLayoutEffect(() => {
    if (saliendo) return undefined;

    const clave = ubicacionPropia.key;
    const guardada = tipoNavegacion === "POP" ? posiciones.get(clave) : 0;
    const destino = guardada > 0 ? guardada : 0;

    if (!destino) {
      desplazarSinAnimar(0);
      posiciones.set(clave, 0);
      return undefined;
    }

    restaurando.current = true;
    detenerRestauracion.current = restaurarPosicion(destino, (lograda) => {
      restaurando.current = false;
      posiciones.set(clave, lograda);
      detenerRestauracion.current = null;
    });

    return () => {
      if (detenerRestauracion.current) detenerRestauracion.current();
    };
    // Solo al montar: la copia nueva es la única que ejecuta este efecto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Guardado continuo (un frame como mucho) de la entrada visible.
     Es `useLayoutEffect` a propósito: su limpieza corre ANTES de que la
     página nueva se monte y salte arriba, así que se guarda la posición
     real de la página que sale y no el 0 de la que entra. */
  useLayoutEffect(() => {
    let frame = 0;

    const escribir = () => {
      frame = 0;
      if (restaurando.current) return;
      posiciones.set(claveVisible.current, leerScroll());
    };

    const alDesplazar = () => {
      if (frame) return;
      frame = requestAnimationFrame(escribir);
    };

    window.addEventListener("scroll", alDesplazar, { passive: true });

    return () => {
      window.removeEventListener("scroll", alDesplazar);
      if (frame) cancelAnimationFrame(frame);
      if (!restaurando.current) {
        posiciones.set(claveVisible.current, leerScroll());
      }
    };
  }, []);

  /* Cambiar solo la búsqueda (filtros del catálogo) crea una entrada
     nueva sin remontar la página: hereda la posición actual para que el
     botón atrás también regrese al punto correcto. */
  useEffect(() => {
    if (saliendo) return;
    if (!posiciones.has(ubicacionActual.key)) {
      posiciones.set(ubicacionActual.key, leerScroll());
    }
  }, [ubicacionActual.key, saliendo]);

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
