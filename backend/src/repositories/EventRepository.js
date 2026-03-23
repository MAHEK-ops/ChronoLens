const prisma = require('../db/prisma');
const HistoricalEvent = require('../models/HistoricalEvent');

// ─── EventRepository ────────────────────────────────────────────
// All DB access for HistoricalEvent records — bulk save,
// filtered queries, and PostGIS viewport queries.

class EventRepository {
  /**
   * Bulk upsert events for a given location.
   * Uses createMany with skipDuplicates, then synchronizes PostGIS
   * geometry coordinates for every saved record.
   * @param {HistoricalEvent[]} events - Domain model instances to persist
   * @param {number} locationId - FK reference to Location table
   * @returns {Promise<number>} Count of records inserted
   */
  async saveAll(events, locationId) {
    if (!Array.isArray(events) || events.length === 0) return 0;

    const data = events.map(event => ({
      locationId,
      title: event.title,
      description: event.description || null,
      year: event.year ?? null,
      dateDisplay: event.dateDisplay || null,
      category: event.category || 'UNKNOWN',
      era: event.era || 'UNKNOWN',
      latitude: event.latitude ?? null,
      longitude: event.longitude ?? null,
      sourceUrl: event.sourceUrl || null,
      sourceName: event.sourceName || null,
      confidenceScore: event.confidenceScore ?? 0,
      sourceCount: event.sourceCount ?? 1,
    }));

    // Phase 1: Bulk insert — skipDuplicates avoids collision on retries
    const result = await prisma.historicalEvent.createMany({
      data,
      skipDuplicates: true,
    });

    console.log(`💾 EventRepository.saveAll: Inserted ${result.count} events for locationId=${locationId}`);

    // Phase 2: Sync PostGIS coordinates for all events belonging to this location
    // that have valid lat/lng but missing geometry column values
    await prisma.$executeRaw`
      UPDATE "HistoricalEvent"
      SET coordinates = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
      WHERE "locationId" = ${locationId}
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND coordinates IS NULL
    `;

    return result.count;
  }

  /**
   * Retrieve all events linked to a specific location.
   * @param {number} locationId
   * @returns {Promise<HistoricalEvent[]>}
   */
  async findByLocationId(locationId) {
    const rows = await prisma.historicalEvent.findMany({
      where: { locationId },
      orderBy: { year: 'asc' },
    });

    return rows.map(row => new HistoricalEvent(row));
  }

  /**
   * Retrieve events for a location with dynamic filtering.
   * Supports filtering by category, era, keyword (title + description),
   * and year range (yearFrom / yearTo).
   * @param {number} locationId
   * @param {Object} filters
   * @param {string}  [filters.category]  - Exact category match
   * @param {string}  [filters.era]       - Exact era match
   * @param {string}  [filters.keyword]   - Searches title AND description (case-insensitive)
   * @param {number}  [filters.yearFrom]  - Minimum year (inclusive)
   * @param {number}  [filters.yearTo]    - Maximum year (inclusive)
   * @returns {Promise<HistoricalEvent[]>}
   */
  async findFiltered(locationId, filters = {}) {
    const where = { locationId };

    // Category filter
    if (filters.category) {
      where.category = filters.category;
    }

    // Era filter
    if (filters.era) {
      where.era = filters.era;
    }

    // Keyword filter — searches both title AND description (OR)
    if (filters.keyword) {
      const keyword = filters.keyword;
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    // Year range filters
    if (filters.yearFrom != null || filters.yearTo != null) {
      where.year = {};
      if (filters.yearFrom != null) {
        where.year.gte = Number(filters.yearFrom);
      }
      if (filters.yearTo != null) {
        where.year.lte = Number(filters.yearTo);
      }
    }

    const rows = await prisma.historicalEvent.findMany({
      where,
      orderBy: { year: 'asc' },
    });

    return rows.map(row => new HistoricalEvent(row));
  }

  /**
   * Find all events whose PostGIS coordinates fall within
   * the specified bounding-box viewport.
   * Uses ST_Within + ST_MakeEnvelope with SRID 4326.
   * @param {number} north - Max latitude
   * @param {number} south - Min latitude
   * @param {number} east  - Max longitude
   * @param {number} west  - Min longitude
   * @returns {Promise<HistoricalEvent[]>}
   */
  async findInViewport(north, south, east, west) {
    const rows = await prisma.$queryRaw`
      SELECT * FROM "HistoricalEvent"
      WHERE ST_Within(
        coordinates,
        ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326)
      )
      ORDER BY year ASC
    `;

    return rows.map(row => new HistoricalEvent(row));
  }
}

module.exports = new EventRepository();
