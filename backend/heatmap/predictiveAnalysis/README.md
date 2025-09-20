# Predictive Analysis Service

### Model Notes
- Algorithm: Holt’s linear method with optional damped trend (Gardner & McKenzie). When ≥ 6 historical points are available per building, a lightweight grid search tunes `alpha`, `beta`, and the damping factor `phi` to minimize one-step-ahead SSE during smoothing. For shorter histories (≤ 5), it falls back to provided `ALPHA`/`BETA` with an undamped trend.
- Initialization: Level from the first observation; trend from the average of the first few differences for stability.
- Clamping: Forecasts are non-negative and capped at the building capacity, when known from the built-in catalog.
- Traceability: Inserted predictions include `model = 'holt-damped'` in the database.

### Seasonal Blending & Robust Preprocessing
- Daily seasonal baseline: computes an average count per time-of-day bin (default 15 minutes) over the last N days (default 7) and blends it with the damped Holt forecast. Weight is horizon-aware: smaller at short horizons, larger at longer horizons.
- Robustness: Optional winsorization (trim outliers by percentile) and optional `log1p` transform to stabilize variance.

Config flags (.env):
```
# Seasonal
SEASONAL_BLEND=true
SEASONAL_LOOKBACK_DAYS=7
SEASONAL_BIN_MINUTES=15
BLEND_WEIGHT_SHORT=0.3
BLEND_WEIGHT_LONG=0.6
BLEND_SWITCH_MIN=60

# Robust preprocessing
WINSORIZE=true
WINSOR_LO=5
WINSOR_HI=95
LOG1P_TRANSFORM=false
```

Quick verify (PowerShell):
```
cd "D:\CO227 Project\new code\vite\backend\heatmap\predictiveAnalysis"
npm run dev

# In a separate PowerShell
Invoke-WebRequest -Uri http://localhost:3897/health | Select-Object -ExpandProperty Content
Start-Sleep -Seconds 75
Invoke-WebRequest -Uri http://localhost:3897/predictions/latest | Select-Object -ExpandProperty Content
```
- Stores samples in `crowd_data.crowds`.
- Computes Holt’s linear forecasts for configured horizons.
- Stores predictions in `crowd_predictions.predictions` and exposes REST endpoints for the frontend.

## Prerequisites
- Node.js LTS
- PostgreSQL with two databases created:
  - `crowd_data`
  - `crowd_predictions`
- Tables are auto-created on startup.

## Configure
Copy `.env.example` to `.env` and adjust as needed.

```env
PREDICTOR_PORT=3897
SOURCE_DB_URL=postgres://postgres:9295@localhost:5432/crowd_data
TARGET_DB_URL=postgres://postgres:9295@localhost:5432/crowd_predictions
EXTERNAL_API_URL=http://localhost:3897/generator/snapshot
PREDICTION_INTERVALS=15,30,60,120
POLL_INTERVAL_MS=60000
MIN_HISTORY_MINUTES=60
ALPHA=0.6
BETA=0.3
```

## Install & Run
```powershell
cd backend/heatmap/predictiveAnalysis
npm install
npm install node-fetch@2
npm run db:init
npm run dev
```
The service listens on `http://localhost:3897` by default.

## Endpoints
- `GET /health` → `{ ok: true }` when running
- `GET /buildings` → building catalog (id, name, capacity)
- `GET /generator/snapshot` → random counts for all buildings (for testing)
- `GET /heatmap/map-data` → payload for `SvgHeatmap.jsx` (data array with id/building_id/name/capacity/count)
- `GET /predictions?horizons=15,30&buildingId=B8` → latest per (building,horizon)
- `GET /predictions/latest` → latest per building across all horizons

## How it works
- Poller hits `EXTERNAL_API_URL` every `POLL_INTERVAL_MS` and inserts rows into `crowds` with timestamps.
- Predictor reads the last `MIN_HISTORY_MINUTES` per building and computes forecasts for each `PREDICTION_INTERVALS` using Holt’s model (`ALPHA`, `BETA`).
- Frontend queries the predictions endpoints to display values.

## Switch to real data source
Set `EXTERNAL_API_URL` to your real API that returns an array of:
```json
[
  { "building_id": "B8", "count": 42, "ts": "2025-09-19T10:00:00Z" }
]
```
`building_name` is optional; the service fills it using the internal catalog when missing.

## Frontend Setup
Set the Heatmap API URL in the root frontend `.env` (same folder as `vite.config.ts`):

```env
VITE_HEATMAP_API_URL=http://localhost:3897
```

Then run the Vite dev server:

```powershell
cd "d:\CO227 Project\new code\vite"
npm install
npm run dev
```

The Heatmap page reads predictions via `VITE_HEATMAP_API_URL` and will show a small status chip with backend status and the API base.

## Notes
- Schema is idempotent; safe to run `npm run db:init` repeatedly.
- Predictions are appended; the latest per horizon is retrieved via DISTINCT ON.
- Adjust `ALPHA`/`BETA` to tune responsiveness.

## Troubleshooting
- SASL: SCRAM “client password must be a string”
  - Your `SOURCE_DB_URL`/`TARGET_DB_URL` is missing or the password is undefined/incorrect. Copy `.env.example` to `.env` and set full URLs. URL-encode special characters like `@ : #`.
  - Example: `postgres://postgres:P%40ss%23rd!@localhost:5432/crowd_data`

- Poller error: Cannot find package 'node-fetch'
  - Install node-fetch v2 (timeout option compatible): `npm install node-fetch@2` in this folder, then `npm run dev`.

- Frontend shows “Backend offline”
  - Ensure backend health: open `http://localhost:3897/health` → `{ ok: true }`.
  - Ensure frontend env has `VITE_HEATMAP_API_URL=http://localhost:3897` and restart Vite.
  - Avoid mixed-content (HTTPS page calling HTTP API) and port conflicts.

- Predictions empty
  - Wait a minute for the poller and predictor to run; verify `http://localhost:3897/generator/snapshot` returns data.
  - Check `http://localhost:3897/predictions?horizons=30` returns rows; otherwise confirm the source DB `crowds` table has recent rows.

## Verify endpoints quickly
Open in a browser:
- Health: `http://localhost:3897/health`
- Map data: `http://localhost:3897/heatmap/map-data`
- Predictions: `http://localhost:3897/predictions?horizons=30`