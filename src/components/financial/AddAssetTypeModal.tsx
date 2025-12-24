import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddAssetTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const PRESET_COLORS = [
  'hsl(45, 93%, 47%)',   // Gold
  'hsl(217, 91%, 65%)',  // Blue
  'hsl(142, 71%, 45%)',  // Green
  'hsl(271, 91%, 65%)',  // Purple
  'hsl(24, 95%, 53%)',   // Orange
  'hsl(0, 84%, 60%)',    // Red
  'hsl(180, 70%, 45%)',  // Teal
  'hsl(330, 80%, 60%)',  // Pink
];

const AddAssetTypeModal = ({ open, onOpenChange, onSuccess }: AddAssetTypeModalProps) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the asset type",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("asset_types").insert({
        name: name.trim(),
        color,
      });

      if (error) throw error;

      toast({
        title: "Asset type added",
        description: `${name} has been added successfully`,
      });

      setName("");
      setColor(PRESET_COLORS[0]);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error adding asset type",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Asset Type</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Asset Type Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Real Estate, NFTs, Gold"
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    color === presetColor ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: presetColor }}
                  onClick={() => setColor(presetColor)}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Asset Type"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAssetTypeModal;
