import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AssetType } from "./types";

interface AddInvestmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  assetTypes: AssetType[];
}

const AddInvestmentModal = ({ open, onOpenChange, onSuccess, assetTypes }: AddInvestmentModalProps) => {
  const [name, setName] = useState("");
  const [assetTypeId, setAssetTypeId] = useState("");
  const [notes, setNotes] = useState("");
  const [tenureMonths, setTenureMonths] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [maturityDate, setMaturityDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check if the selected asset type is a fixed-income type (bonds, FDs, etc.)
  const selectedAssetType = assetTypes.find(at => at.id === assetTypeId);
  const isFixedIncome = selectedAssetType?.name.toLowerCase().includes("bond") || 
                        selectedAssetType?.name.toLowerCase().includes("fd") ||
                        selectedAssetType?.name.toLowerCase().includes("fixed deposit") ||
                        selectedAssetType?.name.toLowerCase().includes("deposit") ||
                        selectedAssetType?.name.toLowerCase().includes("debt");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your investment",
        variant: "destructive",
      });
      return;
    }

    if (!assetTypeId) {
      toast({
        title: "Asset type required",
        description: "Please select an asset type",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("investments").insert({
        name: name.trim(),
        asset_type_id: assetTypeId,
        notes: notes.trim() || null,
        tenure_months: tenureMonths ? parseInt(tenureMonths) : null,
        interest_rate: interestRate ? parseFloat(interestRate) : null,
        maturity_date: maturityDate ? format(maturityDate, "yyyy-MM-dd") : null,
      });

      if (error) throw error;

      toast({
        title: "Investment added",
        description: `${name} has been added to your portfolio`,
      });

      setName("");
      setAssetTypeId("");
      setNotes("");
      setTenureMonths("");
      setInterestRate("");
      setMaturityDate(undefined);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error adding investment",
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
          <DialogTitle>Add New Investment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Investment Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Bitcoin, Apple Stock, S&P 500 ETF"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assetType">Asset Type</Label>
            <Select value={assetTypeId} onValueChange={setAssetTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select asset type" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-[100]">
                {assetTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: type.color }}
                      />
                      <span>{type.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fixed Income Fields */}
          {isFixedIncome && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm font-medium text-muted-foreground">Fixed Income Details</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.01"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="e.g., 7.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenureMonths">Tenure (months)</Label>
                  <Input
                    id="tenureMonths"
                    type="number"
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(e.target.value)}
                    placeholder="e.g., 12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Maturity Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !maturityDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {maturityDate ? format(maturityDate, "PPP") : <span>Pick maturity date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={maturityDate}
                      onSelect={setMaturityDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this investment..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Investment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddInvestmentModal;
