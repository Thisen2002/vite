/**
 * Prediction Analysis Backend Server
 * 
 * Main server for crowd prediction analysis using Holt's Linear Model.
 * Provides RESTful API for predictions and crowd data management.
 * 
 * @author Peraverse Prediction Team
 * @version 1.0.0
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeSchema } = require('./config/database');

// Import services
const DataCollector = require('./services/DataCollector');
const ModelManager = require('./services/ModelManager');
const PredictionEngine = require('./services/PredictionEngine');

// Import routes
const healthRoutes = require('./routes/health');
const { router: predictionsRoutes, initializeRoutes } = require('./routes/predictions');

// Server configuration
const PORT = process.env.PREDICTION_PORT || 7000;
const HOST = process.env.HOST || 'localhost';

// Global service instances
let dataCollector = null;
let modelManager = null;
let predictionEngine = null;

// Building data (from your existing SvgHeatmap.jsx structure)
const BUILDINGS = [
  { id: 'B1', name: 'Engineering Faculty Building', type: 'academic', capacity: 300 },
  { id: 'B2', name: 'Computer Science Department', type: 'lab', capacity: 150 },
  { id: 'B3', name: 'Library', type: 'library', capacity: 500 },
  { id: 'B4', name: 'Student Center', type: 'cafeteria', capacity: 400 },
  { id: 'B5', name: 'Lecture Hall Complex', type: 'lecture_hall', capacity: 600 },
  { id: 'B6', name: 'Research Labs', type: 'lab', capacity: 100 },
  { id: 'B7', name: 'Administration Building', type: 'office', capacity: 80 },
  { id: 'B8', name: 'Sports Complex', type: 'recreation', capacity: 200 },
  { id: 'B9', name: 'Auditorium', type: 'auditorium', capacity: 800 },
  { id: 'B10', name: 'Study Areas', type: 'study_area', capacity: 250 }
];

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Mount routes
app.use('/health', healthRoutes);
app.use('/api/predictions', predictionsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Peraverse Prediction Analysis Backend',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    port: PORT,
    buildings: BUILDINGS.length,
    services: {
      dataCollector: dataCollector ? 'initialized' : 'not initialized',
      modelManager: modelManager ? 'initialized' : 'not initialized',
      predictionEngine: predictionEngine ? (predictionEngine.isRunning ? 'running' : 'stopped') : 'not initialized'
    },
    endpoints: {
      health: '/health',
      predictions: '/api/predictions',
      buildingPredictions: '/api/predictions/building/:id',
      multiHorizon: '/api/predictions/multi-horizon',
      status: '/api/predictions/status',
      diagnostics: '/api/predictions/diagnostics'
    }
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Initialize prediction services
async function initializePredictionServices() {
  try {
    console.log('� Initializing prediction services...');
    
    // Initialize Data Collector (start in mock mode)
    const mockMode = process.env.USE_MOCK_DATA !== 'false';
    dataCollector = new DataCollector(mockMode);
    console.log('✅ DataCollector initialized');
    
    // Initialize Model Manager
    modelManager = new ModelManager();
    console.log('✅ ModelManager initialized');
    
    // Initialize Prediction Engine
    predictionEngine = new PredictionEngine(dataCollector, modelManager);
    await predictionEngine.initialize(BUILDINGS);
    console.log('✅ PredictionEngine initialized');
    
    // Initialize API routes with prediction engine
    initializeRoutes(predictionEngine);
    console.log('✅ API routes initialized');
    
    // Start prediction engine with 5-minute intervals
    const schedule = process.env.PREDICTION_SCHEDULE || '*/5 * * * *';
    predictionEngine.start(schedule);
    console.log(`✅ PredictionEngine started (schedule: ${schedule})`);
    
    console.log('🎉 All prediction services initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize prediction services:', error);
    throw error;
  }
}

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Starting Prediction Analysis Backend...');
    
    // Initialize database (optional for development)
    try {
      await initializeSchema();
      console.log('✅ Database initialized');
    } catch (error) {
      console.warn('⚠️ Database initialization failed (continuing in development mode):', error.message);
      console.log('💡 Models will use in-memory storage only');
    }
    
    // Initialize prediction services
    await initializePredictionServices();
    
    // Start HTTP server
    app.listen(PORT, HOST, () => {
      console.log(`🌐 Server running on http://${HOST}:${PORT}`);
      console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
      console.log(`🔮 Predictions API: http://${HOST}:${PORT}/api/predictions`);
      console.log('✅ Prediction Analysis Backend started successfully');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  if (predictionEngine) {
    predictionEngine.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  if (predictionEngine) {
    predictionEngine.stop();
  }
  process.exit(0);
});

// Export for testing
module.exports = { app, dataCollector, modelManager, predictionEngine };

// Start the server
if (require.main === module) {
  startServer();
}