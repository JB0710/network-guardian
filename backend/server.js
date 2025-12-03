const express = require('express');
const cors = require('cors');
const ping = require('ping');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3001;

// Blink1 server configuration - supports multiple servers (comma-separated)
// Example: BLINK1_SERVER_URLS=http://localhost:8934,http://localhost:8935,http://localhost:8936
const BLINK1_SERVER_URLS = (process.env.BLINK1_SERVER_URLS || process.env.BLINK1_SERVER_URL || 'http://localhost:8934')
  .split(',')
  .map(url => url.trim())
  .filter(url => url.length > 0);

let isBlinking = false;
let blink1Enabled = true; // Toggle for enabling/disabling blink1 alerts

// Blink1 pattern configuration (customizable via API)
let blink1Pattern = {
  colors: ['#ff0000', '#ffffff', '#0000ff'],
  time: 0.2,
  repeats: 8
};

console.log(`Blink1: Configured ${BLINK1_SERVER_URLS.length} server(s):`, BLINK1_SERVER_URLS);

// Build pattern query string from configuration
function buildPatternQuery() {
  const colorsParam = blink1Pattern.colors.map(c => encodeURIComponent(c)).join(',');
  return `/blink1/pattern?rgb=${colorsParam}&time=${blink1Pattern.time}&repeats=${blink1Pattern.repeats}`;
}

// Send request to all blink1 servers in parallel
async function sendToAllServers(endpoint) {
  const results = await Promise.allSettled(
    BLINK1_SERVER_URLS.map(async (serverUrl) => {
      try {
        const response = await fetch(`${serverUrl}${endpoint}`);
        return { serverUrl, ok: response.ok, status: response.status };
      } catch (error) {
        return { serverUrl, ok: false, error: error.message };
      }
    })
  );
  
  const successes = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
  const failures = results.filter(r => r.status === 'rejected' || !r.value.ok).length;
  
  return { successes, failures, total: BLINK1_SERVER_URLS.length, results };
}

// Trigger blink1 alert on all servers using configured pattern
async function triggerBlink1Alert() {
  if (isBlinking || !blink1Enabled) return; // Already blinking or disabled
  
  const patternQuery = buildPatternQuery();
  const { successes, failures, total } = await sendToAllServers(patternQuery);
  
  if (successes > 0) {
    isBlinking = true;
    console.log(`Blink1: Alert triggered on ${successes}/${total} devices`);
  }
  if (failures > 0) {
    console.error(`Blink1: Failed to trigger on ${failures}/${total} devices`);
  }
}

// Stop blink1 alert on all servers
async function stopBlink1Alert() {
  if (!isBlinking) return; // Not currently blinking
  
  const { successes, failures, total } = await sendToAllServers('/blink1/off');
  
  if (successes > 0) {
    isBlinking = false;
    console.log(`Blink1: Stopped alert on ${successes}/${total} devices`);
  }
  if (failures > 0) {
    console.error(`Blink1: Failed to stop on ${failures}/${total} devices`);
  }
}

// Test blink1 - blink red 3 times on all servers
async function testBlink1() {
  const { successes, failures, total } = await sendToAllServers('/blink1/blink?rgb=%23FF0000&time=0.3&repeats=3');
  
  if (successes > 0) {
    console.log(`Blink1: Test triggered on ${successes}/${total} devices`);
  }
  if (failures > 0) {
    console.error(`Blink1: Test failed on ${failures}/${total} devices`);
  }
  
  return successes > 0;
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

// Check blink1 server connections (all servers)
async function checkBlink1Connections() {
  const results = await Promise.allSettled(
    BLINK1_SERVER_URLS.map(async (serverUrl) => {
      try {
        const response = await fetch(`${serverUrl}/blink1`, {
          signal: AbortSignal.timeout(3000)
        });
        return { serverUrl, connected: response.ok };
      } catch {
        return { serverUrl, connected: false };
      }
    })
  );
  
  return results.map(r => r.status === 'fulfilled' ? r.value : { serverUrl: 'unknown', connected: false });
}

app.get('/api/health', async (req, res) => {
  const blink1Servers = await checkBlink1Connections();
  const blink1Connected = blink1Servers.some(s => s.connected);
  const connectedCount = blink1Servers.filter(s => s.connected).length;
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(), 
    blink1Enabled, 
    blink1Connected,
    blink1Servers,
    blink1ServerCount: BLINK1_SERVER_URLS.length,
    blink1ConnectedCount: connectedCount
  });
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
  res.json({ enabled: blink1Enabled, isBlinking, pattern: blink1Pattern });
});

// Get current pattern configuration
app.get('/api/blink1/pattern', (req, res) => {
  res.json({ pattern: blink1Pattern });
});

// Update pattern configuration
app.post('/api/blink1/pattern', (req, res) => {
  const { pattern } = req.body;
  if (pattern) {
    if (pattern.colors && Array.isArray(pattern.colors) && pattern.colors.length > 0) {
      blink1Pattern.colors = pattern.colors;
    }
    if (pattern.time && typeof pattern.time === 'number' && pattern.time > 0) {
      blink1Pattern.time = pattern.time;
    }
    if (pattern.repeats && typeof pattern.repeats === 'number' && pattern.repeats > 0) {
      blink1Pattern.repeats = pattern.repeats;
    }
    console.log('Blink1: Pattern updated -', blink1Pattern);
  }
  res.json({ pattern: blink1Pattern });
});

// Test pattern with custom config (without saving) - sends to all servers
app.post('/api/blink1/test-pattern', async (req, res) => {
  const { pattern } = req.body;
  const testPattern = pattern || blink1Pattern;
  const colorsParam = testPattern.colors.map(c => encodeURIComponent(c)).join(',');
  const endpoint = `/blink1/pattern?rgb=${colorsParam}&time=${testPattern.time}&repeats=${testPattern.repeats}`;
  
  const { successes, total } = await sendToAllServers(endpoint);
  
  if (successes > 0) {
    res.json({ success: true, message: `Pattern test triggered on ${successes}/${total} devices` });
  } else {
    res.json({ success: false, message: 'Failed to trigger pattern test on any device' });
  }
});

// Test blink1 endpoint
app.post('/api/blink1/test', async (req, res) => {
  const success = await testBlink1();
  res.json({ success, message: success ? 'Test blink triggered on all devices' : 'Failed to trigger test blink' });
});

// Turn off all blink1 devices endpoint - sends to all servers
app.post('/api/blink1/off', async (req, res) => {
  const { successes, total } = await sendToAllServers('/blink1/off');
  
  if (successes > 0) {
    isBlinking = false;
    console.log(`Blink1: Turned off ${successes}/${total} devices`);
    res.json({ success: true, message: `Turned off ${successes}/${total} Blink1 devices` });
  } else {
    res.json({ success: false, message: 'Failed to turn off any Blink1 devices' });
  }
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
