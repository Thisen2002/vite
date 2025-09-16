// Cleans and prepares time series data
class DataPreprocessor {
  static clean(data) {
    // Remove nulls, smooth, normalize, etc.
    const cleanedValues = data.values.map(v => (v == null ? 0 : v));
    return { ...data, values: cleanedValues };
  }
}
module.exports = DataPreprocessor;
