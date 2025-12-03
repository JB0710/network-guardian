import { Device } from "@/types/device";

export const PRESET_CATEGORY_LABELS: Record<string, string> = {
  "firewall": "Firewalls",
  "switch": "Switches",
  "physical-server": "Physical Servers",
  "virtual-machine": "Virtual Machines",
  "database": "Databases",
  "dns-public": "DNS Servers (Public)",
  "dns-private": "DNS Servers (Private)",
};

export const getCategoryLabel = (category: string): string => {
  if (PRESET_CATEGORY_LABELS[category]) {
    return PRESET_CATEGORY_LABELS[category];
  }
  // Convert kebab-case to Title Case for custom categories
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getSingularCategoryLabel = (category: string): string => {
  const pluralLabel = getCategoryLabel(category);
  // Simple pluralization removal
  if (pluralLabel.endsWith('es') && !pluralLabel.endsWith('ases')) {
    return pluralLabel.slice(0, -2);
  }
  if (pluralLabel.endsWith('s')) {
    return pluralLabel.slice(0, -1);
  }
  return pluralLabel;
};

export const getUniqueCategories = (devices: Device[]): string[] => {
  const categories = new Set<string>();
  devices.forEach(device => {
    if (device.category) {
      categories.add(device.category);
    }
  });
  return Array.from(categories);
};
