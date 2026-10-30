/*
 * Notificaciones del panel (fuente: backend).
 *
 * El backend genera las notificaciones ante eventos de pedidos y de la
 * cuenta; aquí solo se consumen y gestionan (leer, marcar, limpiar).
 * `agregarNotificacion` se mantiene por compatibilidad: delega al
 * backend (con deduplicación por `clave`) y avisa a la UI para refrescar.
 */

import axios from "axios";
import { API_URL } from "../config";

export const NOTIFICACIONES_EVENT = "bygio:notificaciones";

const withCreds = { withCredentials: true };

// Dispara el evento de refresco para que el hook y la barra lateral
// vuelvan a consultar al backend.
const avisar = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICACIONES_EVENT));
  }
};

// Lista de notificaciones del usuario autenticado.
export const listarNotificaciones = async ({ limit = 50, offset = 0 } = {}) => {
  try {
    const res = await axios.get(`${API_URL}/api/notifications`, {
      params: { limit, offset },
      ...withCreds,
    });
    const data = res.data || {};
    return Array.isArray(data.notifications) ? data.notifications : [];
  } catch {
    return [];
  }
};

export const contarNoLeidas = async () => {
  try {
    const res = await axios.get(`${API_URL}/api/notifications/unread-count`, withCreds);
    return Number(res.data?.count) || 0;
  } catch {
    return 0;
  }
};

export const agregarNotificacion = async ({
  tipo = "cuenta",
  titulo,
  texto = "",
  to = null,
  clave = null,
}) => {
  if (!titulo) return null;

  try {
    await axios.post(
      `${API_URL}/api/notifications`,
      { tipo, titulo, texto, to, clave },
      withCreds,
    );
    avisar();
  } catch {
    /* fallo silencioso: la notificación ya pudo haberse creado en el backend */
  }
  return null;
};

export const marcarLeida = async (id) => {
  if (!id) return;
  try {
    await axios.patch(`${API_URL}/api/notifications/${id}/read`, null, withCreds);
    avisar();
  } catch {
    /* silencioso */
  }
};

export const marcarTodasLeidas = async () => {
  try {
    await axios.patch(`${API_URL}/api/notifications/read-all`, null, withCreds);
    avisar();
  } catch {
    /* silencioso */
  }
};

export const limpiarNotificaciones = async () => {
  try {
    await axios.delete(`${API_URL}/api/notifications`, withCreds);
    avisar();
  } catch {
    /* silencioso */
  }
};
