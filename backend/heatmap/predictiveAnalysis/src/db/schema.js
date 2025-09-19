const { sourcePool } = require('./source');
const { targetPool } = require('./target');

async function initSchema() {
  await sourcePool.query(`
    CREATE TABLE IF NOT EXISTS public.crowds (
      id BIGSERIAL PRIMARY KEY,
      building_id   TEXT        NOT NULL,
      building_name TEXT,
      count         INTEGER     NOT NULL CHECK (count >= 0),
      ts            TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_crowds_building_ts ON public.crowds (building_id, ts DESC);
    CREATE INDEX IF NOT EXISTS idx_crowds_ts ON public.crowds (ts DESC);
  `);

  await targetPool.query(`
    CREATE TABLE IF NOT EXISTS public.predictions (
      id BIGSERIAL PRIMARY KEY,
      building_id     TEXT        NOT NULL,
      building_name   TEXT,
      horizon_min     INTEGER     NOT NULL CHECK (horizon_min > 0),
      current_count   INTEGER     NOT NULL CHECK (current_count >= 0),
      predicted_count INTEGER     NOT NULL CHECK (predicted_count >= 0),
      model           TEXT        NOT NULL DEFAULT 'holt',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_predictions_bld_hz_time
      ON public.predictions (building_id, horizon_min, created_at DESC);
  `);
}

module.exports = { initSchema };
