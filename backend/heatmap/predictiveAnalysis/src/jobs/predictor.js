const { sourcePool } = require('../db/source');
const { targetPool } = require('../db/target');
const { holtForecast } = require('../model/holt');
const { winsorize, transformLog1p, inverseLog1p } = require('../model/preprocess');
const { getById } = require('../buildings');
const {
  PREDICTION_INTERVALS, MIN_HISTORY_MINUTES, ALPHA, BETA,
  SEASONAL_BLEND, SEASONAL_LOOKBACK_DAYS, SEASONAL_BIN_MINUTES,
  BLEND_WEIGHT_SHORT, BLEND_WEIGHT_LONG, BLEND_SWITCH_MIN,
  WINSORIZE, WINSOR_LO, WINSOR_HI, LOG1P_TRANSFORM
} = require('../config');

let timer = null;

async function computeOnce() {
  // Get distinct buildings with recent data
  const recentSince = new Date(Date.now() - MIN_HISTORY_MINUTES * 60 * 1000);
  const buildingsRes = await sourcePool.query(
    `SELECT DISTINCT building_id FROM crowds WHERE ts >= $1`, [recentSince]
  );
  const ids = buildingsRes.rows.map(r => r.building_id);

  for (const id of ids) {
    const hist = await sourcePool.query(
      `SELECT count, ts, building_name FROM crowds
       WHERE building_id=$1 AND ts >= $2
       ORDER BY ts ASC`, [id, recentSince]
    );
    if (hist.rowCount < 2) continue;
    let series = hist.rows.map(r => Number(r.count));
    const current = series[series.length - 1];
    const name = hist.rows[hist.rowCount - 1].building_name || id;

    // Robust preprocessing
    if (WINSORIZE) series = winsorize(series, WINSOR_LO, WINSOR_HI);
    let useLog = false;
    if (LOG1P_TRANSFORM) { series = transformLog1p(series); useLog = true; }

    // Seasonal baseline: mean count per time-of-day bin over recent days
    let seasonalValue = null;
    if (SEASONAL_BLEND) {
      const lookbackSince = new Date(Date.now() - SEASONAL_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
      const baseRes = await sourcePool.query(
        `SELECT EXTRACT(HOUR FROM ts) AS hh,
                EXTRACT(MINUTE FROM ts) AS mm,
                count
         FROM crowds
         WHERE building_id=$1 AND ts >= $2`, [id, lookbackSince]
      );
      const bins = new Map();
      for (const r of baseRes.rows) {
        const hh = Number(r.hh), mm = Number(r.mm);
        const bin = Math.floor((hh * 60 + mm) / SEASONAL_BIN_MINUTES);
        const key = String(bin);
        if (!bins.has(key)) bins.set(key, []);
        bins.get(key).push(Number(r.count));
      }
      const now = new Date();
      const nowBin = Math.floor(((now.getHours() * 60) + now.getMinutes()) / SEASONAL_BIN_MINUTES);
      const vals = bins.get(String(nowBin)) || [];
      if (vals.length) {
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        seasonalValue = avg;
      }
    }

    const info = getById(id);
    const maxCap = info?.capacity && Number.isFinite(info.capacity) ? info.capacity : undefined;
    for (const h of PREDICTION_INTERVALS) {
      const steps = Math.max(1, Math.round(h));
      let pred = holtForecast(series, steps, ALPHA, BETA, { max: maxCap });
      // If forecasting on log scale, invert.
      if (useLog) pred = Math.max(0, Math.round(inverseLog1p(pred)));

      // Blend seasonal baseline with Holt prediction (horizon-aware)
      if (SEASONAL_BLEND && Number.isFinite(seasonalValue)) {
        const w = steps <= BLEND_SWITCH_MIN
          ? BLEND_WEIGHT_SHORT
          : BLEND_WEIGHT_LONG;
        pred = Math.round(w * seasonalValue + (1 - w) * pred);
      }

      // Final capacity clamp
      if (Number.isFinite(maxCap)) pred = Math.min(maxCap, Math.max(0, pred));
      await targetPool.query(
        `INSERT INTO predictions (building_id, building_name, horizon_min, current_count, predicted_count, model)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [id, name, h, current, pred, SEASONAL_BLEND ? 'holt-damped+seasonal' : 'holt-damped']
      );
    }
  }
}

function startPredictor(log=console) {
  async function loop() {
    try { await computeOnce(); log.info?.('[predictor] computed'); }
    catch (e) { log.error?.('[predictor] error', e.message); }
    finally { timer = setTimeout(loop, 60 * 1000); }
  }
  if (!timer) loop();
  return () => { if (timer) clearTimeout(timer); timer = null; };
}

module.exports = { startPredictor, computeOnce };
