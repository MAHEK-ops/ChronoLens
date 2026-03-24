const express = require('express');
const router = express.Router();
const LocationController = require('../controllers/LocationController');
const EventController = require('../controllers/EventController');

// ─── Health Check ───────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
  });
});

// ─── Timeline Endpoint ─────────────────────────────────────────
router.post('/timeline', (req, res) => LocationController.getTimeline(req, res));

// ─── Event Endpoints ────────────────────────────────────────────
router.get('/events/viewport', (req, res) => EventController.getEventsByViewport(req, res));
router.get('/events', (req, res) => EventController.getEvents(req, res));

module.exports = router;
