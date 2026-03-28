class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // To distinguish between operational errors and programming bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
