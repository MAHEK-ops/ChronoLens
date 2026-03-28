const express = require('express');
const router = express.Router();
const LocationController = require('../controllers/LocationController');
const EventController = require('../controllers/EventController');
const BookmarkController = require('../controllers/BookmarkController');
const validate = require('../middleware/validate');
const timelineSchema = require('../validation/timelineSchema');
const { timelineLimiter, generalLimiter } = require('../middleware/rateLimiter');

// ─── Global Rate Limiter ────────────────────────────────────────
// Applies generalLimiter to all routes EXCEPT POST /timeline
router.use((req, res, next) => {
  if (req.path === '/timeline' && req.method === 'POST') {
    return next();
  }
  return generalLimiter(req, res, next);
});

// ─── Health Check ───────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
  });
});

router.post('/timeline', timelineLimiter, validate(timelineSchema), (req, res, next) => LocationController.getTimeline(req, res, next));
router.get('/timeline/:locationId/story', (req, res, next) => LocationController.getStory(req, res, next));

// ─── Event Endpoints ────────────────────────────────────────────
router.get('/events/viewport', (req, res, next) => EventController.getEventsByViewport(req, res, next));
router.get('/events', (req, res, next) => EventController.getEvents(req, res, next));

// ─── Compare Endpoint ──────────────────────────────────────────
router.get('/compare', (req, res, next) => EventController.compareLocations(req, res, next));

// ─── Trends Endpoint ───────────────────────────────────────────
router.get('/trends/:locationId', (req, res, next) => EventController.getTrends(req, res, next));

// ─── Bookmark Endpoints ────────────────────────────────────────
router.post('/bookmarks', (req, res, next) => BookmarkController.save(req, res, next));
router.get('/bookmarks/:userId', (req, res, next) => BookmarkController.getByUserId(req, res, next));
router.delete('/bookmarks/:id', (req, res, next) => BookmarkController.delete(req, res, next));

module.exports = router;

