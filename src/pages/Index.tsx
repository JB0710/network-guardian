import { useEffect, useState } from "react";
import { DeviceCard } from "@/components/DeviceCard";
import { StatsCard } from "@/components/StatsCard";
import { DeviceManagement } from "@/components/DeviceManagement";
import { Device, NetworkStats, DeviceCategory } from "@/types/device";
import { calculateStats, fetchDevices } from "@/utils/mockData";
import { Activity, Server, AlertTriangle, Gauge, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

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

  const checkApiConnection = async () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      setApiConnected(false);
      return;
    }
    
    try {
      const response = await fetch(`${apiUrl}/api/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      setApiConnected(response.ok);
    } catch {
      setApiConnected(false);
    }
  };

  useEffect(() => {
    loadDevices();
    checkApiConnection();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadDevices();
      checkApiConnection();
    }, 30000);
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
            <div className="flex items-center gap-3">
              {apiConnected !== null && (
                <Badge 
                  variant={apiConnected ? "default" : "secondary"}
                  className="gap-1.5"
                >
                  {apiConnected ? (
                    <>
                      <Wifi className="h-3 w-3" />
                      API Connected
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3" />
                      API Disconnected
                    </>
                  )}
                </Badge>
              )}
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

        {/* Tabs for Dashboard and Management */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="manage">Manage Devices</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {loading && devices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading devices...
              </div>
            ) : !loading && devices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No devices found. Add devices in the Manage Devices tab.
              </div>
            ) : (
              <>
                {(["firewall", "switch", "physical-server", "virtual-machine", "database"] as DeviceCategory[]).map((category) => {
                  const categoryDevices = devices.filter(d => d.category === category);
                  if (categoryDevices.length === 0) return null;

                  const categoryLabels: Record<DeviceCategory, string> = {
                    "firewall": "Firewalls",
                    "switch": "Switches",
                    "physical-server": "Physical Servers",
                    "virtual-machine": "Virtual Machines",
                    "database": "Databases"
                  };

                  return (
                    <div key={category}>
                      <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        {categoryLabels[category]}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {categoryDevices.map((device) => (
                          <DeviceCard key={device.id} device={device} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </TabsContent>

          {/* Manage Devices Tab */}
          <TabsContent value="manage">
            <DeviceManagement devices={devices} onDevicesChange={loadDevices} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
