import { useState } from "react";
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
import { Device } from "@/types/device";
import { Plus } from "lucide-react";
import { VendorLogo, PRESET_VENDORS } from "./VendorLogo";

const PRESET_CATEGORIES = [
  { value: "firewall", label: "Firewall" },
  { value: "switch", label: "Switch" },
  { value: "physical-server", label: "Physical Server" },
  { value: "virtual-machine", label: "Virtual Machine" },
  { value: "database", label: "Database" },
  { value: "dns-public", label: "DNS Server (Public)" },
  { value: "dns-private", label: "DNS Server (Private)" },
];

const deviceSchema = z.object({
  name: z.string().trim().min(1, "Device name is required").max(100),
  ip: z.string().trim().min(1, "IP address is required").regex(
    /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    "Invalid IP address or hostname"
  ),
  category: z.string().min(1, "Category is required"),
  vendor: z.string().optional(),
  location: z.string().trim().max(200).optional(),
});

type DeviceFormData = z.infer<typeof deviceSchema>;

interface DeviceFormProps {
  device?: Device;
  onSubmit: (data: DeviceFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  customCategories?: string[];
}

export function DeviceForm({ device, onSubmit, onCancel, isSubmitting, customCategories = [] }: DeviceFormProps) {
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");

  const allCategories = [
    ...PRESET_CATEGORIES,
    ...customCategories
      .filter(c => !PRESET_CATEGORIES.some(p => p.value === c))
      .map(c => ({ value: c, label: c.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }))
  ];

  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      name: device?.name || "",
      ip: device?.ip || "",
      category: device?.category || "physical-server",
      vendor: device?.vendor || "",
      location: device?.location || "",
    },
  });

  const handleAddCustomCategory = () => {
    if (customCategoryInput.trim()) {
      const value = customCategoryInput.trim().toLowerCase().replace(/\s+/g, '-');
      form.setValue('category', value);
      setCustomCategoryInput("");
      setIsAddingCustom(false);
    }
  };

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
              {isAddingCustom ? (
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter custom category"
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomCategory())}
                  />
                  <Button type="button" size="sm" onClick={handleAddCustomCategory}>
                    Add
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setIsAddingCustom(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    size="icon" 
                    variant="outline"
                    onClick={() => setIsAddingCustom(true)}
                    title="Add custom category"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vendor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vendor/Brand (Optional)</FormLabel>
              <Select 
                onValueChange={(val) => field.onChange(val === "none" ? "" : val)} 
                value={field.value || "none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vendor">
                      {field.value ? (
                        <div className="flex items-center gap-2">
                          <VendorLogo vendor={field.value} size={18} />
                          <span>{PRESET_VENDORS.find(v => v.value === field.value)?.label || field.value}</span>
                        </div>
                      ) : (
                        "None"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {PRESET_VENDORS.map((vendor) => (
                    <SelectItem key={vendor.value} value={vendor.value}>
                      <div className="flex items-center gap-2">
                        <VendorLogo vendor={vendor.value} size={18} />
                        <span>{vendor.label}</span>
                      </div>
                    </SelectItem>
                  ))}
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

export { PRESET_CATEGORIES };
