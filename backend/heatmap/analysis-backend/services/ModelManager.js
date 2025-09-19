/**
 * Model Manager for Building-Specific Prediction Models
 * 
 * Manages multiple Holt's Linear Models, one for each building.
 * Handles initialization, parameter optimization, and model persistence.
 * 
 * @author Peraverse Prediction Team
 * @version 1.0.0
 */

const HoltsLinearModel = require('../models/HoltsLinearModel');
const { saveModelState, loadModelState } = require('../config/database');

class ModelManager {
  constructor() {
    this.models = new Map(); // buildingId -> HoltsLinearModel
    this.buildingConfigs = new Map(); // buildingId -> building configuration
    this.initializeTime = new Date();
    
    console.log('🏢 ModelManager initialized');
  }
  
  /**
   * Check if a model exists for a building
   * @param {string} buildingId
   * @returns {boolean}
   */
  hasModel(buildingId) {
    return this.models.has(buildingId);
  }
  
  /**
   * Get stored building configuration if available
   * @param {string} buildingId
   * @returns {Object|null}
   */
  getBuildingConfig(buildingId) {
    return this.buildingConfigs.get(buildingId) || null;
  }
  
  /**
   * Initialize models for all buildings
   * 
   * @param {Array} buildings - Array of building configurations
   */
  async initializeBuildings(buildings) {
    console.log(`🏗️ Initializing models for ${buildings.length} buildings`);
    
    for (const building of buildings) {
      await this.initializeBuilding(building);
    }
    
    console.log(`✅ Initialized ${this.models.size} building models`);
  }
  
  /**
   * Initialize model for a single building
   * 
   * @param {Object} building - Building configuration
   */
  async initializeBuilding(building) {
    const { id, name, type, capacity } = building;
    
    // Store building configuration
    this.buildingConfigs.set(id, building);
    
    // Get optimized parameters for this building type
    const params = this.getOptimalParameters(type, capacity);
    
    // Create new model
    const model = new HoltsLinearModel(params.alpha, params.beta, id);
    
    // Try to restore from database
    try {
      const savedState = await loadModelState(id);
      if (savedState) {
        model.setState(savedState);
        console.log(`📊 Restored model for ${name} (${id}) from database`);
      }
    } catch (error) {
      console.log(`⚠️ Could not restore model for ${name} (${id}): ${error.message} (using fresh model)`);
    }
    
    this.models.set(id, model);
    console.log(`🏢 Initialized model for ${name} (${id}): α=${params.alpha}, β=${params.beta}`);
  }
  
  /**
   * Get optimal parameters based on building characteristics
   * 
   * @param {string} buildingType - Type of building (e.g., 'lecture', 'lab', 'library')
   * @param {number} capacity - Building capacity
   * @returns {Object} Optimal alpha and beta parameters
   */
  getOptimalParameters(buildingType, capacity) {
    // Base parameters
    let alpha = 0.2; // Level smoothing
    let beta = 0.1;  // Trend smoothing
    
    // Adjust based on building type
    switch (buildingType?.toLowerCase()) {
      case 'lecture':
      case 'lecture_hall':
        // Lecture halls have predictable patterns (class schedules)
        alpha = 0.15; // Less responsive to sudden changes
        beta = 0.08;  // Moderate trend sensitivity
        break;
        
      case 'lab':
      case 'computer_lab':
        // Labs have more variable usage patterns
        alpha = 0.25; // More responsive to changes
        beta = 0.12;  // Higher trend sensitivity
        break;
        
      case 'library':
      case 'study_area':
        // Libraries have gradual changes throughout the day
        alpha = 0.18; // Moderate responsiveness
        beta = 0.15;  // Higher trend sensitivity for study patterns
        break;
        
      case 'cafeteria':
      case 'dining':
        // Cafeterias have sharp peaks during meal times
        alpha = 0.3;  // High responsiveness to meal rushes
        beta = 0.1;   // Lower trend sensitivity (short-term spikes)
        break;
        
      case 'auditorium':
      case 'hall':
        // Auditoriums have event-based usage
        alpha = 0.2;  // Moderate responsiveness
        beta = 0.05;  // Low trend sensitivity (discrete events)
        break;
        
      default:
        // Default parameters for unknown building types
        alpha = 0.2;
        beta = 0.1;
    }
    
    // Adjust based on capacity
    if (capacity > 500) {
      // Large buildings - slightly less responsive (more stability)
      alpha *= 0.9;
      beta *= 0.9;
    } else if (capacity < 50) {
      // Small buildings - more responsive to changes
      alpha *= 1.1;
      beta *= 1.1;
    }
    
    // Ensure parameters stay within valid bounds
    alpha = Math.max(0.1, Math.min(0.4, alpha));
    beta = Math.max(0.05, Math.min(0.3, beta));
    
    return { alpha, beta };
  }
  
  /**
   * Update model with new observation
   * 
   * @param {string} buildingId - Building identifier
   * @param {number} crowdCount - Current crowd count
   * @param {Date} timestamp - Observation timestamp
   * @returns {Object} Updated model state
   */
  async updateModel(buildingId, crowdCount, timestamp = new Date()) {
    let model = this.models.get(buildingId);
    
    if (!model) {
      // Attempt dynamic registration with a sensible default config
      const fallbackConfig = this.getBuildingConfig(buildingId) || {
        id: buildingId,
        name: `Building ${buildingId}`,
        type: 'academic',
        capacity: 200
      };
      await this.initializeBuilding(fallbackConfig);
      model = this.models.get(buildingId);
      if (!model) {
        throw new Error(`Model not found for building: ${buildingId}`);
      }
    }
    
    // Update the model
    const state = model.update(crowdCount, timestamp);
    
    // Save to database (async, don't wait)
    this.saveModelAsync(buildingId, state);
    
    return state;
  }
  
  /**
   * Get prediction for a building
   * 
   * @param {string} buildingId - Building identifier
   * @param {number} horizonMinutes - Forecast horizon in minutes
   * @returns {Object} Prediction with confidence
   */
  getPrediction(buildingId, horizonMinutes = 15) {
    const model = this.models.get(buildingId);
    const building = this.buildingConfigs.get(buildingId);
    
    if (!model) {
      throw new Error(`Model not found for building: ${buildingId}`);
    }
    
    const prediction = model.forecast(horizonMinutes);
    const confidence = model.getConfidence(horizonMinutes);
    
    // Apply capacity constraints
    const constrainedPrediction = Math.min(prediction, building?.capacity || prediction);
    
    return {
      buildingId,
      buildingName: building?.name || 'Unknown',
      prediction: constrainedPrediction,
      confidence,
      horizon: horizonMinutes,
      timestamp: new Date(),
      modelState: {
        level: model.level,
        trend: model.trend,
        dataPoints: model.dataPointsProcessed
      }
    };
  }
  
  /**
   * Get predictions for multiple horizons
   * 
   * @param {string} buildingId - Building identifier
   * @param {number[]} horizons - Array of forecast horizons
   * @returns {Object} Multiple predictions
   */
  getMultiHorizonPredictions(buildingId, horizons = [5, 10, 15, 30]) {
    const model = this.models.get(buildingId);
    const building = this.buildingConfigs.get(buildingId);
    
    if (!model) {
      throw new Error(`Model not found for building: ${buildingId}`);
    }
    
    const forecasts = model.multiHorizonForecast(horizons);
    const predictions = {};
    
    horizons.forEach(horizon => {
      const key = `${horizon}min`;
      const rawPrediction = forecasts[key];
      const constrainedPrediction = Math.min(rawPrediction, building?.capacity || rawPrediction);
      
      predictions[key] = {
        prediction: constrainedPrediction,
        confidence: model.getConfidence(horizon),
        horizon: horizon
      };
    });
    
    return {
      buildingId,
      buildingName: building?.name || 'Unknown',
      timestamp: new Date(),
      predictions,
      modelState: {
        level: model.level,
        trend: model.trend,
        dataPoints: model.dataPointsProcessed
      }
    };
  }
  
  /**
   * Get predictions for all buildings
   * 
   * @param {number} horizonMinutes - Forecast horizon
   * @returns {Array} Array of predictions for all buildings
   */
  getAllPredictions(horizonMinutes = 15) {
    const predictions = [];
    
    for (const [buildingId, model] of this.models) {
      try {
        const prediction = this.getPrediction(buildingId, horizonMinutes);
        predictions.push(prediction);
      } catch (error) {
        console.error(`Error getting prediction for ${buildingId}: ${error.message}`);
        // Continue with other buildings
      }
    }
    
    return predictions.sort((a, b) => b.prediction - a.prediction); // Sort by prediction (highest first)
  }
  
  /**
   * Save model state to database (async)
   * 
   * @param {string} buildingId - Building identifier
   * @param {Object} state - Model state to save
   */
  async saveModelAsync(buildingId, state) {
    try {
      await saveModelState(
        buildingId,
        state.level,
        state.trend,
        state.alpha,
        state.beta,
        state.dataPointsProcessed || 0
      );
    } catch (error) {
      console.error(`Failed to save model state for ${buildingId}: ${error.message} (continuing without database)`);
    }
  }
  
  /**
   * Save all model states to database
   */
  async saveAllModels() {
    console.log('💾 Saving all model states...');
    const savePromises = [];
    
    for (const [buildingId, model] of this.models) {
      const state = model.getState();
      savePromises.push(this.saveModelAsync(buildingId, state));
    }
    
    await Promise.all(savePromises);
    console.log('✅ All model states saved');
  }
  
  /**
   * Get model diagnostics for a building
   * 
   * @param {string} buildingId - Building identifier
   * @returns {Object} Model diagnostics
   */
  getDiagnostics(buildingId) {
    const model = this.models.get(buildingId);
    const building = this.buildingConfigs.get(buildingId);
    
    if (!model) {
      throw new Error(`Model not found for building: ${buildingId}`);
    }
    
    return {
      building: building,
      model: model.getDiagnostics(),
      lastUpdate: model.lastUpdateTime,
      uptime: Date.now() - this.initializeTime.getTime()
    };
  }
  
  /**
   * Get diagnostics for all models
   * 
   * @returns {Object} Complete system diagnostics
   */
  getAllDiagnostics() {
    const diagnostics = {
      manager: {
        totalModels: this.models.size,
        initializeTime: this.initializeTime,
        uptime: Date.now() - this.initializeTime.getTime()
      },
      buildings: {}
    };
    
    for (const [buildingId, model] of this.models) {
      try {
        diagnostics.buildings[buildingId] = this.getDiagnostics(buildingId);
      } catch (error) {
        diagnostics.buildings[buildingId] = { error: error.message };
      }
    }
    
    return diagnostics;
  }
  
  /**
   * Check if any models need parameter tuning
   * 
   * @returns {Array} Array of buildings that need tuning
   */
  getModelsNeedingTuning() {
    const needsTuning = [];
    
    for (const [buildingId, model] of this.models) {
      if (model.needsParameterTuning()) {
        const building = this.buildingConfigs.get(buildingId);
        needsTuning.push({
          buildingId,
          buildingName: building?.name || 'Unknown',
          current: { alpha: model.alpha, beta: model.beta },
          suggested: model.suggestParameters()
        });
      }
    }
    
    return needsTuning;
  }
  
  /**
   * Apply parameter adjustments to a model
   * 
   * @param {string} buildingId - Building identifier
   * @param {number} alpha - New alpha parameter
   * @param {number} beta - New beta parameter
   */
  adjustModelParameters(buildingId, alpha, beta) {
    const model = this.models.get(buildingId);
    
    if (!model) {
      throw new Error(`Model not found for building: ${buildingId}`);
    }
    
    // Create new model with adjusted parameters
    const newModel = new HoltsLinearModel(alpha, beta, buildingId);
    
    // Transfer current state
    if (model.isInitialized) {
      newModel.setState({
        level: model.level,
        trend: model.trend,
        alpha: alpha,
        beta: beta,
        isInitialized: model.isInitialized,
        dataPointsProcessed: model.dataPointsProcessed,
        lastUpdateTime: model.lastUpdateTime
      });
    }
    
    // Replace the model
    this.models.set(buildingId, newModel);
    
    console.log(`🔧 Adjusted parameters for ${buildingId}: α=${alpha}, β=${beta}`);
  }
  
  /**
   * Get summary statistics for all models
   * 
   * @returns {Object} Summary statistics
   */
  getSummaryStats() {
    let totalDataPoints = 0;
    let totalModels = 0;
    let initializedModels = 0;
    
    for (const [buildingId, model] of this.models) {
      totalModels++;
      totalDataPoints += model.dataPointsProcessed;
      if (model.isInitialized) initializedModels++;
    }
    
    return {
      totalModels,
      initializedModels,
      uninitializedModels: totalModels - initializedModels,
      totalDataPoints,
      averageDataPointsPerModel: totalModels > 0 ? totalDataPoints / totalModels : 0,
      uptime: Date.now() - this.initializeTime.getTime()
    };
  }
}

module.exports = ModelManager;