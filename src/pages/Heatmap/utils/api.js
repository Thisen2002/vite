// Simple API client for the frontend to talk to the backend (code 1)
// Uses VITE_API_BASE if provided, else defaults to http://localhost:5000

const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_MAIN_API_URL || 'http://localhost:5000';
const PREDICTION_API_BASE = import.meta.env.VITE_PREDICTION_API_BASE || 'http://localhost:7000';

export async function fetchCrowd(intervalMinutes = 30) {
  const url = `${API_BASE}/api/crowd?interval=${encodeURIComponent(intervalMinutes)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch crowd data (${res.status})`);
  return res.json();
}

export async function fetchBuildingHistoryByName(buildingName) {
  const url = `${API_BASE}/api/building-history/${encodeURIComponent(buildingName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch history for ${buildingName} (${res.status})`);
  return res.json();
}

/**
 * Fetch predictions for all buildings from the prediction backend
 * @param {number} horizonMinutes - Forecast horizon in minutes (default: 15)
 * @returns {Promise<Array>} Array of prediction objects
 */
export async function fetchPredictions(horizonMinutes = 15) {
  try {
    const url = `${PREDICTION_API_BASE}/api/predictions?horizon=${horizonMinutes}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Prediction API failed (${res.status}), falling back to mock predictions`);
      return null; // Will trigger fallback
    }
    const data = await res.json();
    return data.predictions || [];
  } catch (error) {
    console.warn('Prediction API unavailable:', error.message, '- using fallback predictions');
    return null; // Will trigger fallback
  }
}

/**
 * Fetch multi-horizon predictions for a specific building
 * @param {string} buildingId - Building identifier
 * @param {Array<number>} horizons - Array of forecast horizons in minutes
 * @returns {Promise<Object>} Multi-horizon prediction object
 */
export async function fetchBuildingPredictions(buildingId, horizons = [5, 10, 15, 30]) {
  try {
    const horizonQuery = horizons.join(',');
    const url = `${PREDICTION_API_BASE}/api/predictions/building/${buildingId}?horizons=${horizonQuery}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch building predictions (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.warn(`Building prediction API failed for ${buildingId}:`, error.message);
    return null;
  }
}

/**
 * Submit crowd data to the prediction backend for model training
 * @param {string} buildingId - Building identifier
 * @param {number} crowdCount - Current crowd count
 * @param {Date} timestamp - Observation timestamp
 * @returns {Promise<Object>} Submission result
 */
export async function submitCrowdData(buildingId, crowdCount, timestamp = new Date()) {
  try {
    const url = `${PREDICTION_API_BASE}/api/predictions/data`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        buildingId,
        crowdCount,
        timestamp: timestamp.toISOString()
      })
    });
    
    if (!res.ok) {
      throw new Error(`Failed to submit crowd data (${res.status})`);
    }
    
    return await res.json();
  } catch (error) {
    console.warn('Failed to submit crowd data to prediction backend:', error.message);
    return null;
  }
}

/**
 * Get prediction system status and health
 * @returns {Promise<Object>} System status
 */
export async function getPredictionSystemStatus() {
  try {
    const url = `${PREDICTION_API_BASE}/api/predictions/status`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to get prediction status (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.warn('Prediction system status unavailable:', error.message);
    return { available: false, error: error.message };
  }
}

// Get interval options from frontend env (comma-separated), else default list
export function getIntervalOptions() {
  const raw = import.meta.env.VITE_INTERVALS;
  if (raw && typeof raw === 'string') {
    const arr = raw
      .split(',')
      .map(s => Number(String(s).trim()))
      .filter(n => Number.isFinite(n) && n > 0);
    if (arr.length) return arr;
  }
  // Default candidates commonly supported by the backend
  return [1, 2, 5, 10, 15, 30, 60, 120];
}

// Polling options (seconds) for auto-refresh. From VITE_POLL_SECONDS (comma-separated), else sensible defaults
export function getPollOptions() {
  const raw = import.meta.env.VITE_POLL_SECONDS;
  if (raw && typeof raw === 'string') {
    const arr = raw
      .split(',')
      .map(s => Number(String(s).trim()))
      .filter(n => Number.isFinite(n) && n >= 0);
    if (arr.length) return arr;
  }
  // Include 0 to allow "Paused"
  return [0, 5, 10, 15, 30, 60, 120];
}

// no default export to keep tree-shaking clean