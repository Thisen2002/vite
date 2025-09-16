// Represents raw crowd data for a zone
class TimeSeriesData {
  constructor(zoneId, timestamps, values) {
    this.zoneId = zoneId;
    this.timestamps = timestamps; // Array of Date or ISO strings
    this.values = values; // Array of crowd counts
  }
}
module.exports = TimeSeriesData;
