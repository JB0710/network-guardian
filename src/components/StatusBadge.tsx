import { DeviceStatus } from "@/types/device";
import { Activity, AlertTriangle, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: DeviceStatus;
  showIcon?: boolean;
}

export const StatusBadge = ({ status, showIcon = true }: StatusBadgeProps) => {
  const config = {
    online: {
      label: "Online",
      className: "bg-success/10 text-success border-success/20",
      icon: Activity,
    },
    offline: {
      label: "Offline",
      className: "bg-destructive/10 text-destructive border-destructive/20",
      icon: XCircle,
    },
    warning: {
      label: "Warning",
      className: "bg-warning/10 text-warning border-warning/20",
      icon: AlertTriangle,
    },
  };

  const { label, className, icon: Icon } = config[status];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${className}`}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {label}
    </div>
  );
};
