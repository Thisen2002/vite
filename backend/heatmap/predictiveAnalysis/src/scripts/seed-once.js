const { sourcePool } = require('../db/source');
const { getAll } = require('../buildings');

(async () => {
  const now = new Date();
  for (const b of getAll()) {
    const base = Math.max(0, Math.round(b.capacity * 0.3));
    const jitter = Math.round((Math.random() - 0.5) * (b.capacity * 0.2));
    const count = Math.max(0, Math.min(b.capacity, base + jitter));
    await sourcePool.query(
      'INSERT INTO crowds (building_id, building_name, count, ts) VALUES ($1,$2,$3,$4)',
      [b.building_id, b.building_name, count, now]
    );
  }
  console.log('Seeded a snapshot');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
