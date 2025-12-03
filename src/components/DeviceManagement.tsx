import { useState, useEffect, useMemo, useRef } from "react";
import { Device } from "@/types/device";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Globe, Lock, Download, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeviceForm } from "@/components/DeviceForm";
import { StatusBadge } from "@/components/StatusBadge";
import { VendorLogo } from "@/components/VendorLogo";
import { Plus, Pencil, Trash2, Server } from "lucide-react";
import { addDevice, updateDevice, deleteDevice } from "@/utils/mockData";
import { useToast } from "@/hooks/use-toast";
import { getSingularCategoryLabel, getUniqueCategories } from "@/utils/categoryUtils";

interface DeviceManagementProps {
  devices: Device[];
  onDevicesChange: () => void;
}

export function DeviceManagement({ devices, onDevicesChange }: DeviceManagementProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [deleteDeviceId, setDeleteDeviceId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBackendAvailable, setIsBackendAvailable] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const customCategories = useMemo(() => getUniqueCategories(devices), [devices]);

  useEffect(() => {
    const checkBackend = async () => {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        setIsBackendAvailable(false);
        return;
      }
      
      try {
        const response = await fetch(`${apiUrl}/api/health`);
        setIsBackendAvailable(response.ok);
      } catch {
        setIsBackendAvailable(false);
      }
    };
    
    checkBackend();
  }, []);

  const handleAdd = async (data: { name: string; ip: string; category: string; vendor?: string; location?: string }) => {
    setIsSubmitting(true);
    try {
      await addDevice(data);
      toast({
        title: "Device added",
        description: "The device has been added successfully.",
      });
      setIsAddOpen(false);
      onDevicesChange();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add device. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: { name: string; ip: string; category: string; vendor?: string; location?: string }) => {
    if (!editDevice) return;
    setIsSubmitting(true);
    try {
      await updateDevice(editDevice.id, data);
      toast({
        title: "Device updated",
        description: "The device has been updated successfully.",
      });
      setEditDevice(null);
      onDevicesChange();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update device. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDeviceId) return;
    setIsSubmitting(true);
    try {
      await deleteDevice(deleteDeviceId);
      toast({
        title: "Device deleted",
        description: "The device has been removed successfully.",
      });
      setDeleteDeviceId(null);
      onDevicesChange();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete device. Make sure the backend is running.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    if (category === 'dns-public') return <Globe className="h-4 w-4 text-blue-500" />;
    if (category === 'dns-private') return <Lock className="h-4 w-4 text-orange-500" />;
    return <Server className="h-4 w-4 text-muted-foreground" />;
  };

  const handleExport = () => {
    if (devices.length === 0) {
      toast({
        title: "No devices to export",
        description: "Add some devices first before exporting.",
        variant: "destructive",
      });
      return;
    }

    const exportData = devices.map(device => ({
      id: device.id,
      name: device.name,
      ip: device.ip,
      status: device.status,
      category: device.category || "physical-server",
      vendor: device.vendor || "",
      responseTime: device.responseTime,
      lastCheck: device.lastCheck,
      uptime: device.uptime,
      location: device.location || "",
    }));
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'devices.json');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export successful",
      description: `Exported ${devices.length} devices to devices.json`,
    });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      const text = await file.text();
      const importedDevices = JSON.parse(text);
      
      if (!Array.isArray(importedDevices)) {
        throw new Error('Invalid format: Expected an array of devices');
      }

      let successCount = 0;
      let errorCount = 0;

      for (const device of importedDevices) {
        if (!device.name || !device.ip) {
          errorCount++;
          continue;
        }

        try {
          await addDevice({
            name: device.name,
            ip: device.ip,
            category: device.category || 'physical-server',
            vendor: device.vendor,
            location: device.location,
          });
          successCount++;
        } catch {
          errorCount++;
        }
      }

      toast({
        title: "Import completed",
        description: `Successfully imported ${successCount} devices${errorCount > 0 ? `, ${errorCount} failed` : ''}.`,
      });

      onDevicesChange();
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Invalid JSON file format.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      {!isBackendAvailable && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Backend Not Connected</AlertTitle>
          <AlertDescription>
            Device management requires a backend connection. Please set VITE_API_URL in your .env file and ensure the backend is running at that address.
          </AlertDescription>
        </Alert>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        accept=".json"
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Manage Devices</h2>
        <div className="flex gap-2">
          <Button 
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="gap-2"
            disabled={!isBackendAvailable || isImporting}
          >
            <Upload className="h-4 w-4" />
            {isImporting ? "Importing..." : "Import JSON"}
          </Button>
          <Button 
            onClick={handleExport}
            variant="outline"
            className="gap-2"
            disabled={devices.length === 0}
          >
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
          <Button 
            onClick={() => setIsAddOpen(true)} 
            className="gap-2"
            disabled={!isBackendAvailable}
          >
            <Plus className="h-4 w-4" />
            Add Device
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No devices configured. Add your first device to start monitoring.
                </TableCell>
              </TableRow>
            ) : (
              devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium">{device.name}</TableCell>
                  <TableCell>
                    {device.vendor ? (
                      <VendorLogo vendor={device.vendor} size={24} />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{device.ip}</TableCell>
                  <TableCell>
                    <StatusBadge status={device.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(device.category || '')}
                      <span>{device.category ? getSingularCategoryLabel(device.category) : 'Uncategorized'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{device.location || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditDevice(device)}
                        disabled={!isBackendAvailable}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDeviceId(device.id)}
                        disabled={!isBackendAvailable}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Device Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Device</DialogTitle>
            <DialogDescription>
              Add a new device to monitor. The system will automatically ping it every 30 seconds.
            </DialogDescription>
          </DialogHeader>
          <DeviceForm
            onSubmit={handleAdd}
            onCancel={() => setIsAddOpen(false)}
            isSubmitting={isSubmitting}
            customCategories={customCategories}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Device Dialog */}
      <Dialog open={!!editDevice} onOpenChange={(open) => !open && setEditDevice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>
              Update the device information. Changes will take effect immediately.
            </DialogDescription>
          </DialogHeader>
          {editDevice && (
            <DeviceForm
              device={editDevice}
              onSubmit={handleEdit}
              onCancel={() => setEditDevice(null)}
              isSubmitting={isSubmitting}
              customCategories={customCategories}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDeviceId} onOpenChange={(open) => !open && setDeleteDeviceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this device from monitoring. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
