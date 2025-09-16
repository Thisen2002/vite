// Generates synthetic crowd data for testing
// class MockDataGenerator {
//   static generate(zoneId, length = 100) {
//     const timestamps = Array.from({ length }, (_, i) => new Date(Date.now() - (length - i) * 60000).toISOString());
//     const values = Array.from({ length }, () => Math.floor(50 + Math.random() * 100));
//     return { zoneId, timestamps, values };
//   }
// }
// module.exports = MockDataGenerator;

const zoneId = 'zoneA';
const timestamps = [
  "2025-09-04T10:00:00Z",
  "2025-09-04T10:01:00Z",
  "2025-09-04T10:02:00Z",
  "2025-09-04T10:03:00Z",
  "2025-09-04T10:04:00Z"
];
const values = [100, 105, 110, 120, 125];




/*
// Example: data received from another backend
const zoneId = req.body.zoneId;
const timestamps = req.body.timestamps;
const values = req.body.values;

const timeSeriesData = new TimeSeriesData(zoneId, timestamps, values);
const result = engine.predict(timeSeriesData, predictionRequest);
*/