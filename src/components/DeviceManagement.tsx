import { useState } from "react";
import { Device } from "@/types/device";
import { Button } from "@/components/ui/button";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { addDevice, updateDevice, deleteDevice } from "@/utils/mockData";
import { useToast } from "@/hooks/use-toast";

interface DeviceManagementProps {
  devices: Device[];
  onDevicesChange: () => void;
}

export function DeviceManagement({ devices, onDevicesChange }: DeviceManagementProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [deleteDeviceId, setDeleteDeviceId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAdd = async (data: { name: string; ip: string; location?: string }) => {
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
        description: "Failed to add device. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: { name: string; ip: string; location?: string }) => {
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
        description: "Failed to update device. Please try again.",
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
        description: "Failed to delete device. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Manage Devices</h2>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Device
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No devices configured. Add your first device to start monitoring.
                </TableCell>
              </TableRow>
            ) : (
              devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium">{device.name}</TableCell>
                  <TableCell className="font-mono text-sm">{device.ip}</TableCell>
                  <TableCell>
                    <StatusBadge status={device.status} />
                  </TableCell>
                  <TableCell>{device.location || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditDevice(device)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDeviceId(device.id)}
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
