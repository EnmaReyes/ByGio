// Sincroniza el estado de un pedido entre pestanas.
//
// El pago con Wompi se abre en una pestana nueva. Cuando esa pestana vuelve al
// sitio y confirma el pago, avisa por aqui; la pestana original (la que quedo en
// el sitio) recarga el pedido sola, sin que el usuario tenga que refrescar a
// mano. Tambien se recarga al recuperar el foco de la ventana, como respaldo
// por si el aviso no llego (pestana suspendida, navegador sin BroadcastChannel).

const CHANNEL = "bygio:orders";

const canBroadcast = typeof BroadcastChannel !== "undefined";

let channel = null;
const getChannel = () => {
  if (!canBroadcast) return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL);
  return channel;
};

// Avisa a las demas pestanas que un pedido cambio (p. ej. se aprobo el pago).
export const notifyOrderUpdated = (orderId) => {
  if (!orderId) return;

  const ch = getChannel();
  if (ch) {
    ch.postMessage({ type: "order-updated", orderId });
    return;
  }

  // Respaldo sin BroadcastChannel: localStorage + evento "storage".
  try {
    localStorage.setItem(`${CHANNEL}:${orderId}`, String(Date.now()));
  } catch {
    // Sin almacenamiento disponible: no hay forma de avisar.
  }
};

// Escucha avisos de cambio para un pedido concreto. Devuelve la funcion para
// dejar de escuchar.
export const subscribeOrderUpdated = (orderId, callback) => {
  if (!orderId) return () => {};

  const ch = getChannel();
  const onMessage = (event) => {
    const data = event?.data;
    if (data?.type === "order-updated" && data.orderId === orderId) {
      callback();
    }
  };

  const onStorage = (event) => {
    if (event.key === `${CHANNEL}:${orderId}`) callback();
  };

  if (ch) ch.addEventListener("message", onMessage);
  window.addEventListener("storage", onStorage);

  return () => {
    if (ch) ch.removeEventListener("message", onMessage);
    window.removeEventListener("storage", onStorage);
  };
};

// Igual que subscribeOrderUpdated, pero ademas recarga al recuperar el foco.
export const subscribeOrderRefresh = (orderId, callback) => {
  const unsubscribe = subscribeOrderUpdated(orderId, callback);
  const onFocus = () => callback();
  window.addEventListener("focus", onFocus);

  return () => {
    unsubscribe();
    window.removeEventListener("focus", onFocus);
  };
};

// Escucha cambios en CUALQUIER pedido (para la lista) y recarga al enfocar.
export const subscribeOrdersRefresh = (callback) => {
  const ch = getChannel();

  const onMessage = (event) => {
    if (event?.data?.type === "order-updated") callback();
  };
  const onStorage = (event) => {
    if (typeof event.key === "string" && event.key.startsWith(`${CHANNEL}:`)) {
      callback();
    }
  };
  const onFocus = () => callback();

  if (ch) ch.addEventListener("message", onMessage);
  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", onFocus);

  return () => {
    if (ch) ch.removeEventListener("message", onMessage);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("focus", onFocus);
  };
};
