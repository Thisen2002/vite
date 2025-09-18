// Periodic dummy data generator for the Source DB (crowd_stream)
// Generates realistic random-walk counts per building, bounded by capacity.
const cfg = require('../../config/env');
const { createSourceClient } = require('../../infrastructure/db/sourceClient');

// Expanded building catalog aligned with SvgHeatmap (B1..B34)
// Numeric building_id maps directly to B-code (1 => B1, 2 => B2, ...)
// If frontend expects B-codes, you can derive on API response: `B${building_id}`.
const DEFAULT_BUILDINGS = [
  { building_id: 1,  building_name: 'Engineering Carpentry Shop', capacity: 120, color: '#ef4444' },
  { building_id: 2,  building_name: 'Engineering Workshop', capacity: 100, color: '#f59e0b' },
  { building_id: 3,  building_name: 'Building B3', capacity: 60, color: '#10b981' },
  { building_id: 4,  building_name: 'Generator Room', capacity: 120, color: '#3b82f6' },
  { building_id: 5,  building_name: 'Building B5', capacity: 120, color: '#8b5cf6' },
  { building_id: 6,  building_name: 'Structure Lab', capacity: 150, color: '#ec4899' },
  { building_id: 7,  building_name: 'Administrative Building', capacity: 50, color: '#22d3ee' },
  { building_id: 8,  building_name: 'Canteen', capacity: 80, color: '#6366f1' },
  { building_id: 9,  building_name: 'Lecture Room 10/11', capacity: 200, color: '#84cc16' },
  { building_id: 10, building_name: 'Engineering Library', capacity: 40, color: '#0ea5e9' },
  { building_id: 11, building_name: 'Department of Chemical and Process Engineering', capacity: 80, color: '#f472b6' },
  { building_id: 12, building_name: 'Security Unit', capacity: 60, color: '#fb7185' },
  { building_id: 13, building_name: 'Drawing Office 2', capacity: 40, color: '#475569' },
  { building_id: 14, building_name: 'Faculty Canteen', capacity: 80, color: '#14b8a6' },
  { building_id: 15, building_name: 'Department of Manufacturing and Industrial Engineering', capacity: 100, color: '#f59e0b' },
  { building_id: 16, building_name: 'Professor E.O.E. Perera Theater', capacity: 60, color: '#a855f7' },
  { building_id: 17, building_name: 'Electronic Lab', capacity: 35, color: '#64748b' },
  { building_id: 18, building_name: 'Washrooms', capacity: 120, color: '#dc2626' },
  { building_id: 19, building_name: 'Electrical and Electronic Workshop', capacity: 45, color: '#f97316' },
  { building_id: 20, building_name: 'Department of Computer Engineering', capacity: 30, color: '#2563eb' },
  { building_id: 21, building_name: 'Building B21', capacity: 120, color: '#0891b2' },
  { building_id: 22, building_name: 'Environmental Lab', capacity: 70, color: '#4d7c0f' },
  { building_id: 23, building_name: 'Applied Mechanics Lab', capacity: 90, color: '#f43f5e' },
  { building_id: 24, building_name: 'New Mechanics Lab', capacity: 150, color: '#7c3aed' },
  { building_id: 25, building_name: 'Building B25', capacity: 60, color: '#0d9488' },
  { building_id: 26, building_name: 'Building B26', capacity: 120, color: '#0369a1' },
  { building_id: 27, building_name: 'Building B27', capacity: 160, color: '#ea580c' },
  { building_id: 28, building_name: 'Materials Lab', capacity: 100, color: '#0284c7' },
  { building_id: 29, building_name: 'Thermodynamics Lab', capacity: 100, color: '#16a34a' },
  { building_id: 30, building_name: 'Fluids Lab', capacity: 100, color: '#c026d3' },
  { building_id: 31, building_name: 'Surveying and Soil Lab', capacity: 80, color: '#e11d48' },
  { building_id: 32, building_name: 'Department of Engineering Mathematics', capacity: 60, color: '#0f766e' },
  { building_id: 33, building_name: 'Drawing Office 1', capacity: 120, color: '#6366f1' },
  { building_id: 34, building_name: 'Department of Electrical and Electronic Engineering', capacity: 120, color: '#4338ca' }
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
