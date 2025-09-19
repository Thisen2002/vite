/**
 * Health Check Routes
 * 
 * Provides system health monitoring endpoints for the prediction backend.
 * Used by monitoring systems, load balancers, and frontend to verify
 * that the prediction service is running correctly.
 * 
 * Endpoints:
 * - GET /health - Basic health check
 * - GET /health/detailed - Detailed system status
 * - GET /health/models - Model status for all buildings
 */

const express = require('express');
const router = express.Router();

/**
 * Basic Health Check
 * Returns simple status to verify server is running
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'crowd-prediction-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: process.env.PREDICTION_PORT || 7000
  });
});

/**
 * Detailed Health Check
 * Returns comprehensive system status including memory usage
 */
router.get('/detailed', (req, res) => {
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'healthy',
    service: 'crowd-prediction-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PREDICTION_PORT || 7000,
    features: {
      mock_data_enabled: process.env.USE_MOCK_DATA === 'true',
      prediction_engine: global.predictionEngine ? 'initialized' : 'not_initialized',
      data_collector: global.dataCollector ? 'initialized' : 'not_initialized'
    },
    system: {
      node_version: process.version,
      platform: process.platform,
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        heap_used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        heap_total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB'
      }
    }
  });
});

/**
 * Model Health Check
 * Returns status of all building prediction models
 */
router.get('/models', (req, res) => {
  try {
    if (!global.predictionEngine) {
      return res.status(503).json({
        status: 'unhealthy',
        error: 'Prediction engine not initialized',
        timestamp: new Date().toISOString()
      });
    }
    
    const modelStatus = global.predictionEngine.getAllModelStatus();
    
    res.json({
      status: 'healthy',
      service: 'prediction-models',
      timestamp: new Date().toISOString(),
      total_models: modelStatus.length,
      active_models: modelStatus.filter(m => m.status === 'active').length,
      models: modelStatus
    });
    
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;