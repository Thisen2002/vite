// API client for prediction backend
// Uses env overrides; default to backend dev port 3897
const API_BASE =
  import.meta.env.VITE_HEATMAP_API_URL ||
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_MAIN_API_URL ||
  'http://localhost:3897';

// Exported for diagnostics in UI
export const API_BASE_URL = API_BASE;

// Horizons (minutes) selectable in UI
export function getIntervalOptions() {
  const raw = import.meta.env.VITE_INTERVALS;
  if (raw && typeof raw === 'string') {
    const arr = raw
      .split(',')
      .map(s => Number(String(s).trim()))
      .filter(n => Number.isFinite(n) && n > 0);
    if (arr.length) return arr;
  }
  return [15, 30, 60, 120];
}

// Latest predictions across buildings, optionally filtered by horizons (array of minutes)
export async function fetchLatestPredictions(horizons) {
  const params = new URLSearchParams();
  if (Array.isArray(horizons) && horizons.length) {
    params.set('horizons', horizons.join(','));
  }
  const url = `${API_BASE}/predictions/latest${params.toString() ? `?${params}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch latest predictions (${res.status})`);
  return res.json();
}

// Predictions for a single horizon
export async function fetchPredictionsByHorizon(horizon) {
  const url = `${API_BASE}/predictions?horizons=${encodeURIComponent(horizon)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch predictions for horizon ${horizon} (${res.status})`);
  return res.json();
}

// Distinct buildings known to the system
export async function fetchBuildings() {
  const url = `${API_BASE}/buildings`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch buildings (${res.status})`);
  return res.json();
}

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) return { ok: false };
    return res.json();
  } catch {
    return { ok: false };
  }
}

// no default export to keep tree-shaking clean