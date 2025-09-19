const express = require('express');
const cors = require('cors');
const { PORT } = require('./config');
const { initSchema } = require('./db/schema');
const { startPoller } = require('./jobs/poller');
const { startPredictor } = require('./jobs/predictor');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/health', require('./routes/health'));
app.use('/buildings', require('./routes/buildings'));
app.use('/predictions', require('./routes/predictions'));
app.use('/generator', require('./routes/generator'));
app.use('/heatmap', require('./routes/heatmap'));

let stopPoller = null;
let stopPredictor = null;

async function start() {
  await initSchema();
  stopPoller = startPoller(console);
  stopPredictor = startPredictor(console);
  app.listen(PORT, () => console.log(`[predictive-analysis] listening on :${PORT}`));
}

start().catch(err => {
  console.error('Failed to start service:', err);
  process.exit(1);
});

process.on('SIGINT', () => { if (stopPoller) stopPoller(); if (stopPredictor) stopPredictor(); process.exit(0); });
process.on('SIGTERM', () => { if (stopPoller) stopPoller(); if (stopPredictor) stopPredictor(); process.exit(0); });
