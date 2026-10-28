const HttpError = require("./HttpError.js");

// Responde errores respetando la convencion actual de la API:
// strings planos para mensajes de negocio y 500 generico para lo inesperado.
const sendError = (res, error, fallback = "Error interno del servidor") => {
  if (error instanceof HttpError) {
    return res.status(error.status).json(error.message);
  }

  if (error?.name === "SequelizeValidationError") {
    const detalle = error.errors?.[0]?.message;
    return res.status(400).json(detalle || "Datos invalidos");
  }

  if (error?.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json("El registro ya existe");
  }

  if (error?.name === "JsonWebTokenError" || error?.name === "TokenExpiredError") {
    return res.status(403).json("Token no válido");
  }

  console.error(error);
  return res.status(500).json(fallback);
};

module.exports = { sendError };
