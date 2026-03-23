class DeduplicationService {
  /**
   * Sort hierarchy hardcoded optimally prioritizing highly-structured mapping domains
   */
  static sourceRank(apiName) {
    switch(apiName) {
      case 'Wikidata': return 1;
      case 'Wikipedia': return 2;
      case 'GeoNames': return 3;
      default: return 99;
    }
  }

  /**
   * Cleans punctuation, caps, and uneven spacing explicitly standardizing inputs.
   * @param {string} title 
   * @returns {string}
   */
  static normalizeTitle(title) {
    if (!title) return '';
    return title.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
  }

  /**
   * Math algorithm determining ratio overlapping keywords dynamically
   */
  static jaccard(setA, setB) {
    if (setA.size === 0 && setB.size === 0) return 0;
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
  }

  static getJaccardSimilarity(strA, strB) {
    if (!strA && !strB) return 1;
    if (!strA || !strB) return 0;
    const wordsA = new Set(strA.split(' ').filter(w => w.length > 0));
    const wordsB = new Set(strB.split(' ').filter(w => w.length > 0));
    return this.jaccard(wordsA, wordsB);
  }

  /**
   * Calculates distance dynamically natively returning standard Kilometers securely
   */
  static getDistanceKm(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      0.5 - Math.cos(dLat)/2 + 
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      (1 - Math.cos(dLon)) / 2;
    return R * 2 * Math.asin(Math.sqrt(a));
  }

  /**
   * Comprehensive validation mapping exactly to specification overlap boundaries accurately
   */
  static isSimilar(a, b) {
    const normA = this.normalizeTitle(a.rawTitle);
    const normB = this.normalizeTitle(b.rawTitle);

    // Rule 1: Exact matches instantly collide 
    if (normA === normB && normA !== '') return true;

    const jaccardSim = this.getJaccardSimilarity(normA, normB);

    // Rule 2: Over 70% word intersection mapping is identical implicitly
    if (jaccardSim > 0.70) return true;

    // Rule 3: Close geographical proximity (+500m) AND moderate overlapping keywords (>50%)
    const dist = this.getDistanceKm(a.rawLat, a.rawLng, b.rawLat, b.rawLng);
    if (dist <= 0.5 && jaccardSim > 0.50) return true;

    return false;
  }

  /**
   * Analyzes payload arrays stripping redundancies cleanly favoring Wikidata payloads cleanly.
   * @param {RawEvent[]} rawEvents 
   * @returns {RawEvent[]}
   */
  static deduplicate(rawEvents) {
    if (!Array.isArray(rawEvents) || rawEvents.length === 0) return [];

    // Prioritize domains based purely on hardcoded rank parameters
    const sorted = [...rawEvents].sort((a, b) => this.sourceRank(a.sourceApiName) - this.sourceRank(b.sourceApiName));

    const unique = [];
    let dupCount = 0;

    for (const event of sorted) {
      let isDuplicate = false;
      for (const existing of unique) {
        if (this.isSimilar(event, existing)) {
          isDuplicate = true;
          dupCount++;
          break;
        }
      }
      if (!isDuplicate) {
        unique.push(event);
      }
    }

    console.log(`🧹 DeduplicationService finished: Removed ${dupCount} overlapping records.`);
    return unique;
  }
}

module.exports = DeduplicationService;
