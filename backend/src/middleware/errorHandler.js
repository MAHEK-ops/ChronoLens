// ─── Global Error Handler ───────────────────────────────────────
// Formats all errors consistently as JSON. Prevents server crashes
// and HTML error pages.

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  
  const response = {
    success: false,
    error: err.message || 'An unexpected error occurred.',
  };

  // Include stack trace only in development
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(err.statusCode).json(response);
};

module.exports = errorHandler;
