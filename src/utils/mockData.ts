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

// Fetch devices from backend API with fallback to JSON file
export const fetchDevices = async (): Promise<Device[]> => {
  // Try backend API first
  try {
    const apiUrl = import.meta.env.VITE_API_URL;
    
    // Only try API if VITE_API_URL is explicitly set
    if (apiUrl) {
      const response = await fetch(`${apiUrl}/api/devices`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch devices: ${response.statusText}`);
      }
      
      const devices = await response.json();
      console.log('Loaded devices from backend API');
      return devices;
    }
  } catch (error) {
    console.warn('Backend API not available, falling back to devices.json:', error);
  }
  
  // Fallback to JSON file
  try {
    const response = await fetch('/devices.json');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch devices.json: ${response.statusText}`);
    }
    
    const devices = await response.json();
    console.log('Loaded devices from devices.json');
    return devices;
  } catch (error) {
    console.error('Error loading devices from JSON file:', error);
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

// Add a new device
export const addDevice = async (deviceData: { name: string; ip: string; category: string; location?: string }): Promise<Device> => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deviceData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add device: ${response.statusText}`);
    }
    
    const device = await response.json();
    return device;
  } catch (error) {
    console.error('Error adding device:', error);
    throw error;
  }
};

// Update a device
export const updateDevice = async (id: string, deviceData: { name: string; ip: string; category: string; location?: string }): Promise<Device> => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/devices/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deviceData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update device: ${response.statusText}`);
    }
    
    const device = await response.json();
    return device;
  } catch (error) {
    console.error('Error updating device:', error);
    throw error;
  }
};

// Delete a device
export const deleteDevice = async (id: string): Promise<void> => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/devices/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete device: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting device:', error);
    throw error;
  }
};
