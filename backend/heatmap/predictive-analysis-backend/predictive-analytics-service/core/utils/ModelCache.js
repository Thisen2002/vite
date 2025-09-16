// Simple in-memory model cache
class ModelCache {
  constructor() {
    this.cache = {};
  }
  get(zoneId) {
    return this.cache[zoneId];
  }
  set(zoneId, model) {
    this.cache[zoneId] = model;
  }
}
module.exports = ModelCache;
