const rateLimit = require('express-rate-limit');

const timelineLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per `window`
  message: {
    success: false,
    error: 'Too many requests. Please wait.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: {
    success: false,
    error: 'Too many requests. Please wait.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  timelineLimiter,
  generalLimiter,
};
