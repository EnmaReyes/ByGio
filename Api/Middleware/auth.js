const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config.js");

// Middleware de autenticacion basado en la cookie httpOnly existente
// (access_token). No cambia el formato del token: { id, admin }.
//
// Nota: el flag admin viaja en el JWT emitido al iniciar sesion. La mejora
// de administracion (rol persistido y revalidado) queda para la fase final.

const getToken = (req) => req.cookies?.access_token;

const requireAuth = (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json("No estás autenticado");
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, admin: Boolean(payload.admin) };
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json("Sesión expirada");
    }
    return res.status(403).json("Token no válido");
  }
};

// Verifica la sesion y el rol de administrador en una sola pieza: puede usarse
// solo (rutas de catalogo) o despues de requireAuth (panel admin).
const requireAdmin = (req, res, next) => {
  const checkRole = () => {
    if (!req.user) {
      return res.status(401).json("No estás autenticado");
    }
    if (!req.user.admin) {
      return res.status(403).json("No tienes permisos de administrador");
    }
    return next();
  };

  if (req.user) return checkRole();
  return requireAuth(req, res, checkRole);
};

// No bloquea: solo adjunta req.user si hay cookie valida.
const optionalAuth = (req, res, next) => {
  const token = getToken(req);
  if (!token) return next();

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, admin: Boolean(payload.admin) };
  } catch {
    // token invalido en ruta publica: se ignora
  }
  return next();
};

module.exports = { requireAuth, requireAdmin, optionalAuth };
