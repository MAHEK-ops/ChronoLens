const ScoredEvent = require('../models/ScoredEvent');

class ScoringService {
  /**
   * Intakes explicit weight map structured securely via DB injection cleanly natively mapping across objects.
   * Format: { Wikidata: 0.9, Wikipedia: 0.8, GeoNames: 0.7 }
   * @param {Object} sourceWeights 
   */
  constructor(sourceWeights = {}) {
    this.sourceWeights = sourceWeights;
  }

  /**
   * Algorithms securely defining bounds mathematically converting weight metrics into literal numerical scoring integers efficiently.
   * @param {HistoricalEvent} event 
   * @param {number} weight 
   * @returns {number}
   */
  calculateScore(event, weight) {
    const baseScore = weight * 50;
    let completenessBonus = 0;

    if (event.title && event.title.length > 5) {
      completenessBonus += 10;
    }

    if (event.description && event.description.length > 50) {
      completenessBonus += 15;
    }

    if (event.year !== null && event.year !== undefined) {
      completenessBonus += 15;
    }

    if (event.latitude !== null && event.latitude !== undefined && event.longitude !== null && event.longitude !== undefined) {
      completenessBonus += 10;
    }

    const finalScore = baseScore + completenessBonus;
    return Math.min(100, Math.round(finalScore));
  }

  /**
   * Structurally maps clean instances without polluting domain mutations resolving cleanly onto ScoredEvent matrices.
   * @param {HistoricalEvent[]} events 
   * @returns {ScoredEvent[]}
   */
  score(events) {
    if (!Array.isArray(events)) return [];

    return events.map(event => {
      // Safely default mapping unmapped external interfaces cleanly down to neutral 0.5 parameters.
      const weight = this.sourceWeights[event.sourceName] !== undefined 
          ? this.sourceWeights[event.sourceName]
          : 0.5;

      const calculated = this.calculateScore(event, weight);

      return new ScoredEvent({
        event: event,
        confidenceScore: calculated,
        sourceCount: event.sourceCount || 1, // Fallback respecting mapping
        contributingSources: [event.sourceName]
      });
    });
  }
}

module.exports = ScoringService;
