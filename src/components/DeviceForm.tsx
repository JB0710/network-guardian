import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Device, DeviceCategory } from "@/types/device";

const deviceSchema = z.object({
  name: z.string().trim().min(1, "Device name is required").max(100),
  ip: z.string().trim().min(1, "IP address is required").regex(
    /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    "Invalid IP address or hostname"
  ),
  category: z.enum(["firewall", "switch", "physical-server", "virtual-machine", "database"] as const, {
    required_error: "Category is required",
  }),
  location: z.string().trim().max(200).optional(),
});

type DeviceFormData = z.infer<typeof deviceSchema>;

interface DeviceFormProps {
  device?: Device;
  onSubmit: (data: DeviceFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function DeviceForm({ device, onSubmit, onCancel, isSubmitting }: DeviceFormProps) {
  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      name: device?.name || "",
      ip: device?.ip || "",
      category: device?.category || "physical-server",
      location: device?.location || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Device Name</FormLabel>
              <FormControl>
                <Input placeholder="Web Server" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ip"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IP Address / Hostname</FormLabel>
              <FormControl>
                <Input placeholder="192.168.1.10 or example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="firewall">Firewall</SelectItem>
                  <SelectItem value="switch">Switch</SelectItem>
                  <SelectItem value="physical-server">Physical Server</SelectItem>
                  <SelectItem value="virtual-machine">Virtual Machine</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Data Center A" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : device ? "Update Device" : "Add Device"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
