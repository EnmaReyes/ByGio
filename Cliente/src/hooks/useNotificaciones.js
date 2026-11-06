import { useCallback, useEffect, useRef, useState } from "react";
import {
  contarNoLeidas,
  listarNotificaciones,
  NOTIFICACIONES_EVENT,
} from "../Componentes/notificaciones";
import { reproducirSonidoNotificacion } from "../Componentes/sonidoNotificacion";

/*
 * Consume las notificaciones del backend y se mantiene al día ante
 * cambios generados en la misma pestaña (evento propio) o en otras
 * (evento `storage`, aunque el backend es la fuente de verdad).
 *
 * Además sondea `unread-count` cada 45 s mientras la pestaña está
 * visible, para que una notificación creada en otro dispositivo o pestaña
 * (p. ej. la "Nueva compra" del admin) llegue sin recargar. En pestañas
 * ocultas la pausa con `visibilitychange`.
 *
 * Sonido: suena una sola vez por notificación nueva detectada en
 * runtime (comparando contra los `id` conocidos). Nunca al cargar por
 * primera vez ni dos veces por el mismo `id` (protección ante el doble
 * render de React StrictMode).
 */
const POLLING_INTERVALO_MS = 45_000;

const useNotificaciones = () => {
  const [items, setItems] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(true);

  // `id`s ya vistos. La primera sincronización solo los registra (sin
  // sonar); las siguientes detectan los nuevos y suenan una vez.
  const idsConocidosRef = useRef(new Set());
  const primeraSincronizacionRef = useRef(true);
  // Promesa en curso para deduplicar sincronizaciones concurrentes
  // (doble efecto de StrictMode, polling + evento a la vez, etc.).
  const sincronizacionEnCursoRef = useRef(null);

  const sincronizar = useCallback(() => {
    if (sincronizacionEnCursoRef.current) {
      return sincronizacionEnCursoRef.current;
    }

    const promesa = (async () => {
      const [lista, contador] = await Promise.all([
        listarNotificaciones(),
        contarNoLeidas(),
      ]);

      const conocidos = idsConocidosRef.current;
      const esPrimeraSincronizacion = primeraSincronizacionRef.current;
      primeraSincronizacionRef.current = false;

      const nuevas = lista.filter(
        (notificacion) =>
          notificacion?.id != null &&
          !conocidos.has(String(notificacion.id)) &&
          !notificacion.leida,
      );

      lista.forEach((notificacion) => {
        if (notificacion?.id != null) {
          conocidos.add(String(notificacion.id));
        }
      });

      if (!esPrimeraSincronizacion && nuevas.length > 0) {
        reproducirSonidoNotificacion();
      }

      setItems(lista);
      setNoLeidas(contador);
      setCargando(false);
    })()
      .catch(() => {
        setCargando(false);
      })
      .finally(() => {
        sincronizacionEnCursoRef.current = null;
      });

    sincronizacionEnCursoRef.current = promesa;
    return promesa;
  }, []);

  useEffect(() => {
    sincronizar();

    const handler = () => sincronizar();
    window.addEventListener(NOTIFICACIONES_EVENT, handler);
    window.addEventListener("storage", handler);

    let intervalo = null;
    const iniciarPolling = () => {
      if (intervalo != null) return;
      intervalo = setInterval(() => {
        if (!document.hidden) sincronizar();
      }, POLLING_INTERVALO_MS);
    };
    const detenerPolling = () => {
      if (intervalo != null) {
        clearInterval(intervalo);
        intervalo = null;
      }
    };
    const alCambiarVisibilidad = () => {
      if (document.hidden) {
        detenerPolling();
      } else {
        sincronizar();
        iniciarPolling();
      }
    };

    if (!document.hidden) iniciarPolling();
    document.addEventListener("visibilitychange", alCambiarVisibilidad);

    return () => {
      window.removeEventListener(NOTIFICACIONES_EVENT, handler);
      window.removeEventListener("storage", handler);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      detenerPolling();
    };
  }, [sincronizar]);

  return { items, noLeidas, cargando };
};

export default useNotificaciones;
