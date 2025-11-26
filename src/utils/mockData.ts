import { Device, NetworkStats } from "@/types/device";

// Mock data - replace with actual API calls to your PHP/Python backend
export const mockDevices: Device[] = [
  {
    id: "1",
    name: "Web Server",
    ip: "192.168.1.10",
    status: "online",
    responseTime: 12,
    lastCheck: new Date().toISOString(),
    uptime: 99.98,
    location: "Data Center A",
  },
  {
    id: "2",
    name: "Database Server",
    ip: "192.168.1.20",
    status: "online",
    responseTime: 8,
    lastCheck: new Date().toISOString(),
    uptime: 99.95,
    location: "Data Center A",
  },
  {
    id: "3",
    name: "Mail Server",
    ip: "192.168.1.30",
    status: "warning",
    responseTime: 156,
    lastCheck: new Date().toISOString(),
    uptime: 98.45,
    location: "Data Center B",
  },
  {
    id: "4",
    name: "File Server",
    ip: "192.168.1.40",
    status: "offline",
    lastCheck: new Date(Date.now() - 300000).toISOString(),
    uptime: 97.23,
    location: "Data Center A",
  },
  {
    id: "5",
    name: "Backup Server",
    ip: "192.168.1.50",
    status: "online",
    responseTime: 15,
    lastCheck: new Date().toISOString(),
    uptime: 99.87,
    location: "Data Center B",
  },
  {
    id: "6",
    name: "Load Balancer",
    ip: "192.168.1.60",
    status: "online",
    responseTime: 5,
    lastCheck: new Date().toISOString(),
    uptime: 99.99,
    location: "Data Center A",
  },
];

export const calculateStats = (devices: Device[]): NetworkStats => {
  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.status === "online").length;
  const offlineDevices = devices.filter((d) => d.status === "offline").length;
  const warningDevices = devices.filter((d) => d.status === "warning").length;

  const responseTimes = devices
    .filter((d) => d.responseTime !== undefined)
    .map((d) => d.responseTime!);

  const averageResponseTime =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

  return {
    totalDevices,
    onlineDevices,
    offlineDevices,
    warningDevices,
    averageResponseTime,
  };
};

// Example API integration function - replace with your actual endpoint
export const fetchDevices = async (): Promise<Device[]> => {
  // Replace with: const response = await fetch('http://your-backend-api/devices');
  // return await response.json();
  
  // For now, return mock data
  return Promise.resolve(mockDevices);
};
