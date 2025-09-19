# Predictive Analysis Service

A small Node/Express service that:
- Polls a data source every minute for building crowd counts (defaults to a built‑in generator).
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
npm run db:init
npm run dev
```
The service listens on `http://localhost:3897` by default.

## Endpoints
- `GET /health` → `{ ok: true }` when running
- `GET /buildings` → building catalog (id, name, capacity)
- `GET /generator/snapshot` → random counts for all buildings (for testing)
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

## Notes
- Schema is idempotent; safe to run `npm run db:init` repeatedly.
- Predictions are appended; the latest per horizon is retrieved via DISTINCT ON.
- Adjust `ALPHA`/`BETA` to tune responsiveness.