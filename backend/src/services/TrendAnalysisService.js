const EventRepository = require('../repositories/EventRepository');

// ─── TrendAnalysisService ───────────────────────────────────────
// Computes category and era breakdowns with percentages and
// timespan data for a location's historical events — designed
// for frontend bar chart consumption.

class TrendAnalysisService {
  /**
   * Analyze trends for a given location's events.
   * @param {number} locationId
   * @returns {Promise<Object>} Trend analysis with breakdowns and timespan
   */
  static async analyze(locationId) {
    const events = await EventRepository.findByLocationId(locationId);
    const totalCount = events.length;

    // ── Empty location — return zeroed response ──
    if (totalCount === 0) {
      return {
        dominantCategory: null,
        dominantEra: null,
        categoryBreakdown: [],
        eraBreakdown: [],
        timespan: { earliest: null, latest: null, spanYears: 0 },
      };
    }

    // ── Category breakdown ──
    const categoryCounts = {};
    for (const event of events) {
      const cat = event.category || 'UNKNOWN';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }

    const categoryBreakdown = Object.entries(categoryCounts)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / totalCount) * 1000) / 10,
      }))
      .sort((a, b) => b.count - a.count);

    // ── Era breakdown ──
    const eraCounts = {};
    for (const event of events) {
      const era = event.era || 'UNKNOWN';
      eraCounts[era] = (eraCounts[era] || 0) + 1;
    }

    const eraBreakdown = Object.entries(eraCounts)
      .map(([era, count]) => ({
        era,
        count,
        percentage: Math.round((count / totalCount) * 1000) / 10,
      }))
      .sort((a, b) => b.count - a.count);

    // ── Dominant values ──
    const dominantCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0].category : null;
    const dominantEra = eraBreakdown.length > 0 ? eraBreakdown[0].era : null;

    // ── Timespan ──
    const years = events.map(e => e.year).filter(y => y != null);
    let timespan;

    if (years.length > 0) {
      const earliest = Math.min(...years);
      const latest = Math.max(...years);
      timespan = {
        earliest,
        latest,
        spanYears: latest - earliest,
      };
    } else {
      timespan = { earliest: null, latest: null, spanYears: 0 };
    }

    return {
      dominantCategory,
      dominantEra,
      categoryBreakdown,
      eraBreakdown,
      timespan,
    };
  }
}

module.exports = TrendAnalysisService;
