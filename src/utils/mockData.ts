import { Device, NetworkStats } from "@/types/device";

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

// Fetch devices from backend API
export const fetchDevices = async (): Promise<Device[]> => {
  try {
    // Use environment variable or default to localhost for development
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/devices`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch devices: ${response.statusText}`);
    }
    
    const devices = await response.json();
    return devices;
  } catch (error) {
    console.error('Error loading devices from backend:', error);
    throw error;
  }
};

// Trigger manual ping
export const triggerPing = async (): Promise<Device[]> => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/ping-now`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to trigger ping: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.devices;
  } catch (error) {
    console.error('Error triggering ping:', error);
    throw error;
  }
};
