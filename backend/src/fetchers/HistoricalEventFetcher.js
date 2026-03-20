const axios = require('axios');

class HistoricalEventFetcher {
  constructor(source) {
    if (new.target === HistoricalEventFetcher) {
      throw new Error('Abstract class — cannot instantiate directly');
    }
    this.source = source;
    this.axiosInstance = axios.create({ timeout: 8000 });
  }

  async fetchByCoordinates(lat, lng, radiusKm) {
    throw new Error(`${this.constructor.name} must implement fetchByCoordinates()`);
  }

  parseResponse(data) {
    throw new Error(`${this.constructor.name} must implement parseResponse()`);
  }

  isAvailable() {
    return this.source?.isActive === true;
  }

  async fetchWithRetry(url, params, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await this.axiosInstance.get(url, { params });
        return res.data;
      } catch (err) {
        if (attempt === retries) throw err;
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
}

module.exports = HistoricalEventFetcher;
