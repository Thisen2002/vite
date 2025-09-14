const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const routeFromArbitraryPoint = require("./routing")
const fs = require('fs/promises');
const { searchDatabase } = require('./search');

const app = express();
app.use(cors());
app.use(bodyParser.json()); // parse JSON payloads

const HTTP_PORT = 3000;

// ---- Campus data (replace with real GeoJSON) ----
const buildings = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { id: 1, name: 'Drawing Office II', traffic: 70 },
        geometry: {
          type: 'Polygon',
          coordinates: [[[80.59188023135636,7.253857669696],[80.59187822066399,7.25365356212403],[80.59248120552412,7.25364184977534],[80.59247852460102,7.25385460034244],[80.59188023135636,7.253857669696]]]
        }
      },
      {
        type: 'Feature',
        properties: { id: 2, name: 'AR Office', traffic: 40 },
        geometry: {
          type: 'Polygon',
          coordinates: [[[80.59238429412962,7.2546268645326],[80.59253094061617,7.25462540188746],[80.59253174488086,7.25435175192675],[80.59260211911277,7.25435042223748],[80.59260211911277,7.25420149701512],[80.59252973418849,7.25420149701512],[80.59252665110238,7.25392239504726],[80.59237263205674,7.25392239504726],[80.59238429412962,7.2546268645326]]]
        }
      },
      {
        type: 'Feature',
        properties: { id: 3, name: 'AR Office', traffic: 0 },
        geometry: {
          type: 'Polygon',
          coordinates: [[[80.593522,7.251965], [80.590489, 7.255709], []]]
        }
      }
    ]
  };
  
  const detailsById = {
    1: { exhibits: ['Robotics demo', '3D Printing'], categories: ['Mechanical', 'Automation'] },
    2: { exhibits: ['Smart Grid', 'Drone Show'], categories: ['Electrical', 'IoT'] }
  };

let traffic = { 1: 70, 2: 40 }; // baseline

// --- SSE client registry ---
let clients = [];

app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.flushHeaders?.(); // for some Express versions

  // send initial snapshot
  res.write(`data: ${JSON.stringify({ type: "traffic", data: traffic })}\n\n`);

  // register this client
  clients.push(res);

  // cleanup on close
  req.on("close", () => {
    clients = clients.filter(c => c !== res);
  });
});

// --- REST endpoints for map + building info ---
app.get("/api/buildings", (req, res) => {
  const withTraffic = {
    ...buildings,
    features: buildings.features.map(f => ({
      ...f,
      properties: { ...f.properties, traffic: traffic[f.properties.id] }
    }))
  };
  res.json(withTraffic);
});

app.get("/api/building/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!detailsById[id]) return res.status(404).json({ error: "Not found" });
  res.json({ ...detailsById[id], traffic: traffic[id] });
});

// --- Webhook endpoint (called by external service) ---
app.post("/webhook/traffic", (req, res) => {
  const update = req.body; // expected format: { "1": 55, "2": 80 }
  console.log("Webhook received traffic update:", update);

  // merge update into traffic
  traffic = { ...traffic, ...update };

  // broadcast to SSE clients
  const payload = `data: ${JSON.stringify({ type: "traffic", data: update })}\n\n`;
  clients.forEach(c => c.write(payload));

  res.json({ status: "ok" });
});

app.get("/routing", (req, res) => {
  var {lat, long, dest} = req.query;
  //console.log(req.query)
  if(!dest){
    console.log(`requested /routing : undefined`);
    res.status(500).json({ error: 'Failed to find the path' });
  }else {
    console.log(`requested /routing : lat=${lat} long=${long} dest=${dest}`);
    res.json(routeFromArbitraryPoint([lat,long], Number(dest)));
  }
});

// Search API endpoint
app.get("/api/search", (req, res) => {
  const { query, category, zone, subzone } = req.query;
  
  if (!query || query.trim() === '') {
    return res.json({ results: [] });
  }
  
  try {
    const results = searchDatabase(query, { category, zone, subzone });
    res.json({ 
      results: results,
      total: results.length 
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

app.get('/map', async (req, res) => {
  try {
    const svgContent = await fs.readFile('./map.svg', 'utf8');
    res.set('Content-Type', 'text/plain'); // Send as plain text
    res.send(svgContent);
    console.log('requested /map: map file served')
  } catch (error) {
    console.error('Error reading SVG file:', error.message);
    res.status(500).json({ error: 'Failed to read SVG file' });
  }
});

app.listen(HTTP_PORT, () => {
  console.log(`Server running on http://localhost:${HTTP_PORT}`);
});
