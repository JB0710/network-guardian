const express = require('express');
const cors = require('cors');
const ping = require('ping');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory device storage (replace with database in production)
let devices = [
  {
    id: "1",
    name: "Web Server",
    ip: "192.168.1.10",
    status: "unknown",
    category: "physical-server",
    responseTime: 0,
    lastCheck: new Date().toISOString(),
    uptime: 0,
    location: "Data Center A",
    successfulPings: 0,
    totalPings: 0
  },
  {
    id: "2",
    name: "Primary Database",
    ip: "192.168.1.20",
    status: "unknown",
    category: "database",
    responseTime: 0,
    lastCheck: new Date().toISOString(),
    uptime: 0,
    location: "Data Center A",
    successfulPings: 0,
    totalPings: 0
  },
  {
    id: "3",
    name: "Mail Server VM",
    ip: "192.168.1.30",
    status: "unknown",
    category: "virtual-machine",
    responseTime: 0,
    lastCheck: new Date().toISOString(),
    uptime: 0,
    location: "Data Center B",
    successfulPings: 0,
    totalPings: 0
  },
  {
    id: "4",
    name: "Core Switch",
    ip: "192.168.1.40",
    status: "unknown",
    category: "switch",
    responseTime: 0,
    lastCheck: new Date().toISOString(),
    uptime: 0,
    location: "Data Center A",
    successfulPings: 0,
    totalPings: 0
  },
  {
    id: "5",
    name: "Edge Firewall",
    ip: "192.168.1.50",
    status: "unknown",
    category: "firewall",
    responseTime: 0,
    lastCheck: new Date().toISOString(),
    uptime: 0,
    location: "Data Center B",
    successfulPings: 0,
    totalPings: 0
  },
  {
    id: "6",
    name: "App VM Cluster",
    ip: "192.168.1.60",
    status: "unknown",
    category: "virtual-machine",
    responseTime: 0,
    lastCheck: new Date().toISOString(),
    uptime: 0,
    location: "Data Center A",
    successfulPings: 0,
    totalPings: 0
  }
];

// Ping a single device
async function pingDevice(device) {
  try {
    const result = await ping.promise.probe(device.ip, {
      timeout: 10,
      extra: ['-c', '1']
    });

    device.totalPings++;
    device.lastCheck = new Date().toISOString();

    if (result.alive) {
      device.successfulPings++;
      device.responseTime = Math.round(result.time);
      
      // Status based on response time
      if (device.responseTime < 100) {
        device.status = 'online';
      } else {
        device.status = 'warning';
      }
    } else {
      device.status = 'offline';
      device.responseTime = undefined;
    }

    // Calculate uptime percentage
    device.uptime = device.totalPings > 0 
      ? Number(((device.successfulPings / device.totalPings) * 100).toFixed(2))
      : 0;

    console.log(`Pinged ${device.name} (${device.ip}): ${device.status} - ${device.responseTime || 'N/A'}ms`);
  } catch (error) {
    console.error(`Error pinging ${device.name}:`, error.message);
    device.status = 'offline';
    device.responseTime = undefined;
    device.totalPings++;
    device.lastCheck = new Date().toISOString();
    device.uptime = device.totalPings > 0 
      ? Number(((device.successfulPings / device.totalPings) * 100).toFixed(2))
      : 0;
  }
}

// Ping all devices
async function pingAllDevices() {
  console.log('Starting ping cycle...');
  await Promise.all(devices.map(device => pingDevice(device)));
  console.log('Ping cycle completed');
}

// API Routes
app.get('/api/devices', (req, res) => {
  res.json(devices);
});

app.get('/api/devices/:id', (req, res) => {
  const device = devices.find(d => d.id === req.params.id);
  if (device) {
    res.json(device);
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

app.post('/api/devices', (req, res) => {
  const newDevice = {
    id: String(devices.length + 1),
    name: req.body.name,
    ip: req.body.ip,
    status: 'unknown',
    category: req.body.category || 'physical-server',
    responseTime: 0,
    lastCheck: new Date().toISOString(),
    uptime: 0,
    location: req.body.location || 'Unknown',
    successfulPings: 0,
    totalPings: 0
  };
  devices.push(newDevice);
  res.status(201).json(newDevice);
});

app.put('/api/devices/:id', (req, res) => {
  const device = devices.find(d => d.id === req.params.id);
  if (device) {
    device.name = req.body.name || device.name;
    device.ip = req.body.ip || device.ip;
    device.category = req.body.category || device.category;
    device.location = req.body.location !== undefined ? req.body.location : device.location;
    res.json(device);
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

app.delete('/api/devices/:id', (req, res) => {
  const index = devices.findIndex(d => d.id === req.params.id);
  if (index !== -1) {
    devices.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

app.post('/api/ping-now', async (req, res) => {
  await pingAllDevices();
  res.json({ message: 'Ping completed', devices });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Schedule automatic pings every 30 seconds
cron.schedule('*/30 * * * * *', () => {
  pingAllDevices();
});

// Initial ping on startup
pingAllDevices();

app.listen(PORT, () => {
  console.log(`Network Monitor Backend running on http://localhost:${PORT}`);
  console.log('Pinging devices every 30 seconds...');
});
