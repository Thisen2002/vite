/**
 * Prediction Engine
 * 
 * Orchestrates the entire prediction system:
 * 1. Collects crowd data via DataCollector
 * 2. Updates models via ModelManager
 * 3. Generates predictions and stores results
 * 4. Manages prediction scheduling and caching
 * 
 * @author Peraverse Prediction Team
 * @version 1.0.0
 */

const cron = require('node-cron');
const { savePrediction } = require('../config/database');

class PredictionEngine {
  constructor(dataCollector, modelManager) {
    this.dataCollector = dataCollector;
    this.modelManager = modelManager;
    this.buildings = [];
    this.isRunning = false;
    this.cronJob = null;
    this.predictionCache = new Map(); // Cache recent predictions
    this.lastPredictionTime = null;
    this.totalPredictions = 0;
    this.errors = [];
    this.maxErrors = 100; // Keep last 100 errors
    
    console.log('🚀 PredictionEngine initialized');
  }
  
  /**
   * Initialize the prediction engine with building data
   * 
   * @param {Array} buildings - Array of building configurations
   */
  async initialize(buildings) {
    console.log(`🏗️ Initializing PredictionEngine with ${buildings.length} buildings`);
    
    this.buildings = buildings;
    
    // Initialize model manager
    await this.modelManager.initializeBuildings(buildings);
    
    // Initialize data collector patterns
    this.dataCollector.initializeMockPatterns(buildings);
    
    console.log('✅ PredictionEngine initialization complete');
  }
  
  /**
   * Dynamically add a new building at runtime and initialize its model/patterns
   * @param {Object} building - { id, name, type, capacity }
   */
  async addBuilding(building) {
    if (!building || !building.id) return;
    const exists = this.buildings.find(b => b.id === building.id);
    if (exists) return; // already registered
    
    // Register and initialize
    this.buildings.push(building);
    await this.modelManager.initializeBuilding(building);
    // Ensure mock patterns exist for new building
    this.dataCollector.initializeMockPatterns([building]);
    console.log(`➕ Registered new building ${building.name || building.id} (${building.id}) at runtime`);
  }
  
  /**
   * Start the prediction engine with scheduled runs
   * 
   * @param {string} schedule - Cron schedule (default: every 5 minutes)
   */
  start(schedule = '*/5 * * * *') { // Every 5 minutes
    if (this.isRunning) {
      console.log('⚠️ PredictionEngine is already running');
      return;
    }
    
    console.log(`🕐 Starting PredictionEngine with schedule: ${schedule}`);
    
    this.isRunning = true;
    
    // Run initial prediction
    this.runPredictionCycle().catch(error => {
      console.error('❌ Error in initial prediction cycle:', error);
    });
    
    // Schedule regular predictions
    this.cronJob = cron.schedule(schedule, async () => {
      try {
        await this.runPredictionCycle();
      } catch (error) {
        this.logError('Scheduled prediction cycle failed', error);
      }
    });
    
    console.log('✅ PredictionEngine started successfully');
  }
  
  /**
   * Stop the prediction engine
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ PredictionEngine is not running');
      return;
    }
    
    console.log('🛑 Stopping PredictionEngine...');
    
    this.isRunning = false;
    
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    
    // Save all model states before stopping
    this.modelManager.saveAllModels().catch(error => {
      console.error('❌ Error saving models during shutdown:', error);
    });
    
    console.log('✅ PredictionEngine stopped');
  }
  
  /**
   * Run a complete prediction cycle
   * 
   * @returns {Object} Prediction cycle results
   */
  async runPredictionCycle() {
    const cycleStart = Date.now();
    console.log('🔄 Starting prediction cycle...');
    
    try {
      // Step 1: Collect current crowd data
      const crowdData = await this.dataCollector.collectData(this.buildings);
      console.log(`📊 Collected data for ${crowdData.length} buildings`);
      
      // Step 2: Update models with new data
      const updateResults = await this.updateModels(crowdData);
      console.log(`🔄 Updated ${updateResults.successful} models`);
      
      // Step 3: Generate predictions
      const predictions = await this.generatePredictions();
      console.log(`🔮 Generated ${predictions.length} predictions`);
      
      // Step 4: Cache and store predictions
      await this.storePredictions(predictions);
      
      // Step 5: Update cycle statistics
      const cycleTime = Date.now() - cycleStart;
      this.lastPredictionTime = new Date();
      this.totalPredictions += predictions.length;
      
      console.log(`✅ Prediction cycle completed in ${cycleTime}ms`);
      
      return {
        success: true,
        cycleTime,
        dataPoints: crowdData.length,
        modelsUpdated: updateResults.successful,
        predictions: predictions.length,
        timestamp: this.lastPredictionTime
      };
      
    } catch (error) {
      this.logError('Prediction cycle failed', error);
      throw error;
    }
  }
  
  /**
   * Update all models with new crowd data
   * 
   * @param {Array} crowdData - Array of crowd observations
   * @returns {Object} Update results
   */
  async updateModels(crowdData) {
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };
    
    for (const observation of crowdData) {
      try {
        await this.modelManager.updateModel(
          observation.buildingId,
          observation.crowdCount,
          observation.timestamp
        );
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          buildingId: observation.buildingId,
          error: error.message
        });
        console.error(`❌ Failed to update model for ${observation.buildingId}: ${error.message}`);
      }
    }
    
    return results;
  }
  
  /**
   * Generate predictions for all buildings and multiple horizons
   * 
   * @param {number[]} horizons - Forecast horizons in minutes
   * @returns {Array} Array of prediction objects
   */
  async generatePredictions(horizons = [5, 10, 15, 30]) {
    const predictions = [];
    const timestamp = new Date();
    
    for (const building of this.buildings) {
      try {
        // Generate multi-horizon predictions
        const multiPredictions = this.modelManager.getMultiHorizonPredictions(building.id, horizons);
        
        // Format for storage and API
        for (const [horizonKey, predictionData] of Object.entries(multiPredictions.predictions)) {
          const prediction = {
            buildingId: building.id,
            buildingName: building.name,
            buildingType: building.type,
            capacity: building.capacity,
            prediction: predictionData.prediction,
            confidence: predictionData.confidence,
            horizon: predictionData.horizon,
            timestamp: timestamp,
            modelState: multiPredictions.modelState
          };
          
          predictions.push(prediction);
        }
        
      } catch (error) {
        console.error(`❌ Failed to generate predictions for ${building.name}: ${error.message}`);
        this.logError(`Prediction generation failed for ${building.id}`, error);
      }
    }
    
    return predictions;
  }
  
  /**
   * Store predictions in cache and database
   * 
   * @param {Array} predictions - Array of prediction objects
   */
  async storePredictions(predictions) {
    // Update cache
    this.updatePredictionCache(predictions);
    
    // Save to database (async, don't wait for all)
    const savePromises = predictions.map(prediction => 
      this.savePredictionAsync(prediction)
    );
    
    // Wait for a reasonable number to complete, but don't block on all
    const saveResults = await Promise.allSettled(savePromises.slice(0, 10));
    const successful = saveResults.filter(result => result.status === 'fulfilled').length;
    
    console.log(`💾 Saved ${successful}/${predictions.length} predictions to database`);
  }
  
  /**
   * Update prediction cache with new predictions
   * 
   * @param {Array} predictions - Array of prediction objects
   */
  updatePredictionCache(predictions) {
    const cacheKey = this.generateCacheKey(new Date());
    
    // Group predictions by building and horizon
    const groupedPredictions = {};
    predictions.forEach(pred => {
      const key = `${pred.buildingId}_${pred.horizon}min`;
      groupedPredictions[key] = pred;
    });
    
    // Store in cache
    this.predictionCache.set(cacheKey, {
      timestamp: new Date(),
      predictions: groupedPredictions
    });
    
    // Keep only recent cache entries (last 10)
    if (this.predictionCache.size > 10) {
      const oldestKey = Array.from(this.predictionCache.keys())[0];
      this.predictionCache.delete(oldestKey);
    }
  }
  
  /**
   * Get cached predictions
   * 
   * @param {number} maxAgeMinutes - Maximum age of cached predictions
   * @returns {Object|null} Cached predictions or null if not available
   */
  getCachedPredictions(maxAgeMinutes = 10) {
    for (const [cacheKey, cacheData] of this.predictionCache) {
      const age = (Date.now() - cacheData.timestamp.getTime()) / (1000 * 60);
      if (age <= maxAgeMinutes) {
        return {
          ...cacheData,
          age: Math.round(age * 100) / 100 // Round to 2 decimal places
        };
      }
    }
    return null;
  }
  
  /**
   * Get live predictions for all buildings
   * 
   * @param {number} horizonMinutes - Forecast horizon
   * @returns {Array} Array of current predictions
   */
  getLivePredictions(horizonMinutes = 15) {
    try {
      return this.modelManager.getAllPredictions(horizonMinutes);
    } catch (error) {
      this.logError('Failed to get live predictions', error);
      return [];
    }
  }
  
  /**
   * Get prediction for a specific building
   * 
   * @param {string} buildingId - Building identifier
   * @param {number} horizonMinutes - Forecast horizon
   * @returns {Object} Prediction object
   */
  getBuildingPrediction(buildingId, horizonMinutes = 15) {
    try {
      return this.modelManager.getPrediction(buildingId, horizonMinutes);
    } catch (error) {
      this.logError(`Failed to get prediction for building ${buildingId}`, error);
      throw error;
    }
  }
  
  /**
   * Save prediction to database (async)
   * 
   * @param {Object} prediction - Prediction object
   */
  async savePredictionAsync(prediction) {
    try {
      await savePrediction(
        prediction.buildingId,
        prediction.horizon,
        prediction.prediction,
        prediction.confidence
      );
    } catch (error) {
      console.error(`❌ Failed to save prediction for ${prediction.buildingId}: ${error.message}`);
    }
  }
  
  /**
   * Generate cache key based on timestamp
   * 
   * @param {Date} timestamp - Timestamp
   * @returns {string} Cache key
   */
  generateCacheKey(timestamp) {
    // Round to nearest 5 minutes for cache key consistency
    const roundedTime = new Date(timestamp);
    roundedTime.setMinutes(Math.floor(roundedTime.getMinutes() / 5) * 5);
    roundedTime.setSeconds(0);
    roundedTime.setMilliseconds(0);
    
    return roundedTime.toISOString();
  }
  
  /**
   * Log error with context
   * 
   * @param {string} message - Error message
   * @param {Error} error - Error object
   */
  logError(message, error) {
    const errorRecord = {
      timestamp: new Date(),
      message,
      error: error.message,
      stack: error.stack
    };
    
    this.errors.push(errorRecord);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
    
    console.error(`❌ ${message}:`, error.message);
  }
  
  /**
   * Get engine status and statistics
   * 
   * @returns {Object} Engine status
   */
  getStatus() {
    const cachedPredictions = this.getCachedPredictions(30); // 30 minutes
    
    return {
      isRunning: this.isRunning,
      lastPredictionTime: this.lastPredictionTime,
      totalPredictions: this.totalPredictions,
      buildings: this.buildings.length,
      cache: {
        entries: this.predictionCache.size,
        latestAge: cachedPredictions ? cachedPredictions.age : null
      },
      errors: {
        total: this.errors.length,
        recent: this.errors.slice(-5) // Last 5 errors
      },
      dataCollector: this.dataCollector.getStatus(),
      modelManager: this.modelManager.getSummaryStats()
    };
  }
  
  /**
   * Get detailed diagnostics
   * 
   * @returns {Object} Detailed diagnostics
   */
  getDiagnostics() {
    return {
      engine: this.getStatus(),
      models: this.modelManager.getAllDiagnostics(),
      dataCollector: this.dataCollector.getStatus(),
      needsTuning: this.modelManager.getModelsNeedingTuning()
    };
  }
  
  /**
   * Force run prediction cycle (manual trigger)
   * 
   * @returns {Object} Prediction cycle results
   */
  async forcePredictionCycle() {
    console.log('🔧 Manually triggering prediction cycle...');
    return await this.runPredictionCycle();
  }
  
  /**
   * Clear prediction cache
   */
  clearCache() {
    console.log('🗑️ Clearing prediction cache...');
    this.predictionCache.clear();
  }
  
  /**
   * Get performance metrics
   * 
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    const uptime = this.lastPredictionTime ? Date.now() - this.lastPredictionTime.getTime() : 0;
    
    return {
      totalPredictions: this.totalPredictions,
      errorRate: this.errors.length / Math.max(this.totalPredictions, 1),
      averageResponseTime: 'N/A', // Could be implemented with timing
      cacheHitRate: 'N/A', // Could be implemented with cache tracking
      uptime: uptime,
      predictionsPerMinute: this.totalPredictions / Math.max(uptime / 60000, 1)
    };
  }
}

module.exports = PredictionEngine;