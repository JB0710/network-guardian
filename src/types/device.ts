export type DeviceStatus = "online" | "offline" | "warning";

export interface Device {
  id: string;
  name: string;
  ip: string;
  status: DeviceStatus;
  responseTime?: number; // in ms
  lastCheck: string; // ISO timestamp
  uptime?: number; // percentage
  location?: string;
}

export interface NetworkStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  warningDevices: number;
  averageResponseTime: number;
}
