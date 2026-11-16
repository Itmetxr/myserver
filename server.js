import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.join(__dirname, 'public');
const DRONE_ID = process.env.DRONE_ID;

app.use(express.json({ limit: '32kb' }));
app.use(express.static(publicDirectory));

function parseDroneId(value) {
  const droneId = Number(value);
  return Number.isInteger(droneId) && droneId > 0 ? droneId : null;
}

function requireEnvironment(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

async function readJsonResponse(response, serviceName) {
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`${serviceName} returned an invalid JSON response`);
  }
  if (!response.ok) {
    throw new Error(`${serviceName} returned HTTP ${response.status}`);
  }
  return data;
}

async function getDroneConfig(droneId) {
  const response = await fetch(requireEnvironment('CONFIG_API'));
  const json = await readJsonResponse(response, 'Drone Config Server');
  const configs = Array.isArray(json.data) ? json.data : [];
  return configs.find((item) => Number(item.drone_id) === droneId) ?? null;
}

async function getDroneLogs(droneId, page) {
  const baseUrl = requireEnvironment('LOG_API');
  const token = requireEnvironment('LOG_API_TOKEN');
  const url = new URL(baseUrl);
  url.searchParams.set('sort', '-created');
  url.searchParams.set('perPage', '12');
  url.searchParams.set('page', String(page));
  url.searchParams.set('filter', `(drone_id=${droneId})`);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await readJsonResponse(response, 'Drone Log Server');
  if (!Array.isArray(json.items)) return [];

  return json.items.map(({ drone_id, drone_name, created, country, celsius }) => ({
    drone_id,
    drone_name,
    created,
    country,
    celsius,
  }));
}

async function createDroneLog(logData) {
  const url = requireEnvironment('LOG_API');
  const token = requireEnvironment('LOG_API_TOKEN');
  const payload = {
    drone_id: logData.drone_id,
    drone_name: logData.drone_name,
    country: logData.country,
    celsius: logData.celsius,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return readJsonResponse(response, 'Drone Log Server');
}

app.get('/api/setup', (req, res) => {
  const droneId = parseDroneId(DRONE_ID);
  if (!droneId) {
    return res.status(500).json({ error: 'DRONE_ID must be set to a positive integer' });
  }
  return res.json({ droneId });
});

app.get('/configs/:droneId', async (req, res) => {
  const droneId = parseDroneId(req.params.droneId);
  if (!droneId) return res.status(400).json({ error: 'droneId must be a positive integer' });

  try {
    const config = await getDroneConfig(droneId);
    if (!config) return res.status(404).json({ error: 'no drone match' });
    const { drone_id, drone_name, light, country, weight } = config;
    return res.json({ drone_id, drone_name, light, country, weight });
  } catch (error) {
    console.error('Config request failed:', error.message);
    return res.status(502).json({ error: 'cannot fetch config' });
  }
});

app.get('/status/:droneId', async (req, res) => {
  const droneId = parseDroneId(req.params.droneId);
  if (!droneId) return res.status(400).json({ error: 'droneId must be a positive integer' });

  try {
    const config = await getDroneConfig(droneId);
    if (!config) return res.status(404).json({ error: 'no drone match' });
    return res.json({ condition: config.condition });
  } catch (error) {
    console.error('Status request failed:', error.message);
    return res.status(502).json({ error: 'cannot fetch status' });
  }
});

app.get('/logs/:droneId', async (req, res) => {
  const droneId = parseDroneId(req.params.droneId);
  if (!droneId) return res.status(400).json({ error: 'droneId must be a positive integer' });

  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  try {
    return res.json(await getDroneLogs(droneId, page));
  } catch (error) {
    console.error('Logs request failed:', error.message);
    return res.status(502).json({ error: 'cannot fetch logs' });
  }
});

app.post('/logs', async (req, res) => {
  const { drone_id, drone_name, country, celsius } = req.body ?? {};
  if (!parseDroneId(drone_id) || !drone_name || !country || !Number.isFinite(Number(celsius))) {
    return res.status(400).json({ success: false, error: 'drone_id, drone_name, country, and numeric celsius are required' });
  }

  try {
    const data = await createDroneLog({ drone_id, drone_name, country, celsius: Number(celsius) });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Create log failed:', error.message);
    return res.status(502).json({ success: false, error: 'cannot create log' });
  }
});

for (const page of ['config', 'form', 'logs']) {
  app.get(`/${page}`, (req, res) => res.sendFile(path.join(publicDirectory, `${page}.html`)));
}

app.use((req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/configs/') || req.path.startsWith('/status/') || req.path.startsWith('/logs/')) {
    return res.status(404).json({ error: 'not found' });
  }
  return res.status(404).send('Page not found');
});

export default app;

if (process.env.VERCEL !== '1') {
  const port = process.env.PORT || 8000;
  app.listen(port, () => console.log(`Server is running on ${port}`));
}




