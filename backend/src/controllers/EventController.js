const EventRepository = require('../repositories/EventRepository');
const LocationRepository = require('../repositories/LocationRepository');

// ─── EventController ────────────────────────────────────────────
// Handles filtered event queries and map viewport spatial lookups.

class EventController {
  /**
   * GET /api/events
   * Retrieve events for a location with optional filters.
   *
   * Query params:
   *   locationId (required) — positive integer
   *   category   (optional) — exact category match
   *   era        (optional) — exact era match
   *   keyword    (optional) — searches title AND description
   *   yearFrom   (optional) — minimum year (inclusive)
   *   yearTo     (optional) — maximum year (inclusive)
   *
   * Response: { success, count, events }
   */
  async getEvents(req, res) {
    try {
      const { locationId, category, era, keyword, yearFrom, yearTo } = req.query;

      // ── Validate locationId ──
      const parsedLocationId = parseInt(locationId, 10);

      if (!locationId || isNaN(parsedLocationId) || parsedLocationId <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Query parameter "locationId" is required and must be a positive integer.',
        });
      }

      // ── Verify location exists in DB ──
      const location = await LocationRepository.findById(parsedLocationId);
      if (!location) {
        return res.status(404).json({
          success: false,
          error: `Location with id ${parsedLocationId} not found.`,
        });
      }

      // ── Build filters object (all optional) ──
      const filters = {};
      if (category) filters.category = category;
      if (era) filters.era = era;
      if (keyword) filters.keyword = keyword;
      if (yearFrom != null && yearFrom !== '') filters.yearFrom = Number(yearFrom);
      if (yearTo != null && yearTo !== '') filters.yearTo = Number(yearTo);

      // ── Query via repository ──
      const events = await EventRepository.findFiltered(parsedLocationId, filters);

      return res.status(200).json({
        success: true,
        count: events.length,
        events: events.map(e => (typeof e.toJSON === 'function' ? e.toJSON() : e)),
      });

    } catch (err) {
      console.error('🔴 EventController.getEvents unexpected error:', err);
      return res.status(500).json({
        success: false,
        error: 'An unexpected error occurred while fetching events.',
      });
    }
  }

  /**
   * GET /api/events/viewport
   * Retrieve events whose PostGIS coordinates fall within a bounding box.
   *
   * Query params (all required):
   *   north — max latitude
   *   south — min latitude
   *   east  — max longitude
   *   west  — min longitude
   *
   * Response: { success, count, events }
   */
  async getEventsByViewport(req, res) {
    try {
      const { north, south, east, west } = req.query;

      // ── Validate all 4 bbox params are present and numeric ──
      if (north == null || south == null || east == null || west == null) {
        return res.status(400).json({
          success: false,
          error: 'All bounding box parameters are required: "north", "south", "east", "west".',
        });
      }

      const n = parseFloat(north);
      const s = parseFloat(south);
      const e = parseFloat(east);
      const w = parseFloat(west);

      if ([n, s, e, w].some(isNaN)) {
        return res.status(400).json({
          success: false,
          error: 'All bounding box parameters must be valid numbers.',
        });
      }

      if (n <= s) {
        return res.status(400).json({
          success: false,
          error: '"north" must be greater than "south".',
        });
      }

      if (e <= w) {
        return res.status(400).json({
          success: false,
          error: '"east" must be greater than "west".',
        });
      }

      // ── PostGIS spatial query ──
      const events = await EventRepository.findInViewport(n, s, e, w);

      return res.status(200).json({
        success: true,
        count: events.length,
        events: events.map(ev => (typeof ev.toJSON === 'function' ? ev.toJSON() : ev)),
      });

    } catch (err) {
      console.error('🔴 EventController.getEventsByViewport unexpected error:', err);
      return res.status(500).json({
        success: false,
        error: 'An unexpected error occurred while fetching viewport events.',
      });
    }
  }
}

module.exports = new EventController();
