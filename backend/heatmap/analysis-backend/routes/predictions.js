/**
 * Prediction API Routes
 * 
 * RESTful API endpoints for the prediction system:
 * - GET predictions for all buildings or specific building
 * - POST new crowd data
 * - GET system status and diagnostics
 * 
 * @author Peraverse Prediction Team
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();

// Global prediction engine instance (injected by main server)
let predictionEngine = null;

/**
 * Initialize routes with prediction engine instance
 * 
 * @param {PredictionEngine} engine - Prediction engine instance
 */
function initializeRoutes(engine) {
  predictionEngine = engine;
  console.log('🛣️ Prediction routes initialized');
}

/**
 * GET /api/predictions
 * Get predictions for all buildings
 */
router.get('/', async (req, res) => {
  try {
    const { horizon = 15, source = 'cache' } = req.query;
    const horizonMinutes = parseInt(horizon);
    
    if (isNaN(horizonMinutes) || horizonMinutes <= 0) {
      return res.status(400).json({
        error: 'Invalid horizon parameter',
        message: 'Horizon must be a positive number (minutes)'
      });
    }
    
    let predictions;
    
    if (source === 'cache') {
      // Try to get cached predictions first
      const cached = predictionEngine.getCachedPredictions(10);
      if (cached) {
        // Filter cached predictions by horizon
        const filteredPredictions = Object.values(cached.predictions)
          .filter(pred => pred.horizon === horizonMinutes);
        
        return res.json({
          success: true,
          source: 'cache',
          cacheAge: cached.age,
          horizon: horizonMinutes,
          count: filteredPredictions.length,
          predictions: filteredPredictions,
          timestamp: cached.timestamp
        });
      }
    }
    
    // Get live predictions
    predictions = predictionEngine.getLivePredictions(horizonMinutes);
    
    res.json({
      success: true,
      source: 'live',
      horizon: horizonMinutes,
      count: predictions.length,
      predictions: predictions,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Error getting predictions:', error);
    res.status(500).json({
      error: 'Failed to get predictions',
      message: error.message
    });
  }
});

/**
 * GET /api/predictions/building/:id
 * Get predictions for a specific building
 */
router.get('/building/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { horizons = '5,10,15,30' } = req.query;
    
    // Parse horizons
    const horizonArray = horizons.split(',').map(h => parseInt(h.trim()));
    const invalidHorizons = horizonArray.filter(h => isNaN(h) || h <= 0);
    
    if (invalidHorizons.length > 0) {
      return res.status(400).json({
        error: 'Invalid horizon parameters',
        message: 'All horizons must be positive numbers',
        invalid: invalidHorizons
      });
    }
    
    // Get multi-horizon predictions
    const predictions = horizonArray.map(horizon => {
      try {
        return predictionEngine.getBuildingPrediction(id, horizon);
      } catch (error) {
        console.error(`❌ Error getting prediction for building ${id}, horizon ${horizon}:`, error);
        return {
          horizon,
          error: error.message
        };
      }
    });
    
    res.json({
      success: true,
      buildingId: id,
      horizons: horizonArray,
      predictions: predictions,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Error getting building predictions:', error);
    res.status(500).json({
      error: 'Failed to get building predictions',
      message: error.message
    });
  }
});

/**
 * GET /api/predictions/multi-horizon
 * Get multi-horizon predictions for all buildings
 */
router.get('/multi-horizon', async (req, res) => {
  try {
    const { horizons = '5,10,15,30' } = req.query;
    
    // Parse horizons
    const horizonArray = horizons.split(',').map(h => parseInt(h.trim()));
    const invalidHorizons = horizonArray.filter(h => isNaN(h) || h <= 0);
    
    if (invalidHorizons.length > 0) {
      return res.status(400).json({
        error: 'Invalid horizon parameters',
        message: 'All horizons must be positive numbers',
        invalid: invalidHorizons
      });
    }
    
    // Get predictions for all horizons
    const allPredictions = {};
    
    for (const horizon of horizonArray) {
      allPredictions[`${horizon}min`] = predictionEngine.getLivePredictions(horizon);
    }
    
    res.json({
      success: true,
      horizons: horizonArray,
      predictions: allPredictions,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Error getting multi-horizon predictions:', error);
    res.status(500).json({
      error: 'Failed to get multi-horizon predictions',
      message: error.message
    });
  }
});

/**
 * POST /api/predictions/data
 * Submit new crowd data for model updates
 */
router.post('/data', async (req, res) => {
  try {
    const { buildingId, crowdCount, timestamp } = req.body;
    
    // Validate input
    if (!buildingId) {
      return res.status(400).json({
        error: 'Missing buildingId',
        message: 'buildingId is required'
      });
    }
    
    if (typeof crowdCount !== 'number' || crowdCount < 0) {
      return res.status(400).json({
        error: 'Invalid crowdCount',
        message: 'crowdCount must be a non-negative number'
      });
    }
    
    // Use provided timestamp or current time
    const observationTime = timestamp ? new Date(timestamp) : new Date();
    
    // Auto-register building if unknown
    if (!predictionEngine.modelManager.hasModel(buildingId)) {
      const fallbackBuilding = {
        id: buildingId,
        name: `Building ${buildingId}`,
        type: 'academic',
        capacity: 200
      };
      await predictionEngine.addBuilding(fallbackBuilding);
    }
    
    // Update the model after ensuring it exists
    const modelState = await predictionEngine.modelManager.updateModel(buildingId, crowdCount, observationTime);
    
    res.json({
      success: true,
      message: 'Data received and model updated',
      buildingId,
      crowdCount,
      timestamp: observationTime,
      modelState: {
        level: modelState.level,
        trend: modelState.trend,
        dataPointsProcessed: modelState.dataPointsProcessed
      }
    });
    
  } catch (error) {
    console.error('❌ Error processing crowd data:', error);
    res.status(500).json({
      error: 'Failed to process crowd data',
      message: error.message
    });
  }
});

/**
 * POST /api/predictions/batch-data
 * Submit batch crowd data for multiple buildings
 */
router.post('/batch-data', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        error: 'Invalid data format',
        message: 'data must be a non-empty array'
      });
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (const item of data) {
      try {
        const { buildingId, crowdCount, timestamp } = item;
        
        // Validate individual item
        if (!buildingId || typeof crowdCount !== 'number' || crowdCount < 0) {
          throw new Error('Invalid data format in batch item');
        }
        
        const observationTime = timestamp ? new Date(timestamp) : new Date();
        
        // Auto-register building if unknown
        if (!predictionEngine.modelManager.hasModel(buildingId)) {
          const fallbackBuilding = {
            id: buildingId,
            name: `Building ${buildingId}`,
            type: 'academic',
            capacity: 200
          };
          await predictionEngine.addBuilding(fallbackBuilding);
        }
        
        await predictionEngine.modelManager.updateModel(
          buildingId,
          crowdCount,
          observationTime
        );
        
        results.success++;
        
      } catch (error) {
        results.failed++;
        results.errors.push({
          item,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Batch data processed',
      results: results,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Error processing batch data:', error);
    res.status(500).json({
      error: 'Failed to process batch data',
      message: error.message
    });
  }
});

/**
 * POST /api/predictions/force-cycle
 * Manually trigger a prediction cycle
 */
router.post('/force-cycle', async (req, res) => {
  try {
    const result = await predictionEngine.forcePredictionCycle();
    
    res.json({
      success: true,
      message: 'Prediction cycle completed',
      result: result
    });
    
  } catch (error) {
    console.error('❌ Error forcing prediction cycle:', error);
    res.status(500).json({
      error: 'Failed to force prediction cycle',
      message: error.message
    });
  }
});

/**
 * GET /api/predictions/status
 * Get prediction system status
 */
router.get('/status', async (req, res) => {
  try {
    const status = predictionEngine.getStatus();
    
    res.json({
      success: true,
      status: status,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Error getting status:', error);
    res.status(500).json({
      error: 'Failed to get status',
      message: error.message
    });
  }
});

/**
 * GET /api/predictions/diagnostics
 * Get detailed system diagnostics
 */
router.get('/diagnostics', async (req, res) => {
  try {
    const diagnostics = predictionEngine.getDiagnostics();
    
    res.json({
      success: true,
      diagnostics: diagnostics,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Error getting diagnostics:', error);
    res.status(500).json({
      error: 'Failed to get diagnostics',
      message: error.message
    });
  }
});

/**
 * GET /api/predictions/performance
 * Get performance metrics
 */
router.get('/performance', async (req, res) => {
  try {
    const metrics = predictionEngine.getPerformanceMetrics();
    
    res.json({
      success: true,
      metrics: metrics,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Error getting performance metrics:', error);
    res.status(500).json({
      error: 'Failed to get performance metrics',
      message: error.message
    });
  }
});

/**
 * DELETE /api/predictions/cache
 * Clear prediction cache
 */
router.delete('/cache', async (req, res) => {
  try {
    predictionEngine.clearCache();
    
    res.json({
      success: true,
      message: 'Prediction cache cleared',
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

/**
 * GET /api/predictions/mock-preview
 * Get mock data preview for testing
 */
router.get('/mock-preview', async (req, res) => {
  try {
    const buildings = predictionEngine.buildings.slice(0, 5); // First 5 buildings
    const preview = predictionEngine.dataCollector.getMockDataPreview(buildings);
    
    res.json({
      success: true,
      preview: preview,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Error getting mock preview:', error);
    res.status(500).json({
      error: 'Failed to get mock preview',
      message: error.message
    });
  }
});

/**
 * Error handling middleware for prediction routes
 */
router.use((error, req, res, next) => {
  console.error('❌ Prediction API error:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    path: req.path,
    timestamp: new Date()
  });
});

module.exports = { router, initializeRoutes };