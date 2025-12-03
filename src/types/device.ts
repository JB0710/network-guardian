export type DeviceStatus = "online" | "offline" | "warning";

export type DeviceCategory = "firewall" | "switch" | "physical-server" | "virtual-machine" | "database" | "dns-public" | "dns-private" | string;

export type DeviceVendor = "vmware" | "windows" | "linux" | "docker" | "cisco" | "google" | "checkpoint" | "fortinet" | string;

export interface Device {
  id: string;
  name: string;
  ip: string;
  status: DeviceStatus;
  category: DeviceCategory;
  vendor?: DeviceVendor;
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
