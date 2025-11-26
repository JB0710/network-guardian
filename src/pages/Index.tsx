import { useEffect, useState } from "react";
import { DeviceCard } from "@/components/DeviceCard";
import { StatsCard } from "@/components/StatsCard";
import { Device, NetworkStats } from "@/types/device";
import { calculateStats, fetchDevices } from "@/utils/mockData";
import { Activity, Server, AlertTriangle, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const Index = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadDevices = async () => {
    setLoading(true);
    try {
      const data = await fetchDevices();
      setDevices(data);
      setStats(calculateStats(data));
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to load devices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/30 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" />
                Network Monitor
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
            <Button
              onClick={loadDevices}
              disabled={loading}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Devices"
              value={stats.totalDevices}
              icon={Server}
              description="Monitored endpoints"
            />
            <StatsCard
              title="Online"
              value={stats.onlineDevices}
              icon={Activity}
              description={`${((stats.onlineDevices / stats.totalDevices) * 100).toFixed(1)}% operational`}
              iconClassName="text-success"
            />
            <StatsCard
              title="Issues"
              value={stats.offlineDevices + stats.warningDevices}
              icon={AlertTriangle}
              description={`${stats.offlineDevices} offline, ${stats.warningDevices} warnings`}
              iconClassName="text-destructive"
            />
            <StatsCard
              title="Avg Response"
              value={`${stats.averageResponseTime}ms`}
              icon={Gauge}
              description="Network latency"
              iconClassName="text-primary"
            />
          </div>
        )}

        {/* Devices Grid */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Server className="h-5 w-5" />
            Monitored Devices
          </h2>
          
          {loading && devices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading devices...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => (
                <DeviceCard key={device.id} device={device} />
              ))}
            </div>
          )}

          {!loading && devices.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No devices found. Configure your monitoring endpoints.
            </div>
          )}
        </div>

        {/* API Integration Info */}
        <div className="mt-12 p-6 bg-muted/30 rounded-lg border border-border">
          <h3 className="font-semibold text-foreground mb-2">API Integration</h3>
          <p className="text-sm text-muted-foreground mb-3">
            This dashboard is ready to connect to your PHP/Python backend. Update the <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">fetchDevices()</code> function in <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">src/utils/mockData.ts</code> to point to your API endpoint.
          </p>
          <div className="bg-background p-4 rounded font-mono text-xs overflow-x-auto">
            <pre className="text-muted-foreground">
{`// Expected API Response Format:
[
  {
    "id": "string",
    "name": "string",
    "ip": "string",
    "status": "online" | "offline" | "warning",
    "responseTime": number, // milliseconds
    "lastCheck": "ISO timestamp",
    "uptime": number, // percentage
    "location": "string" (optional)
  }
]`}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
