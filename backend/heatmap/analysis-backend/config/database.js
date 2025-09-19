/**
 * Database Configuration Module
 * 
 * Handles PostgreSQL database connection for storing:
 * - Holt's model states (level, trend, parameters) for each building
 * - Recent predictions for validation and caching
 * - Historical data for model performance tracking
 * 
 * Uses connection pooling for efficient database access.
 */

const { Pool } = require('pg');
require('dotenv').config();

/**
 * PostgreSQL Connection Pool Configuration
 * Pool allows multiple concurrent database connections
 * for better performance under load
 */
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'crowd_predictions',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '9295',
  
  // Pool configuration for optimal performance
  max: 20,                    // Maximum number of connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Wait max 2 seconds for connection
  
  // SSL configuration (disable for local development)
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Ensure target database exists; if missing, create it using admin connection
 */
async function ensureDatabaseExists() {
  const targetDb = process.env.DB_NAME || 'crowd_predictions';
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_ADMIN_DB || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'your_password_here',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  let adminClient;
  try {
    adminClient = await adminPool.connect();
    const existsRes = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [targetDb]
    );
    if (existsRes.rowCount === 0) {
      console.log(`🛠️ Database "${targetDb}" not found. Creating...`);
      await adminClient.query(`CREATE DATABASE ${targetDb}`);
      console.log(`✅ Database "${targetDb}" created`);
    } else {
      // Optional log for visibility
      console.log(`✅ Database "${targetDb}" exists`);
    }
  } catch (err) {
    console.warn('⚠️ Could not verify/create database:', err.message);
  } finally {
    if (adminClient) adminClient.release();
    await adminPool.end().catch(() => {});
  }
}

/**
 * Test Database Connection
 * Verifies that the database is reachable and credentials are correct
 */
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    
    console.log('✅ Database connection successful');
    console.log(`📅 Database time: ${result.rows[0].current_time}`);
    console.log(`🐘 PostgreSQL version: ${result.rows[0].postgres_version.split(',')[0]}`);
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔧 Please check your database configuration in .env file');
    return false;
  }
}

/**
 * Initialize Database Schema
 * Creates necessary tables if they don't exist
 */
async function initializeSchema() {
  // Make sure the target DB exists before connecting the main pool
  await ensureDatabaseExists();

  const client = await pool.connect();
  
  try {
    console.log('🏗️ Initializing database schema...');
    
    // Create model_states table - stores Holt's model parameters for each building
    await client.query(`
      CREATE TABLE IF NOT EXISTS model_states (
        building_id VARCHAR(10) PRIMARY KEY,
        level FLOAT NOT NULL DEFAULT 0,
        trend FLOAT NOT NULL DEFAULT 0,
        alpha FLOAT NOT NULL DEFAULT 0.2,
        beta FLOAT NOT NULL DEFAULT 0.1,
        last_updated TIMESTAMP DEFAULT NOW(),
        data_points_processed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create predictions table - stores recent predictions for validation
    await client.query(`
      CREATE TABLE IF NOT EXISTS predictions (
        id SERIAL PRIMARY KEY,
        building_id VARCHAR(10) NOT NULL,
        horizon_minutes INTEGER NOT NULL,
        predicted_count INTEGER NOT NULL,
        confidence FLOAT NOT NULL DEFAULT 0.8,
        actual_count INTEGER NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        
        -- Create index for efficient queries
        CONSTRAINT unique_building_horizon_time 
        UNIQUE (building_id, horizon_minutes, created_at)
      )
    `);
    
    // Create crowd_history table - stores actual crowd data for analysis
    await client.query(`
      CREATE TABLE IF NOT EXISTS crowd_history (
        id SERIAL PRIMARY KEY,
        building_id VARCHAR(10) NOT NULL,
        crowd_count INTEGER NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        data_source VARCHAR(20) DEFAULT 'mock',
        hour_of_day INTEGER GENERATED ALWAYS AS (EXTRACT(hour FROM timestamp)) STORED,
        day_of_week INTEGER GENERATED ALWAYS AS (EXTRACT(dow FROM timestamp)) STORED,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create indexes for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_building_created 
      ON predictions(building_id, created_at DESC)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_crowd_history_building_time 
      ON crowd_history(building_id, timestamp DESC)
    `);
    
    console.log('✅ Database schema initialized successfully');
    
    // Display table information
    const tableInfo = await client.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns 
              WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📊 Database tables:', tableInfo.rows);
    
  } catch (error) {
    console.error('❌ Schema initialization failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Database Query Wrapper Functions
 * Provides convenient methods for common database operations
 */

/**
 * Save Holt's model state for a building
 */
async function saveModelState(buildingId, level, trend, alpha, beta, dataPointsProcessed = 0) {
  const query = `
    INSERT INTO model_states (building_id, level, trend, alpha, beta, data_points_processed, last_updated)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    ON CONFLICT (building_id) 
    DO UPDATE SET 
      level = EXCLUDED.level,
      trend = EXCLUDED.trend,
      alpha = EXCLUDED.alpha,
      beta = EXCLUDED.beta,
      data_points_processed = EXCLUDED.data_points_processed,
      last_updated = NOW()
  `;
  
  return pool.query(query, [buildingId, level, trend, alpha, beta, dataPointsProcessed]);
}

/**
 * Load Holt's model state for a building
 */
async function loadModelState(buildingId) {
  const query = 'SELECT * FROM model_states WHERE building_id = $1';
  const result = await pool.query(query, [buildingId]);
  return result.rows[0] || null;
}

/**
 * Save prediction result
 */
async function savePrediction(buildingId, horizonMinutes, predictedCount, confidence) {
  const query = `
    INSERT INTO predictions (building_id, horizon_minutes, predicted_count, confidence)
    VALUES ($1, $2, $3, $4)
  `;
  
  return pool.query(query, [buildingId, horizonMinutes, predictedCount, confidence]);
}

/**
 * Save actual crowd data
 */
async function saveCrowdData(buildingId, crowdCount, timestamp, dataSource = 'mock') {
  const query = `
    INSERT INTO crowd_history (building_id, crowd_count, timestamp, data_source)
    VALUES ($1, $2, $3, $4)
  `;
  
  return pool.query(query, [buildingId, crowdCount, timestamp, dataSource]);
}

/**
 * Get recent crowd history for a building
 */
async function getRecentCrowdHistory(buildingId, limitRows = 24) {
  const query = `
    SELECT crowd_count, timestamp, data_source 
    FROM crowd_history 
    WHERE building_id = $1 
    ORDER BY timestamp DESC 
    LIMIT $2
  `;
  
  const result = await pool.query(query, [buildingId, limitRows]);
  return result.rows;
}

/**
 * Cleanup old data (run periodically)
 */
async function cleanupOldData() {
  const client = await pool.connect();
  
  try {
    // Keep only last 7 days of predictions
    await client.query(`
      DELETE FROM predictions 
      WHERE created_at < NOW() - INTERVAL '7 days'
    `);
    
    // Keep only last 30 days of crowd history
    await client.query(`
      DELETE FROM crowd_history 
      WHERE created_at < NOW() - INTERVAL '30 days'
    `);
    
    console.log('🧹 Database cleanup completed');
  } catch (error) {
    console.error('❌ Database cleanup failed:', error.message);
  } finally {
    client.release();
  }
}

// Export the pool and utility functions
module.exports = {
  pool,
  testConnection,
  initializeSchema,
  saveModelState,
  loadModelState,
  savePrediction,
  saveCrowdData,
  getRecentCrowdHistory,
  cleanupOldData
};