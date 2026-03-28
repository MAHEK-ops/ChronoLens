// ─── Not Found Middleware ───────────────────────────────────────
// Catches all requests to undefined routes and forwards a 404 AppError

const AppError = require('../utils/AppError');

const notFound = (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
};

module.exports = notFound;
