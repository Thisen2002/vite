-- Database Schema for Crowd Prediction Analysis Backend
-- 
-- This script creates the necessary tables for storing:
-- 1. Holt's Linear Model states for each building
-- 2. Prediction results with confidence intervals  
-- 3. Historical crowd data for analysis and validation
-- 4. Model performance metrics
--
-- Execute this script in PostgreSQL to set up the database schema

-- ========================================
-- DATABASE CREATION (if needed)
-- ========================================

-- Uncomment the following lines if you need to create the database
-- CREATE DATABASE crowd_predictions;
-- \c crowd_predictions;

-- ========================================
-- MAIN TABLES
-- ========================================

-- Table: model_states
-- Stores the current state of Holt's Linear Model for each building
-- This allows models to persist across server restarts
CREATE TABLE IF NOT EXISTS model_states (
    building_id VARCHAR(10) PRIMARY KEY,           -- Building identifier (B1, B2, etc.)
    level FLOAT NOT NULL DEFAULT 0,                -- Current smoothed level (Holt's L_t)
    trend FLOAT NOT NULL DEFAULT 0,                -- Current trend component (Holt's T_t)
    alpha FLOAT NOT NULL DEFAULT 0.2,              -- Level smoothing parameter (0.1-0.4)
    beta FLOAT NOT NULL DEFAULT 0.1,               -- Trend smoothing parameter (0.05-0.3)
    last_updated TIMESTAMP DEFAULT NOW(),          -- When model was last updated
    data_points_processed INTEGER DEFAULT 0,       -- Number of data points processed
    created_at TIMESTAMP DEFAULT NOW()             -- When model was first created
);

-- Table: predictions
-- Stores prediction results for validation and caching
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,                         -- Unique prediction ID
    building_id VARCHAR(10) NOT NULL,              -- Building identifier
    horizon_minutes INTEGER NOT NULL,              -- Prediction horizon (5, 10, 15, 30)
    predicted_count INTEGER NOT NULL,              -- Predicted crowd count
    confidence FLOAT NOT NULL DEFAULT 0.8,         -- Prediction confidence (0.0-1.0)
    actual_count INTEGER NULL,                     -- Actual count (filled later for validation)
    created_at TIMESTAMP DEFAULT NOW(),            -- When prediction was made
    
    -- Ensure unique predictions per building/horizon/time
    CONSTRAINT unique_building_horizon_time 
    UNIQUE (building_id, horizon_minutes, created_at)
);

-- Table: crowd_history  
-- Stores actual crowd data for analysis and model training
CREATE TABLE IF NOT EXISTS crowd_history (
    id SERIAL PRIMARY KEY,                         -- Unique record ID
    building_id VARCHAR(10) NOT NULL,              -- Building identifier
    crowd_count INTEGER NOT NULL,                  -- Actual crowd count
    timestamp TIMESTAMP NOT NULL,                  -- When count was recorded
    data_source VARCHAR(20) DEFAULT 'mock',        -- Source: 'mock', 'api', 'manual'
    
    -- Computed columns for pattern analysis
    hour_of_day INTEGER GENERATED ALWAYS AS (EXTRACT(hour FROM timestamp)) STORED,
    day_of_week INTEGER GENERATED ALWAYS AS (EXTRACT(dow FROM timestamp)) STORED,
    
    created_at TIMESTAMP DEFAULT NOW()             -- When record was inserted
);

-- Table: model_performance (optional - for advanced analytics)
-- Tracks accuracy of predictions over time
CREATE TABLE IF NOT EXISTS model_performance (
    id SERIAL PRIMARY KEY,                         -- Unique record ID
    building_id VARCHAR(10) NOT NULL,              -- Building identifier
    evaluation_date DATE NOT NULL,                 -- Date of evaluation
    horizon_minutes INTEGER NOT NULL,              -- Prediction horizon evaluated
    mae FLOAT,                                     -- Mean Absolute Error
    rmse FLOAT,                                    -- Root Mean Square Error
    mape FLOAT,                                    -- Mean Absolute Percentage Error
    accuracy_percentage FLOAT,                     -- Overall accuracy percentage
    predictions_evaluated INTEGER,                 -- Number of predictions evaluated
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Index for efficient prediction queries
CREATE INDEX IF NOT EXISTS idx_predictions_building_created 
ON predictions(building_id, created_at DESC);

-- Index for crowd history queries  
CREATE INDEX IF NOT EXISTS idx_crowd_history_building_time 
ON crowd_history(building_id, timestamp DESC);

-- Index for pattern analysis
CREATE INDEX IF NOT EXISTS idx_crowd_history_patterns
ON crowd_history(building_id, hour_of_day, day_of_week);

-- Index for model performance tracking
CREATE INDEX IF NOT EXISTS idx_model_performance_building_date
ON model_performance(building_id, evaluation_date DESC);

-- ========================================
-- SAMPLE DATA INSERTION (for testing)
-- ========================================

-- Insert sample building model states (optional)
-- This initializes models for all 34 buildings with default parameters
INSERT INTO model_states (building_id, level, trend, alpha, beta) VALUES
('B1', 15.0, 0.0, 0.3, 0.2),   -- Engineering Carpentry Shop
('B2', 30.0, 0.0, 0.25, 0.15), -- Engineering Workshop  
('B3', 20.0, 0.0, 0.2, 0.1),   -- Building B3
('B4', 5.0, 0.0, 0.35, 0.25),  -- Generator Room
('B5', 25.0, 0.0, 0.2, 0.1),   -- Building B5
('B6', 35.0, 0.0, 0.25, 0.15), -- Structure Lab
('B7', 40.0, 0.0, 0.2, 0.1),   -- Administrative Building
('B8', 45.0, 0.0, 0.3, 0.2),   -- Canteen
('B9', 50.0, 0.0, 0.25, 0.15), -- Lecture Room 10/11
('B10', 60.0, 0.0, 0.15, 0.1), -- Engineering Library
('B11', 35.0, 0.0, 0.2, 0.1),  -- Department of Chemical Engineering
('B12', 10.0, 0.0, 0.3, 0.2),  -- Security Unit
('B13', 30.0, 0.0, 0.25, 0.15),-- Drawing Office 2
('B14', 20.0, 0.0, 0.3, 0.2),  -- Faculty Canteen
('B15', 15.0, 0.0, 0.2, 0.1),  -- Department of Manufacturing Engineering
('B16', 80.0, 0.0, 0.25, 0.15),-- Professor E.O.E. Perera Theater
('B17', 20.0, 0.0, 0.25, 0.15),-- Electronic Lab
('B18', 25.0, 0.0, 0.3, 0.2),  -- Washrooms
('B19', 30.0, 0.0, 0.25, 0.15),-- Electrical and Electronic Workshop
('B20', 15.0, 0.0, 0.2, 0.1),  -- Department of Computer Engineering
('B21', 25.0, 0.0, 0.2, 0.1),  -- Building B21
('B22', 20.0, 0.0, 0.25, 0.15),-- Environmental Lab
('B23', 15.0, 0.0, 0.25, 0.15),-- Applied Mechanics Lab
('B24', 20.0, 0.0, 0.25, 0.15),-- New Mechanics Lab
('B25', 25.0, 0.0, 0.2, 0.1),  -- Building B25
('B26', 25.0, 0.0, 0.2, 0.1),  -- Building B26
('B27', 25.0, 0.0, 0.2, 0.1),  -- Building B27
('B28', 20.0, 0.0, 0.25, 0.15),-- Materials Lab
('B29', 20.0, 0.0, 0.25, 0.15),-- Thermodynamics Lab
('B30', 25.0, 0.0, 0.25, 0.15),-- Fluids Lab
('B31', 35.0, 0.0, 0.25, 0.15),-- Surveying and Soil Lab
('B32', 60.0, 0.0, 0.15, 0.1), -- Department of Engineering Mathematics
('B33', 25.0, 0.0, 0.25, 0.15),-- Drawing Office 1
('B34', 75.0, 0.0, 0.2, 0.1)   -- Department of Electrical Engineering
ON CONFLICT (building_id) DO NOTHING;

-- ========================================
-- UTILITY FUNCTIONS
-- ========================================

-- Function to cleanup old data (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_data() 
RETURNS void AS $$
BEGIN
    -- Delete predictions older than 7 days
    DELETE FROM predictions WHERE created_at < NOW() - INTERVAL '7 days';
    
    -- Delete crowd history older than 30 days  
    DELETE FROM crowd_history WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Delete old performance records older than 90 days
    DELETE FROM model_performance WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify table creation
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_catalog.pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check model states count
SELECT COUNT(*) as total_buildings FROM model_states;

-- Show sample data
SELECT building_id, level, trend, alpha, beta, last_updated 
FROM model_states 
ORDER BY building_id 
LIMIT 10;