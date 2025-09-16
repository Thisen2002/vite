// Periodic dummy data generator for the Source DB (crowd_stream)
// Generates realistic random-walk counts per building, bounded by capacity.
const cfg = require('../../config/env');
const { createSourceClient } = require('../../infrastructure/db/sourceClient');

// Example building list — replace with your frontend dummy server.js source if needed
const DEFAULT_BUILDINGS = [
  { building_id: 1, building_name: 'Faculty Canteen', capacity: 120, color: '#ef4444' },
  { building_id: 2, building_name: 'Lecture Hall 1', capacity: 100, color: '#f59e0b' },
  { building_id: 3, building_name: 'Drawing Office 1', capacity: 150, color: '#10b981' },
  { building_id: 4, building_name: 'Library', capacity: 200, color: '#3b82f6' },
  { building_id: 5, building_name: 'Lab 1', capacity: 80, color: '#8b5cf6' },
  { building_id: 6, building_name: 'Lecture Hall 2', capacity: 90, color: '#ec4899' },
  { building_id: 7, building_name: 'Drawing Office 2', capacity: 130, color: '#22d3ee' },
];

async function seedBuildingCatalog(client, buildings = DEFAULT_BUILDINGS) {
  await client.query('BEGIN');
  try {
    for (const b of buildings) {
      await client.query(
        `INSERT INTO building_catalog (building_id, building_name, capacity, color)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (building_id) DO UPDATE SET
           building_name = EXCLUDED.building_name,
           capacity = EXCLUDED.capacity,
           color = EXCLUDED.color`,
        [b.building_id, b.building_name, b.capacity, b.color]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
}

function nextRandomWalk(prev, cap) {
  let next = prev + Math.floor(Math.random() * 9) - 4; // -4..+4
  next = Math.max(0, Math.min(cap || 150, next));
  return next;
}

async function runGeneratorOnce(client) {
  const { rows: buildings } = await client.query('SELECT building_id, building_name, capacity FROM building_catalog ORDER BY building_id');
  const now = new Date();
  for (const b of buildings) {
    // Get last value for random walk continuity
    const last = await client.query(
      `SELECT crowd_count FROM crowd_stream WHERE building_id = $1 ORDER BY ts DESC LIMIT 1`,
      [b.building_id]
    );
    const prev = last.rows[0]?.crowd_count ?? Math.floor((b.capacity || 120) * 0.5);
    const value = nextRandomWalk(prev, b.capacity);
    await client.query(
      `INSERT INTO crowd_stream (building_id, building_name, ts, crowd_count)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (building_id, ts) DO NOTHING`,
      [b.building_id, b.building_name, now, value]
    );
  }
}

async function startGenerator() {
  const client = createSourceClient();
  await client.connect();
  console.log('[generator] connected to source DB');
  await seedBuildingCatalog(client);
  console.log('[generator] building_catalog seeded');

  // Run once immediately, then on interval
  await runGeneratorOnce(client);
  console.log('[generator] first batch written');
  setInterval(async () => {
    try {
      await runGeneratorOnce(client);
      console.log('[generator] batch written');
    } catch (e) {
      console.error('[generator] error writing batch', e.message);
    }
  }, cfg.generatorIntervalMs);
}

module.exports = { startGenerator };
