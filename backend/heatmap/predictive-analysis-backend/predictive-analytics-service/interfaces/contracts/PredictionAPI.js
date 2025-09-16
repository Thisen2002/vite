// API contract for prediction requests
module.exports = {
  request: {
    zoneId: 'string',
    horizons: 'Array<number>'
  },
  response: {
    zoneId: 'string',
    predictions: 'Object',
    confidenceIntervals: 'Object',
    metrics: 'Object'
  }
};
