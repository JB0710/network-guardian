import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Plus, X, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

export interface Blink1Pattern {
  colors: string[];
  time: number;
  repeats: number;
}

interface Blink1ConfigProps {
  apiConnected: boolean;
  onPatternChange?: (pattern: Blink1Pattern) => void;
}

const DEFAULT_PATTERN: Blink1Pattern = {
  colors: ["#ff0000", "#ffffff", "#0000ff"],
  time: 0.2,
  repeats: 8,
};

export const Blink1Config = ({ apiConnected, onPatternChange }: Blink1ConfigProps) => {
  const [open, setOpen] = useState(false);
  const [pattern, setPattern] = useState<Blink1Pattern>(DEFAULT_PATTERN);
  const [loading, setLoading] = useState(false);

  // Load current pattern from backend
  useEffect(() => {
    const loadPattern = async () => {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl || !apiConnected) return;

      try {
        const response = await fetch(`${apiUrl}/api/blink1/pattern`);
        if (response.ok) {
          const data = await response.json();
          if (data.pattern) {
            setPattern(data.pattern);
          }
        }
      } catch (error) {
        console.error("Failed to load pattern:", error);
      }
    };

    if (open) {
      loadPattern();
    }
  }, [open, apiConnected]);

  const savePattern = async () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl || !apiConnected) return;

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/blink1/pattern`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern }),
      });

      if (response.ok) {
        toast({
          title: "Pattern Saved",
          description: "Blink1 alert pattern has been updated.",
        });
        onPatternChange?.(pattern);
        setOpen(false);
      } else {
        toast({
          title: "Save Failed",
          description: "Could not save pattern configuration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to save pattern:", error);
      toast({
        title: "Save Failed",
        description: "Could not connect to server.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testPattern = async () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl || !apiConnected) return;

    try {
      const response = await fetch(`${apiUrl}/api/blink1/test-pattern`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern }),
      });

      if (response.ok) {
        toast({
          title: "Testing Pattern",
          description: "Running pattern preview on Blink1 device.",
        });
      }
    } catch (error) {
      console.error("Failed to test pattern:", error);
    }
  };

  const addColor = () => {
    if (pattern.colors.length < 8) {
      setPattern({ ...pattern, colors: [...pattern.colors, "#ffffff"] });
    }
  };

  const removeColor = (index: number) => {
    if (pattern.colors.length > 1) {
      const newColors = pattern.colors.filter((_, i) => i !== index);
      setPattern({ ...pattern, colors: newColors });
    }
  };

  const updateColor = (index: number, color: string) => {
    const newColors = [...pattern.colors];
    newColors[index] = color;
    setPattern({ ...pattern, colors: newColors });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={!apiConnected}>
          <Settings className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Blink1 Alert Pattern</DialogTitle>
          <DialogDescription>
            Configure the colors, timing, and repeats for offline device alerts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Colors */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Colors (in sequence)</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addColor}
                disabled={pattern.colors.length >= 8}
                className="h-7 px-2 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {pattern.colors.map((color, index) => (
                <div key={index} className="flex items-center gap-1 bg-muted rounded-md p-1">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => updateColor(index, e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0"
                  />
                  <span className="text-xs font-mono px-1">{color}</span>
                  {pattern.colors.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeColor(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Timing */}
          <div className="space-y-2">
            <Label htmlFor="time">Time per color (seconds)</Label>
            <Input
              id="time"
              type="number"
              step="0.1"
              min="0.1"
              max="5"
              value={pattern.time}
              onChange={(e) => setPattern({ ...pattern, time: parseFloat(e.target.value) || 0.2 })}
              className="w-32"
            />
          </div>

          {/* Repeats */}
          <div className="space-y-2">
            <Label htmlFor="repeats">Repeats</Label>
            <Input
              id="repeats"
              type="number"
              min="1"
              max="100"
              value={pattern.repeats}
              onChange={(e) => setPattern({ ...pattern, repeats: parseInt(e.target.value) || 8 })}
              className="w-32"
            />
          </div>

          {/* Preview */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Preview:</span>
            <div className="flex gap-1">
              {pattern.colors.map((color, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border border-border"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground ml-auto">
              {pattern.time}s × {pattern.repeats} cycles
            </span>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={testPattern} disabled={!apiConnected}>
            <Play className="h-4 w-4 mr-2" />
            Test
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePattern} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
