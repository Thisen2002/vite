const { sourcePool } = require('../db/source');
const { targetPool } = require('../db/target');
const { holtForecast } = require('../model/holt');
const { PREDICTION_INTERVALS, MIN_HISTORY_MINUTES, ALPHA, BETA } = require('../config');

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
    const series = hist.rows.map(r => Number(r.count));
    const current = series[series.length - 1];
    const name = hist.rows[hist.rowCount - 1].building_name || id;

    for (const h of PREDICTION_INTERVALS) {
      const steps = Math.max(1, Math.round(h));
      const pred = holtForecast(series, steps, ALPHA, BETA);
      await targetPool.query(
        `INSERT INTO predictions (building_id, building_name, horizon_min, current_count, predicted_count)
         VALUES ($1,$2,$3,$4,$5)`,
        [id, name, h, current, pred]
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
