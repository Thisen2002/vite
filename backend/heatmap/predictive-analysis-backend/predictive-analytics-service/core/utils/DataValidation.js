
// DataValidation is a utility class for checking if input data is valid
class DataValidation {
  /**
   * Checks if the input data object has a valid 'values' array
   * @param {Object} data - The input data object (should have a 'values' property)
   * @returns {boolean} - True if 'values' is a non-empty array, false otherwise
   */
  static validate(data) {
    // Ensure 'values' exists, is an array, and is not empty
    return Array.isArray(data.values) && data.values.length > 0;
  }
}

// Export the DataValidation class for use in data preprocessing and input checks
module.exports = DataValidation;
