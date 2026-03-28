const EventRepository = require('../repositories/EventRepository');
const LocationRepository = require('../repositories/LocationRepository');
const CompareService = require('../services/CompareService');
const TrendAnalysisService = require('../services/TrendAnalysisService');
const AppError = require('../utils/AppError');

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
  async getEvents(req, res, next) {
    try {
      const { locationId, category, era, keyword, yearFrom, yearTo } = req.query;

      // ── Validate locationId ──
      const parsedLocationId = parseInt(locationId, 10);

      if (!locationId || isNaN(parsedLocationId) || parsedLocationId <= 0) {
        throw new AppError('Query parameter "locationId" is required and must be a positive integer.', 400);
      }

      // ── Verify location exists in DB ──
      const location = await LocationRepository.findById(parsedLocationId);
      if (!location) {
        throw new AppError(`Location with id ${parsedLocationId} not found.`, 404);
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
      if (err instanceof AppError) return next(err);
      console.error('🔴 EventController.getEvents unexpected error:', err);
      return next(new AppError('An unexpected error occurred while fetching events.', 500));
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
  async getEventsByViewport(req, res, next) {
    try {
      const { north, south, east, west } = req.query;

      // ── Validate all 4 bbox params are present and numeric ──
      if (north == null || south == null || east == null || west == null) {
        throw new AppError('All bounding box parameters are required: "north", "south", "east", "west".', 400);
      }

      const n = parseFloat(north);
      const s = parseFloat(south);
      const e = parseFloat(east);
      const w = parseFloat(west);

      if ([n, s, e, w].some(isNaN)) {
        throw new AppError('All bounding box parameters must be valid numbers.', 400);
      }

      if (n <= s) {
        throw new AppError('"north" must be greater than "south".', 400);
      }

      if (e <= w) {
        throw new AppError('"east" must be greater than "west".', 400);
      }

      // ── PostGIS spatial query ──
      const events = await EventRepository.findInViewport(n, s, e, w);

      return res.status(200).json({
        success: true,
        count: events.length,
        events: events.map(ev => (typeof ev.toJSON === 'function' ? ev.toJSON() : ev)),
      });

    } catch (err) {
      if (err instanceof AppError) return next(err);
      console.error('🔴 EventController.getEventsByViewport unexpected error:', err);
      return next(new AppError('An unexpected error occurred while fetching viewport events.', 500));
    }
  }

  /**
   * GET /api/compare
   * Side-by-side historical richness comparison of two locations.
   *
   * Query params:
   *   location1 (required) — positive integer location ID
   *   location2 (required) — positive integer location ID
   *
   * Response: { success, comparison: { location1: {...}, location2: {...} } }
   */
  async compareLocations(req, res, next) {
    try {
      const { location1, location2 } = req.query;

      const id1 = parseInt(location1, 10);
      const id2 = parseInt(location2, 10);

      // ── Validate both IDs ──
      if (!location1 || !location2 || isNaN(id1) || isNaN(id2) || id1 <= 0 || id2 <= 0) {
        throw new AppError('Both "location1" and "location2" query parameters are required and must be positive integers.', 400);
      }

      // ── Verify both locations exist ──
      const [loc1, loc2] = await Promise.all([
        LocationRepository.findById(id1),
        LocationRepository.findById(id2),
      ]);

      if (!loc1) {
        throw new AppError(`Location with id ${id1} not found.`, 404);
      }

      if (!loc2) {
        throw new AppError(`Location with id ${id2} not found.`, 404);
      }

      // ── Compute comparison ──
      const comparison = await CompareService.compare(id1, id2);

      // Enrich with place names
      comparison.location1.placeName = loc1.placeName || loc1.address || null;
      comparison.location2.placeName = loc2.placeName || loc2.address || null;

      return res.status(200).json({
        success: true,
        comparison,
      });

    } catch (err) {
      if (err instanceof AppError) return next(err);
      console.error('🔴 EventController.compareLocations unexpected error:', err);
      return next(new AppError('An unexpected error occurred while comparing locations.', 500));
    }
  }

  /**
   * GET /api/trends/:locationId
   * Category and era breakdown for a location's historical events.
   *
   * Response: { success, locationId, placeName, dominantCategory, dominantEra,
   *             categoryBreakdown, eraBreakdown, timespan }
   */
  async getTrends(req, res, next) {
    try {
      const { locationId } = req.params;
      const parsedId = parseInt(locationId, 10);

      if (isNaN(parsedId) || parsedId <= 0) {
        throw new AppError('"locationId" must be a positive integer.', 400);
      }

      // Verify location exists
      const location = await LocationRepository.findById(parsedId);
      if (!location) {
        throw new AppError(`Location with id ${parsedId} not found.`, 404);
      }

      const analysis = await TrendAnalysisService.analyze(parsedId);

      return res.status(200).json({
        success: true,
        locationId: parsedId,
        placeName: location.placeName || location.address || null,
        ...analysis,
      });

    } catch (err) {
      if (err instanceof AppError) return next(err);
      console.error('🔴 EventController.getTrends unexpected error:', err);
      return next(new AppError('An unexpected error occurred while analyzing trends.', 500));
    }
  }
}

module.exports = new EventController();
