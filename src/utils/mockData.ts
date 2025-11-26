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

// Fetch devices from static JSON file
export const fetchDevices = async (): Promise<Device[]> => {
  try {
    const response = await fetch('/devices.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch devices: ${response.statusText}`);
    }
    const devices = await response.json();
    return devices;
  } catch (error) {
    console.error('Error loading devices from static file:', error);
    throw error;
  }
};
