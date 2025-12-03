const express = require('express');
const cors = require('cors');
const ping = require('ping');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3001;

// Blink1 server configuration
const BLINK1_SERVER_URL = process.env.BLINK1_SERVER_URL || 'http://localhost:8934';
let isBlinking = false;
let blink1Enabled = true; // Toggle for enabling/disabling blink1 alerts

// Trigger blink1 to blink red on ALL connected blink1 devices
async function triggerBlink1Alert() {
  if (isBlinking || !blink1Enabled) return; // Already blinking or disabled
  
  try {
    // Use /blink1/blink with id=all to blink all connected devices
    const response = await fetch(`${BLINK1_SERVER_URL}/blink1/blink?rgb=%23FF0000&time=500&count=0&id=all`);
    if (response.ok) {
      isBlinking = true;
      console.log('Blink1: Started red alert blinking on all devices');
    } else {
      console.error('Blink1: Failed to trigger alert -', response.status);
    }
  } catch (error) {
    console.error('Blink1: Could not connect to blink1-server -', error.message);
  }
}

// Stop blink1 alert on ALL devices
async function stopBlink1Alert() {
  if (!isBlinking) return; // Not currently blinking
  
  try {
    const response = await fetch(`${BLINK1_SERVER_URL}/blink1/off?id=all`);
    if (response.ok) {
      isBlinking = false;
      console.log('Blink1: Stopped alert on all devices');
    } else {
      console.error('Blink1: Failed to stop alert -', response.status);
    }
  } catch (error) {
    console.error('Blink1: Could not connect to blink1-server -', error.message);
  }
}

// Test blink1 - blink red 3 times on all devices
async function testBlink1() {
  try {
    const response = await fetch(`${BLINK1_SERVER_URL}/blink1/blink?rgb=%23FF0000&time=300&count=3&id=all`);
    if (response.ok) {
      console.log('Blink1: Test triggered on all devices');
      return true;
    } else {
      console.error('Blink1: Test failed -', response.status);
      return false;
    }
  } catch (error) {
    console.error('Blink1: Could not connect to blink1-server -', error.message);
    return false;
  }
}

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
  
  // Check if any devices are offline and trigger/stop blink1 accordingly
  const offlineDevices = devices.filter(d => d.status === 'offline');
  if (offlineDevices.length > 0) {
    console.log(`${offlineDevices.length} device(s) offline: ${offlineDevices.map(d => d.name).join(', ')}`);
    triggerBlink1Alert();
  } else {
    stopBlink1Alert();
  }
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
    id: String(Date.now()),
    name: req.body.name,
    ip: req.body.ip,
    status: 'unknown',
    category: req.body.category || 'physical-server',
    vendor: req.body.vendor || undefined,
    responseTime: 0,
    lastCheck: new Date().toISOString(),
    uptime: 0,
    location: req.body.location || undefined,
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
    device.vendor = req.body.vendor !== undefined ? req.body.vendor : device.vendor;
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

// Check blink1 server connection
async function checkBlink1Connection() {
  try {
    const response = await fetch(`${BLINK1_SERVER_URL}/blink1`, {
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

app.get('/api/health', async (req, res) => {
  const blink1Connected = await checkBlink1Connection();
  res.json({ status: 'ok', timestamp: new Date().toISOString(), blink1Enabled, blink1Connected });
});

// Blink1 toggle endpoint
app.post('/api/blink1/toggle', (req, res) => {
  const { enabled } = req.body;
  blink1Enabled = enabled !== undefined ? enabled : !blink1Enabled;
  
  // If disabling, stop any current blinking
  if (!blink1Enabled && isBlinking) {
    stopBlink1Alert();
  }
  
  console.log(`Blink1 alerts ${blink1Enabled ? 'enabled' : 'disabled'}`);
  res.json({ enabled: blink1Enabled });
});

app.get('/api/blink1/status', (req, res) => {
  res.json({ enabled: blink1Enabled, isBlinking });
});

// Test blink1 endpoint
app.post('/api/blink1/test', async (req, res) => {
  const success = await testBlink1();
  res.json({ success, message: success ? 'Test blink triggered on all devices' : 'Failed to trigger test blink' });
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
