import { useCallback, useEffect, useState } from "react";
import {
  contarNoLeidas,
  listarNotificaciones,
  NOTIFICACIONES_EVENT,
} from "../Componentes/notificaciones";

/*
 * Consume las notificaciones del backend y se mantiene al día ante
 * cambios generados en la misma pestaña (evento propio) o en otras
 * (evento `storage`, aunque el backend es la fuente de verdad).
 */
const useNotificaciones = () => {
  const [items, setItems] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(true);

  const sincronizar = useCallback(async () => {
    const [lista, contador] = await Promise.all([
      listarNotificaciones(),
      contarNoLeidas(),
    ]);
    setItems(lista);
    setNoLeidas(contador);
    setCargando(false);
  }, []);

  useEffect(() => {
    sincronizar();
    const handler = () => sincronizar();
    window.addEventListener(NOTIFICACIONES_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(NOTIFICACIONES_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, [sincronizar]);

  return { items, noLeidas, cargando };
};

export default useNotificaciones;
