const { initSchema } = require('../db/schema');

initSchema().then(() => {
  console.log('Schema initialized');
  process.exit(0);
}).catch(e => {
  console.error('Schema init failed', e);
  process.exit(1);
});
