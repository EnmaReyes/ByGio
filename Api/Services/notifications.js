const { Op } = require("sequelize");
const { Notificacion } = require("../DataBase/models/index.js");

const parseLimit = (limit) => Math.min(Math.max(Number(limit) || 30, 1), 100);
const parseOffset = (offset) => Math.max(Number(offset) || 0, 0);

// Crea una notificacion. Si se pasa `clave`, se deduplica (no se crea
// una segunda con la misma clave). Devuelve la notificacion existente
// o la nueva.
const createNotification = async ({
  userId,
  tipo = "cuenta",
  titulo,
  texto = null,
  to = null,
  clave = null,
}) => {
  if (!userId || !titulo) return null;

  if (clave) {
    const existente = await Notificacion.findOne({ where: { clave } });
    if (existente) return existente;
  }

  try {
    return await Notificacion.create({
      userId,
      tipo,
      titulo,
      texto,
      to,
      clave,
    });
  } catch (error) {
    // Clave duplicada por carrera: se ignora silenciosamente.
    if (error?.name === "SequelizeUniqueConstraintError") {
      return Notificacion.findOne({ where: { clave } });
    }
    throw error;
  }
};

const listForUser = async ({ userId, limit, offset }) => {
  const safeLimit = parseLimit(limit);
  const safeOffset = parseOffset(offset);

  const { rows, count } = await Notificacion.findAndCountAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
    limit: safeLimit,
    offset: safeOffset,
  });

  const unread = await Notificacion.count({
    where: { userId, leida: false },
  });

  return { notifications: rows, total: count, unread, limit: safeLimit, offset: safeOffset };
};

const countUnread = async (userId) => {
  return Notificacion.count({ where: { userId, leida: false } });
};

const markRead = async ({ id, userId }) => {
  const item = await Notificacion.findOne({ where: { id, userId } });
  if (!item) return null;
  if (!item.leida) {
    item.leida = true;
    await item.save();
  }
  return item;
};

const markAllRead = async (userId) => {
  await Notificacion.update({ leida: true }, { where: { userId, leida: false } });
};

const deleteOne = async ({ id, userId }) => {
  const item = await Notificacion.findOne({ where: { id, userId } });
  if (!item) return null;
  await item.destroy();
  return item;
};

const deleteAll = async (userId) => {
  await Notificacion.destroy({ where: { userId } });
};

module.exports = {
  createNotification,
  listForUser,
  countUnread,
  markRead,
  markAllRead,
  deleteOne,
  deleteAll,
};
