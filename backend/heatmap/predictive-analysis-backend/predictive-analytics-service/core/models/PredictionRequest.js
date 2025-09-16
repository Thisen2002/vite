// Input parameters for forecasting
class PredictionRequest {
  constructor(zoneId, horizons) {
    this.zoneId = zoneId;
    this.horizons = horizons; // Array of minutes ahead to predict
  }
}
module.exports = PredictionRequest;
