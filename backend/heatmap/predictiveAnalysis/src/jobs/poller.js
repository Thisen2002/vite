const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { sourcePool } = require('../db/source');
const { EXTERNAL_API_URL, POLL_INTERVAL_MS } = require('../config');
const { getById } = require('../buildings');

let timer = null;

async function tickOnce() {
  const res = await fetch(EXTERNAL_API_URL, { timeout: POLL_INTERVAL_MS - 100 });
  if (!res.ok) throw new Error(`Poller fetch failed ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) return;

  for (const row of data) {
    const id = String(row.building_id || row.buildingId);
    const count = Number(row.count ?? row.current_count ?? 0);
    const ts = row.ts ? new Date(row.ts) : new Date();
    const meta = getById(id) || { building_name: id };
    await sourcePool.query(
      'INSERT INTO crowds (building_id, building_name, count, ts) VALUES ($1,$2,$3,$4)',
      [id, row.building_name || meta.building_name || id, count, ts]
    );
  }
}

function startPoller(log=console) {
  async function loop() {
    try { await tickOnce(); log.info?.('[poller] tick ok'); }
    catch (e) { log.error?.('[poller] error', e.message); }
    finally { timer = setTimeout(loop, POLL_INTERVAL_MS); }
  }
  if (!timer) loop();
  return () => { if (timer) clearTimeout(timer); timer = null; };
}

module.exports = { startPoller, tickOnce };
