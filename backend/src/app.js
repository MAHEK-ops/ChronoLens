const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const router = require('./routes');

const app = express();

// ─── Middleware (order matters) ─────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// ─── API Routes ─────────────────────────────────────────────────
app.use('/api', router);

// ─── Error Handling ─────────────────────────────────────────────
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

app.use(notFound);
app.use(errorHandler);

module.exports = app;
