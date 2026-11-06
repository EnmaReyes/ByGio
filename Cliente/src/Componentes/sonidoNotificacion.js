/*
 * Sonido de notificaciones (Opción A: Web Audio API, sin archivos).
 *
 * Sintetiza un "ding" corto (dos notas, ~0.4 s) con un oscilador y un
 * envolvente exponencial, con volumen bajo por defecto para que no sea
 * invasivo. No hay assets que mantener ni dependencias nuevas.
 *
 * Todo el audio del proyecto pasa por este módulo: no dispersar
 * `new Audio()` por el código. El único consumidor es
 * `useNotificaciones.js` (y el toggle de la página de notificaciones).
 *
 * Persistencia (localStorage, sin env nuevas):
 * - `bygio:notif_sonido`   -> "true" | "false"  (por defecto activado)
 * - `bygio:notif_volumen`  -> "0" .. "1"        (por defecto 0.3)
 *
 * Política de autoplay: el AudioContext se crea de forma perezosa y solo
 * se reanuda si ya hubo interacción del usuario. Si el navegador lo tiene
 * suspendido, se intenta reanudar y se falla en silencio (nunca rompe la
 * página ni el render).
 */

const CLAVE_SONIDO = "bygio:notif_sonido";
const CLAVE_VOLUMEN = "bygio:notif_volumen";
const VOLUMEN_POR_DEFECTO = 0.3;
const INTERVALO_MINIMO_MS = 600; // evita solapamientos / loops

let contextoAudio = null;
let ultimaReproduccion = 0;

const leer = (clave) => {
  try {
    return window.localStorage.getItem(clave);
  } catch {
    return null;
  }
};

const guardar = (clave, valor) => {
  try {
    window.localStorage.setItem(clave, valor);
  } catch {
    /* almacenamiento no disponible: se queda en memoria */
  }
};

export const isSonidoActivado = () => leer(CLAVE_SONIDO) !== "false";

export const setSonidoActivado = (valor) => {
  guardar(CLAVE_SONIDO, valor ? "true" : "false");
};

export const getVolumen = () => {
  const raw = leer(CLAVE_VOLUMEN);
  const parsed = raw === null ? VOLUMEN_POR_DEFECTO : Number(raw);
  if (!Number.isFinite(parsed)) return VOLUMEN_POR_DEFECTO;
  return Math.min(Math.max(parsed, 0), 1);
};

export const setVolumen = (valor) => {
  const volumen = Math.min(Math.max(Number(valor) || 0, 0), 1);
  guardar(CLAVE_VOLUMEN, String(volumen));
};

const obtenerContexto = () => {
  if (typeof window === "undefined") return null;
  const AudioContextCtor =
    window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!contextoAudio) {
    contextoAudio = new AudioContextCtor();
  }
  return contextoAudio;
};

/*
 * Suena una sola vez por llamada. No lanza nunca: cualquier error de
 * audio se silencia.
 */
export const reproducirSonidoNotificacion = () => {
  try {
    if (!isSonidoActivado()) return;
    const volumen = getVolumen();
    if (volumen <= 0) return;

    const ctx = obtenerContexto();
    if (!ctx) return;

    // Si el navegador bloqueó el autoplay y aún no hubo gesto, fallamos
    // en silencio en vez de encolar sonidos que salgan de golpe luego.
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => {});
      return;
    }

    const ahora = Date.now();
    if (ahora - ultimaReproduccion < INTERVALO_MINIMO_MS) return;
    ultimaReproduccion = ahora;

    const inicio = ctx.currentTime;

    // Dos notas cortas (mi 880 Hz -> la 1318.5 Hz) con decaída suave.
    const notas = [
      { frecuencia: 880, desde: 0 },
      { frecuencia: 1318.5, desde: 0.12 },
    ];

    notas.forEach(({ frecuencia, desde }) => {
      const osc = ctx.createOscillator();
      const ganancia = ctx.createGain();
      const t = inicio + desde;
      osc.type = "sine";
      osc.frequency.setValueAtTime(frecuencia, t);
      ganancia.gain.setValueAtTime(0.0001, t);
      ganancia.gain.exponentialRampToValueAtTime(volumen, t + 0.02);
      ganancia.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(ganancia);
      ganancia.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  } catch {
    /* el audio nunca debe romper la UI */
  }
};
