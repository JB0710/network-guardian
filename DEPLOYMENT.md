# Deployment Guide

This guide explains how to deploy both the frontend and backend of the Network Monitor application on your Ubuntu server.

## Architecture

- **Frontend**: React app (static files served via nginx/apache)
- **Backend**: Node.js Express server running on port 3001
- Both services run on the same Ubuntu server

## Prerequisites

- Ubuntu server with sudo access
- Node.js 18+ installed
- nginx or apache for serving frontend
- Domain or IP address for your server

## Backend Deployment

### 1. Copy Backend Files

```bash
# Copy the backend folder to your server
scp -r backend user@your-server:/var/www/network-monitor-backend
```

### 2. Install Dependencies

```bash
ssh user@your-server
cd /var/www/network-monitor-backend
npm install --production
```

### 3. Configure as System Service

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/network-monitor.service
```

Add the following content:

```ini
[Unit]
Description=Network Monitor Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/network-monitor-backend
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=PORT=3001
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable network-monitor
sudo systemctl start network-monitor
sudo systemctl status network-monitor
```

### 4. Configure Firewall

```bash
sudo ufw allow 3001/tcp
```

## Frontend Deployment

### 1. Build the Frontend

On your local machine:

```bash
npm run build
```

### 2. Configure API URL

Create a `.env.production` file before building:

```bash
# Use your server's domain or IP
VITE_API_URL=http://your-server-ip:3001
# Or with domain
VITE_API_URL=https://api.yourdomain.com
```

Then rebuild:

```bash
npm run build
```

### 3. Copy Build Files to Server

```bash
scp -r dist/* user@your-server:/var/www/html/
```

### 4. Configure nginx

```bash
sudo nano /etc/nginx/sites-available/network-monitor
```

Add:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/network-monitor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Production Considerations

### 1. Use PM2 for Backend (Alternative)

```bash
sudo npm install -g pm2
cd /var/www/network-monitor-backend
pm2 start server.js --name network-monitor
pm2 save
pm2 startup
```

### 2. SSL Certificate (Recommended)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 3. Environment Variables

For production, create `.env` file in backend directory:

```bash
PORT=3001
NODE_ENV=production
```

### 4. Database Integration (Optional)

Replace in-memory storage with a proper database:

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Then modify server.js to use database instead of in-memory array
```

## Blink1 Server Setup (Optional)

If you want visual LED alerts when devices go offline, set up the blink1-server service.

### 1. Install blink1-server

```bash
sudo npm install -g node-blink1-server
```

### 2. Create Systemd Service

```bash
sudo nano /etc/systemd/system/blink1-server.service
```

Add the following content:

```ini
[Unit]
Description=Blink1 LED Server
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/npx blink1-server
Restart=on-failure
Environment=HOST=0.0.0.0
Environment=PORT=8934

[Install]
WantedBy=multi-user.target
```

### 3. Enable and Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable blink1-server
sudo systemctl start blink1-server
sudo systemctl status blink1-server
```

### 4. Configure Firewall (if needed)

```bash
sudo ufw allow 8934/tcp
```

### 5. Configure Backend

Update the backend `.env` file with the blink1-server URL:

```bash
BLINK1_SERVER_URL=http://localhost:8934
# Or if running on a different machine:
# BLINK1_SERVER_URL=http://192.168.1.100:8934
```

### 6. Verify Connection

```bash
curl http://localhost:8934/blink1
```

## Monitoring

### Check Backend Status

```bash
sudo systemctl status network-monitor
# Or with PM2
pm2 status
pm2 logs network-monitor
```

### Check Logs

```bash
# Systemd logs
sudo journalctl -u network-monitor -f

# PM2 logs
pm2 logs network-monitor
```

### Check Frontend

Visit your domain or IP address in browser.

## Updating

### Backend Updates

```bash
cd /var/www/network-monitor-backend
git pull  # if using git
# or copy new files with scp
sudo systemctl restart network-monitor
```

### Frontend Updates

```bash
# Build locally
npm run build

# Copy to server
scp -r dist/* user@your-server:/var/www/html/
```

## Troubleshooting

### Backend Not Starting

```bash
# Check logs
sudo journalctl -u network-monitor -n 50

# Check port conflicts
sudo lsof -i :3001

# Test manually
cd /var/www/network-monitor-backend
node server.js
```

### CORS Issues

Ensure backend allows frontend origin in `server.js`:

```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com'
}));
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/network-monitor-backend
sudo chown -R www-data:www-data /var/www/html

# Fix ping permissions
sudo setcap cap_net_raw+ep $(which node)
```
