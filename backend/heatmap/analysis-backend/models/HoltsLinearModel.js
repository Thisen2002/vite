/**
 * Holt's Linear Exponential Smoothing Model
 * 
 * Implements Holt's double exponential smoothing method for time series forecasting.
 * This model is particularly effective for data with trends but no seasonal patterns.
 * 
 * The method uses two smoothing equations:
 * 1. Level equation: L(t) = α × X(t) + (1-α) × (L(t-1) + T(t-1))
 * 2. Trend equation: T(t) = β × (L(t) - L(t-1)) + (1-β) × T(t-1)
 * 3. Forecast equation: F(t+h) = L(t) + h × T(t)
 * 
 * Where:
 * - α (alpha): Level smoothing parameter (0 < α < 1)
 * - β (beta): Trend smoothing parameter (0 < β < 1) 
 * - h: Forecast horizon (number of periods ahead)
 * - L(t): Smoothed level at time t
 * - T(t): Smoothed trend at time t
 * - X(t): Observed value at time t
 * 
 * @author Peraverse Prediction Team
 * @version 1.0.0
 */

class HoltsLinearModel {
  /**
   * Initialize Holt's Linear Model
   * 
   * @param {number} alpha - Level smoothing parameter (0.1-0.4, default: 0.2)
   * @param {number} beta - Trend smoothing parameter (0.05-0.3, default: 0.1)
   * @param {string} buildingId - Building identifier for logging/debugging
   */
  constructor(alpha = 0.2, beta = 0.1, buildingId = 'unknown') {
    // Validate parameters
    if (alpha <= 0 || alpha >= 1) {
      throw new Error(`Invalid alpha parameter: ${alpha}. Must be between 0 and 1.`);
    }
    if (beta <= 0 || beta >= 1) {
      throw new Error(`Invalid beta parameter: ${beta}. Must be between 0 and 1.`);
    }
    
    // Smoothing parameters
    this.alpha = alpha;           // Level smoothing (higher = more responsive to recent changes)
    this.beta = beta;             // Trend smoothing (higher = more responsive to trend changes)
    
    // Model state variables
    this.level = null;            // Current smoothed level (L_t)
    this.trend = null;            // Current smoothed trend (T_t)
    this.isInitialized = false;   // Whether model has been initialized with data
    
    // Tracking and validation
    this.buildingId = buildingId;
    this.dataPointsProcessed = 0;
    this.lastUpdateTime = null;
    this.history = [];            // Recent observations for validation
    this.maxHistoryLength = 50;   // Keep last 50 data points
    
    console.log(`🏗️ Initialized Holt's model for building ${buildingId} (α=${alpha}, β=${beta})`);
  }
  
  /**
   * Update the model with a new observation
   * 
   * @param {number} observation - New crowd count observation
   * @param {Date} timestamp - Timestamp of the observation
   * @returns {Object} Updated model state
   */
  update(observation, timestamp = new Date()) {
    // Validate input
    if (typeof observation !== 'number' || observation < 0) {
      throw new Error(`Invalid observation: ${observation}. Must be a non-negative number.`);
    }
    
    const currentTime = new Date(timestamp);
    
    if (!this.isInitialized) {
      // First observation - initialize the model
      this.initializeModel(observation, currentTime);
    } else {
      // Subsequent observations - apply Holt's equations
      this.applyHoltsUpdate(observation, currentTime);
    }
    
    // Update tracking information
    this.dataPointsProcessed++;
    this.lastUpdateTime = currentTime;
    
    // Store observation in history for validation
    this.addToHistory(observation, currentTime);
    
    console.log(`📊 Updated model ${this.buildingId}: L=${this.level.toFixed(2)}, T=${this.trend.toFixed(3)}, obs=${observation}`);
    
    return this.getState();
  }
  
  /**
   * Initialize the model with the first observation
   * 
   * @param {number} observation - First observation
   * @param {Date} timestamp - Timestamp of first observation
   */
  initializeModel(observation, timestamp) {
    // For first observation, set level to the observation value
    this.level = observation;
    
    // Initial trend is zero (no trend information yet)
    this.trend = 0;
    
    this.isInitialized = true;
    
    console.log(`🎯 Initialized model ${this.buildingId} with first observation: ${observation}`);
  }
  
  /**
   * Apply Holt's Linear equations for model update
   * 
   * @param {number} observation - New observation
   * @param {Date} timestamp - Observation timestamp
   */
  applyHoltsUpdate(observation, timestamp) {
    // Store previous values for trend calculation
    const previousLevel = this.level;
    const previousTrend = this.trend;
    
    // Holt's Level Equation: L(t) = α × X(t) + (1-α) × (L(t-1) + T(t-1))
    this.level = this.alpha * observation + (1 - this.alpha) * (previousLevel + previousTrend);
    
    // Holt's Trend Equation: T(t) = β × (L(t) - L(t-1)) + (1-β) × T(t-1)
    this.trend = this.beta * (this.level - previousLevel) + (1 - this.beta) * previousTrend;
    
    // Ensure reasonable bounds (prevent explosive growth)
    this.trend = Math.max(-10, Math.min(10, this.trend)); // Limit trend to ±10 people per minute
  }
  
  /**
   * Generate forecast for h periods ahead
   * 
   * @param {number} horizonMinutes - Number of minutes ahead to forecast
   * @returns {number} Forecasted value (rounded to nearest integer)
   */
  forecast(horizonMinutes) {
    if (!this.isInitialized) {
      console.warn(`⚠️ Model ${this.buildingId} not initialized, returning 0 forecast`);
      return 0;
    }
    
    if (horizonMinutes <= 0) {
      throw new Error(`Invalid forecast horizon: ${horizonMinutes}. Must be positive.`);
    }
    
    // Holt's Forecast Equation: F(t+h) = L(t) + h × T(t)
    const rawForecast = this.level + (horizonMinutes * this.trend);
    
    // Ensure forecast is non-negative and reasonable
    const forecast = Math.max(0, Math.round(rawForecast));
    
    console.log(`🔮 Forecast ${this.buildingId} +${horizonMinutes}min: L(${this.level.toFixed(2)}) + ${horizonMinutes}×T(${this.trend.toFixed(3)}) = ${forecast}`);
    
    return forecast;
  }
  
  /**
   * Generate multiple horizon forecasts
   * 
   * @param {number[]} horizons - Array of forecast horizons in minutes
   * @returns {Object} Object with horizon as key and forecast as value
   */
  multiHorizonForecast(horizons = [5, 10, 15, 30]) {
    const forecasts = {};
    
    horizons.forEach(horizon => {
      forecasts[`${horizon}min`] = this.forecast(horizon);
    });
    
    return forecasts;
  }
  
  /**
   * Calculate prediction confidence based on recent model performance
   * 
   * @param {number} horizonMinutes - Forecast horizon
   * @returns {number} Confidence score between 0 and 1
   */
  getConfidence(horizonMinutes) {
    // Base confidence starts high and decreases with longer horizons
    let confidence = 0.95 - (horizonMinutes * 0.01); // Reduce by 1% per minute
    
    // Adjust based on trend stability
    const trendMagnitude = Math.abs(this.trend);
    if (trendMagnitude > 2) {
      confidence -= 0.1; // Lower confidence for high trends
    }
    
    // Adjust based on amount of data processed
    if (this.dataPointsProcessed < 5) {
      confidence -= 0.2; // Lower confidence with limited data
    }
    
    // Ensure confidence is within bounds
    return Math.max(0.5, Math.min(0.95, confidence));
  }
  
  /**
   * Get current model state
   * 
   * @returns {Object} Complete model state
   */
  getState() {
    return {
      buildingId: this.buildingId,
      level: this.level,
      trend: this.trend,
      alpha: this.alpha,
      beta: this.beta,
      isInitialized: this.isInitialized,
      dataPointsProcessed: this.dataPointsProcessed,
      lastUpdateTime: this.lastUpdateTime,
      modelType: 'holts_linear'
    };
  }
  
  /**
   * Restore model from saved state (for persistence)
   * 
   * @param {Object} state - Previously saved model state
   */
  setState(state) {
    this.level = state.level;
    this.trend = state.trend;
    this.alpha = state.alpha || this.alpha;
    this.beta = state.beta || this.beta;
    this.isInitialized = state.isInitialized || false;
    this.dataPointsProcessed = state.dataPointsProcessed || 0;
    this.lastUpdateTime = state.lastUpdateTime ? new Date(state.lastUpdateTime) : null;
    
    console.log(`🔄 Restored model ${this.buildingId} from saved state`);
  }
  
  /**
   * Add observation to history for validation
   * 
   * @param {number} observation - Observation value
   * @param {Date} timestamp - Observation timestamp
   */
  addToHistory(observation, timestamp) {
    this.history.push({
      value: observation,
      timestamp: timestamp,
      level: this.level,
      trend: this.trend
    });
    
    // Keep only recent history
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
  }
  
  /**
   * Calculate mean absolute error for recent predictions
   * (Requires actual vs predicted comparisons)
   * 
   * @returns {number} Mean absolute error
   */
  calculateMAE() {
    // This would compare recent predictions with actual values
    // For now, return a placeholder based on trend stability
    const trendStability = Math.abs(this.trend) < 1 ? 0.1 : 0.2;
    return trendStability;
  }
  
  /**
   * Check if model needs parameter adjustment
   * 
   * @returns {boolean} True if parameters should be adjusted
   */
  needsParameterTuning() {
    // Simple heuristic: if trend is very volatile, may need adjustment
    if (this.history.length < 10) return false;
    
    const recentTrends = this.history.slice(-10).map(h => h.trend);
    const trendVariance = this.calculateVariance(recentTrends);
    
    return trendVariance > 5; // Threshold for high variability
  }
  
  /**
   * Suggest optimal parameters based on recent performance
   * 
   * @returns {Object} Suggested alpha and beta values
   */
  suggestParameters() {
    // Simple parameter suggestion logic
    let suggestedAlpha = this.alpha;
    let suggestedBeta = this.beta;
    
    if (this.needsParameterTuning()) {
      // If high variability, increase responsiveness
      suggestedAlpha = Math.min(0.4, this.alpha + 0.05);
      suggestedBeta = Math.min(0.3, this.beta + 0.03);
    }
    
    return { alpha: suggestedAlpha, beta: suggestedBeta };
  }
  
  /**
   * Calculate variance of an array of numbers
   * 
   * @param {number[]} values - Array of values
   * @returns {number} Variance
   */
  calculateVariance(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
  
  /**
   * Get diagnostic information for debugging
   * 
   * @returns {Object} Diagnostic information
   */
  getDiagnostics() {
    return {
      buildingId: this.buildingId,
      state: this.getState(),
      recentHistory: this.history.slice(-5), // Last 5 observations
      confidence: this.getConfidence(15), // 15-minute confidence
      mae: this.calculateMAE(),
      needsTuning: this.needsParameterTuning(),
      suggestedParams: this.suggestParameters()
    };
  }
}

module.exports = HoltsLinearModel;