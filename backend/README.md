# Network Monitor Backend

This is a Node.js backend service that pings network devices and monitors their status in real-time.

## Features

- **Real Ping Monitoring**: Uses ICMP ping to check device availability
- **Automatic Scheduling**: Pings devices every 30 seconds
- **Response Time Tracking**: Measures and stores ping response times
- **Uptime Calculation**: Tracks device uptime percentage based on successful pings
- **REST API**: Provides endpoints for device management and status retrieval

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

## Running the Backend

### Development Mode (with auto-restart):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:3001` by default.

## API Endpoints

### Get All Devices
```
GET /api/devices
```
Returns all monitored devices with their current status.

### Get Single Device
```
GET /api/devices/:id
```
Returns a specific device by ID.

### Add New Device
```
POST /api/devices
Content-Type: application/json

{
  "name": "New Server",
  "ip": "192.168.1.100",
  "location": "Data Center C"
}
```

### Delete Device
```
DELETE /api/devices/:id
```

### Trigger Manual Ping
```
POST /api/ping-now
```
Immediately pings all devices and returns updated status.

### Health Check
```
GET /api/health
```
Returns server health status.

## Configuration

Edit the device list in `server.js` to add or remove devices:

```javascript
let devices = [
  {
    id: "1",
    name: "Web Server",
    ip: "192.168.1.10",
    location: "Data Center A"
  },
  // Add more devices...
];
```

## Deployment on Ubuntu Server

1. Copy the backend folder to your Ubuntu server:
```bash
scp -r backend user@your-server:/path/to/deployment
```

2. SSH into your server and install Node.js (if not installed):
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. Navigate to the backend directory and install dependencies:
```bash
cd /path/to/deployment/backend
npm install
```

4. Run with PM2 for production (recommended):
```bash
sudo npm install -g pm2
pm2 start server.js --name network-monitor
pm2 save
pm2 startup
```

5. Configure firewall to allow traffic on port 3001:
```bash
sudo ufw allow 3001
```

## Environment Variables

- `PORT`: Server port (default: 3001)

Example:
```bash
PORT=8080 npm start
```

## Status Indicators

- **online**: Device is reachable and response time < 100ms
- **warning**: Device is reachable but response time ≥ 100ms
- **offline**: Device is not reachable

## Notes

- The ping functionality requires appropriate permissions. On Linux, you may need to run with sudo or configure ping capabilities.
- For production use, consider replacing the in-memory storage with a proper database (PostgreSQL, MongoDB, etc.)
- Adjust the cron schedule in `server.js` if you need different ping intervals
