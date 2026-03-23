const Category = require('../constants/Category');
const Era = require('../constants/Era');
const eraFromYear = require('../utils/eraFromYear');

const KEYWORDS = {
  [Category.WAR_BATTLE]: ['war','battle','siege','conquest','invasion','army','military','troops','fought','defeated','rebellion','revolt','massacre','conflict','attack'],
  [Category.POLITICS]: ['king','queen','emperor','dynasty','rule','founded','independence','treaty','government','empire','colony','colonial','revolution','election','president','parliament'],
  [Category.SCIENCE_INNOVATION]: ['discovered','invention','scientist','research','university','laboratory','experiment','telescope','theory','published','institute','technology'],
  [Category.CULTURE_ART]: ['temple','mosque','church','monument','painting','music','festival','literature','poet','artist','architecture','built','constructed','heritage'],
  [Category.DISASTER]: ['earthquake','flood','famine','plague','epidemic','fire','drought','tsunami','cyclone','disaster','destroyed','collapsed'],
  [Category.FAMOUS_BIRTH_DEATH]: ['born','birth','died','death','birthplace','buried','assassination','executed']
};

// Enforced explicit tie-breaker ranking logically cleanly natively
const TIE_BREAKER_PRIORITY = [
  Category.WAR_BATTLE,
  Category.POLITICS,
  Category.DISASTER,
  Category.SCIENCE_INNOVATION,
  Category.CULTURE_ART,
  Category.FAMOUS_BIRTH_DEATH
];

class CategorizationService {
  /**
   * Tracks structural hits against arrays sequentially matching lower-bound string conversions
   * @param {HistoricalEvent} event 
   * @returns {string} 
   */
  static classifyEvent(event) {
    // Merge structural analysis payloads dynamically extracting text blocks seamlessly
    const textBlob = `${event.title || ''} ${event.description || ''}`.toLowerCase();
    
    // Quick exit preventing needless string intersections mapping natively
    if (textBlob.trim() === '') return Category.UNKNOWN;

    const scores = new Map();
    let maxScore = 0;

    for (const [category, words] of Object.entries(KEYWORDS)) {
      let hits = 0;
      for (const word of words) {
        // Enforce word boundary regex tracking exact strings dynamically avoiding sub-string corruptions
        const regex = new RegExp(`\\b${word}\\b`, 'g');
        const matches = textBlob.match(regex);
        if (matches) {
          hits += matches.length;
        }
      }
      scores.set(category, hits);
      if (hits > maxScore) maxScore = hits;
    }

    if (maxScore === 0) {
      return Category.UNKNOWN;
    }

    // Isolate highest-scoring nodes reliably sorting them correctly resolving structural boundary tie-breakers
    const topCategories = Array.from(scores.entries())
      .filter(([_, score]) => score === maxScore)
      .map(([cat]) => cat);

    if (topCategories.length === 1) {
      return topCategories[0];
    }

    // Tie-breaker algorithm explicitly targeting hardcoded priorities traversing hierarchies
    for (const priorityCat of TIE_BREAKER_PRIORITY) {
      if (topCategories.includes(priorityCat)) {
        return priorityCat;
      }
    }

    return Category.UNKNOWN;
  }

  /**
   * Automates era-from-year mapping securely tracking missing parameters cleanly.
   * @param {HistoricalEvent} event 
   */
  static assignEra(event) {
    if (event.year == null) {
      event.era = Era.UNKNOWN;
    } else {
      event.era = eraFromYear(event.year);
    }
  }

  /**
   * Mutates event arrays securely wrapping domains natively binding contextual categories explicitly!
   * @param {HistoricalEvent[]} events 
   * @returns {HistoricalEvent[]}
   */
  static categorize(events) {
    if (!Array.isArray(events)) return [];

    for (const event of events) {
      event.category = this.classifyEvent(event);
      this.assignEra(event);
    }

    return events;
  }
}

module.exports = CategorizationService;
