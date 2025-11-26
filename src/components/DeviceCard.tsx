import { Device } from "@/types/device";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { Clock, Gauge, MapPin } from "lucide-react";

interface DeviceCardProps {
  device: Device;
}

export const DeviceCard = ({ device }: DeviceCardProps) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <Card className="p-4 hover:border-primary/50 transition-all duration-200 bg-card/50 backdrop-blur">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-base text-foreground mb-1">{device.name}</h3>
          <p className="text-sm text-muted-foreground font-mono">{device.ip}</p>
        </div>
        <StatusBadge status={device.status} showIcon={false} />
      </div>

      <div className="space-y-2 text-sm">
        {device.responseTime !== undefined && device.status === "online" && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Gauge className="h-4 w-4 text-primary" />
            <span className="font-mono">{device.responseTime}ms</span>
          </div>
        )}

        {device.location && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{device.location}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-xs">{formatTimestamp(device.lastCheck)}</span>
        </div>

        {device.uptime !== undefined && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-muted-foreground">Uptime</span>
              <span className="font-mono text-foreground">{device.uptime.toFixed(2)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-success transition-all duration-300"
                style={{ width: `${device.uptime}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
