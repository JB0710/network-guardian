import { useEffect, useState, useMemo } from "react";
import { DeviceCard } from "@/components/DeviceCard";
import { StatsCard } from "@/components/StatsCard";
import { DeviceManagement } from "@/components/DeviceManagement";
import { Device, NetworkStats } from "@/types/device";
import { calculateStats, fetchDevices } from "@/utils/mockData";
import { getCategoryLabel, getUniqueCategories } from "@/utils/categoryUtils";
import { Activity, Server, AlertTriangle, Gauge, Wifi, WifiOff, LayoutGrid, List, Globe, Lock, Lightbulb, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const Index = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [blink1Connected, setBlink1Connected] = useState<boolean | null>(null);
  const [isCompactView, setIsCompactView] = useState(false);
  const [blink1Enabled, setBlink1Enabled] = useState(true);

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

  const checkBlink1Direct = async () => {
    const blink1Url = import.meta.env.VITE_BLINK1_SERVER_URL;
    if (!blink1Url) return;
    
    try {
      const response = await fetch(`${blink1Url}/blink1`, { 
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      if (response.ok) {
        setBlink1Connected(true);
      } else {
        setBlink1Connected(false);
      }
    } catch {
      setBlink1Connected(false);
    }
  };

  const checkApiConnection = async () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      setApiConnected(false);
      // Try direct Blink1 check when no backend
      await checkBlink1Direct();
      return;
    }
    
    try {
      const response = await fetch(`${apiUrl}/api/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      if (response.ok) {
        setApiConnected(true);
        const data = await response.json();
        if (data.blink1Enabled !== undefined) {
          setBlink1Enabled(data.blink1Enabled);
        }
        if (data.blink1Connected !== undefined) {
          setBlink1Connected(data.blink1Connected);
        }
      } else {
        setApiConnected(false);
        // Try direct Blink1 check when backend unavailable
        await checkBlink1Direct();
      }
    } catch {
      setApiConnected(false);
      // Try direct Blink1 check when backend unavailable
      await checkBlink1Direct();
    }
  };

  const toggleBlink1 = async () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl || !apiConnected) return;
    
    try {
      const response = await fetch(`${apiUrl}/api/blink1/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !blink1Enabled })
      });
      if (response.ok) {
        const data = await response.json();
        setBlink1Enabled(data.enabled);
        toast({
          title: data.enabled ? "Blink1 Alerts Enabled" : "Blink1 Alerts Disabled",
          description: data.enabled 
            ? "You will receive visual alerts when devices go offline."
            : "Visual alerts have been turned off.",
        });
      }
    } catch (error) {
      console.error("Failed to toggle blink1:", error);
    }
  };

  const testBlink1 = async () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl || !apiConnected) return;
    
    try {
      const response = await fetch(`${apiUrl}/api/blink1/test`, {
        method: 'POST'
      });
      if (response.ok) {
        toast({
          title: "Blink1 Test",
          description: "Test blink triggered on all devices.",
        });
      } else {
        toast({
          title: "Blink1 Test Failed",
          description: "Could not trigger test blink.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Failed to test blink1:", error);
      toast({
        title: "Blink1 Test Failed",
        description: "Could not connect to blink1 server.",
        variant: "destructive"
      });
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
              {apiConnected && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-card/50">
                  <Lightbulb className={`h-4 w-4 ${blink1Enabled ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                  <Label htmlFor="blink1-toggle" className="text-sm cursor-pointer">
                    Blink1
                  </Label>
                  <Switch
                    id="blink1-toggle"
                    checked={blink1Enabled}
                    onCheckedChange={toggleBlink1}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={testBlink1}
                    className="h-7 px-2 text-xs"
                  >
                    Test
                  </Button>
                </div>
              )}
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant={!apiConnected ? "secondary" : blink1Connected ? "default" : "destructive"}
                      className="gap-1.5 cursor-help"
                    >
                      <Lightbulb className="h-3 w-3" />
                      {!apiConnected ? "Blink1 Unavailable" : blink1Connected ? "Blink1 Connected" : "Blink1 Disconnected"}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">Blink1 LED Alert Server</p>
                    <p className="text-xs text-muted-foreground">Visual alerts when devices go offline</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-3">
                    <h4 className="font-medium">Blink1 API Endpoints</h4>
                    <div className="text-xs space-y-2 font-mono">
                      <div>
                        <span className="text-primary">/blink1</span>
                        <p className="text-muted-foreground font-sans">Status info & connected devices</p>
                      </div>
                      <div>
                        <span className="text-primary">/blink1/fadeToRGB?rgb=#ff0000</span>
                        <p className="text-muted-foreground font-sans">Fade to color</p>
                      </div>
                      <div>
                        <span className="text-primary">/blink1/blink?rgb=#ff0000&repeats=3</span>
                        <p className="text-muted-foreground font-sans">Blink a color</p>
                      </div>
                      <div>
                        <span className="text-primary">/blink1/on</span> | <span className="text-primary">/blink1/off</span>
                        <p className="text-muted-foreground font-sans">Turn on/off</p>
                      </div>
                      <div>
                        <span className="text-primary">/blink1/red</span> | <span className="text-primary">/blink1/green</span> | <span className="text-primary">/blink1/blue</span>
                        <p className="text-muted-foreground font-sans">Quick colors</p>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
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
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="manage">Manage Devices</TabsTrigger>
            </TabsList>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCompactView(!isCompactView)}
              className="gap-2"
            >
              {isCompactView ? (
                <>
                  <LayoutGrid className="h-4 w-4" />
                  Grid View
                </>
              ) : (
                <>
                  <List className="h-4 w-4" />
                  Compact View
                </>
              )}
            </Button>
          </div>

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
            ) : isCompactView ? (
              <>
                {getUniqueCategories(devices).map((category) => {
                  const categoryDevices = devices.filter(d => d.category === category);
                  if (categoryDevices.length === 0) return null;

                  const getCategoryIcon = (cat: string) => {
                    if (cat === 'dns-public') return <Globe className="h-4 w-4 text-blue-500" />;
                    if (cat === 'dns-private') return <Lock className="h-4 w-4 text-orange-500" />;
                    return <Server className="h-4 w-4" />;
                  };

                  const isDnsCategory = category === 'dns-public' || category === 'dns-private';

                  return (
                    <div key={category} className="mb-6">
                      <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                        {getCategoryIcon(category)}
                        {getCategoryLabel(category)}
                        {isDnsCategory && (
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                          </span>
                        )}
                      </h2>
                      <div className="rounded-lg border border-border bg-card">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>IP Address</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Response</TableHead>
                              <TableHead>Uptime</TableHead>
                              <TableHead>Location</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {categoryDevices.map((device) => (
                              <TableRow key={device.id}>
                                <TableCell className="font-medium">{device.name}</TableCell>
                                <TableCell className="font-mono text-sm">{device.ip}</TableCell>
                                <TableCell>
                                  <StatusBadge status={device.status} />
                                </TableCell>
                                <TableCell>
                                  {device.responseTime !== undefined && device.status === "online" ? (
                                    <span className="font-mono text-sm">{device.responseTime}ms</span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {device.uptime !== undefined ? (
                                    <span className="font-mono text-sm">{device.uptime.toFixed(2)}%</span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{device.location || "-"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  );
                })}
                {/* Uncategorized devices */}
                {(() => {
                  const uncategorized = devices.filter(d => !d.category);
                  if (uncategorized.length === 0) return null;
                  return (
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        Uncategorized
                      </h2>
                      <div className="rounded-lg border border-border bg-card">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>IP Address</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Response</TableHead>
                              <TableHead>Uptime</TableHead>
                              <TableHead>Location</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {uncategorized.map((device) => (
                              <TableRow key={device.id}>
                                <TableCell className="font-medium">{device.name}</TableCell>
                                <TableCell className="font-mono text-sm">{device.ip}</TableCell>
                                <TableCell>
                                  <StatusBadge status={device.status} />
                                </TableCell>
                                <TableCell>
                                  {device.responseTime !== undefined && device.status === "online" ? (
                                    <span className="font-mono text-sm">{device.responseTime}ms</span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {device.uptime !== undefined ? (
                                    <span className="font-mono text-sm">{device.uptime.toFixed(2)}%</span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{device.location || "-"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
            <>
                {getUniqueCategories(devices).map((category) => {
                  const categoryDevices = devices.filter(d => d.category === category);
                  if (categoryDevices.length === 0) return null;

                  const getCategoryIcon = (cat: string) => {
                    if (cat === 'dns-public') return <Globe className="h-5 w-5 text-blue-500" />;
                    if (cat === 'dns-private') return <Lock className="h-5 w-5 text-orange-500" />;
                    return <Server className="h-5 w-5" />;
                  };

                  const isDnsCategory = category === 'dns-public' || category === 'dns-private';

                  return (
                    <div key={category}>
                      <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                        {getCategoryIcon(category)}
                        {getCategoryLabel(category)}
                        {isDnsCategory && (
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                          </span>
                        )}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {categoryDevices.map((device) => (
                          <DeviceCard key={device.id} device={device} />
                        ))}
                      </div>
                    </div>
                  );
                })}
                {/* Uncategorized devices */}
                {(() => {
                  const uncategorized = devices.filter(d => !d.category);
                  if (uncategorized.length === 0) return null;
                  return (
                    <div>
                      <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        Uncategorized
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {uncategorized.map((device) => (
                          <DeviceCard key={device.id} device={device} />
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </TabsContent>

          {/* Manage Devices Tab */}
          <TabsContent value="manage" className="space-y-6">
            <DeviceManagement devices={devices} onDevicesChange={loadDevices} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
