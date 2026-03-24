const express = require('express');
const router = express.Router();
const LocationController = require('../controllers/LocationController');

// ─── Health Check ───────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
  });
});

// ─── Timeline Endpoint ─────────────────────────────────────────
router.post('/timeline', (req, res) => LocationController.getTimeline(req, res));

module.exports = router;
