import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { financeDb } from "@/integrations/supabase/financeClient";
import { useToast } from "@/hooks/use-toast";
import { Investment } from "./types";

interface AddSipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  investments: Investment[];
}

const AddSipModal = ({ open, onOpenChange, onSuccess, investments }: AddSipModalProps) => {
  const [investmentId, setInvestmentId] = useState("");
  const [amount, setAmount] = useState("");
  const [sipDay, setSipDay] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Only show MF investments
  const mfInvestments = investments.filter((inv) => {
    const assetTypeName = (inv as any).asset_types?.name || (inv as any).asset_type?.name;
    return assetTypeName?.toLowerCase() === "Mutual Funds".toLowerCase();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!investmentId || !amount || !sipDay) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }

    const day = parseInt(sipDay);
    if (day < 1 || day > 28) {
      toast({ title: "SIP day must be between 1 and 28", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await financeDb.from("sip_configs").insert({
        investment_id: investmentId,
        amount: parseFloat(amount),
        sip_day: day,
      });

      if (error) throw error;

      toast({ title: "SIP configured", description: "SIP will auto-record transactions on the specified day." });
      setInvestmentId("");
      setAmount("");
      setSipDay("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure SIP</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Mutual Fund</Label>
            <Select value={investmentId} onValueChange={setInvestmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select fund" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-[100]">
                {mfInvestments.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>SIP Amount (₹)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 5000"
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label>SIP Day of Month (1–28)</Label>
            <Input
              type="number"
              value={sipDay}
              onChange={(e) => setSipDay(e.target.value)}
              placeholder="e.g., 5"
              min="1"
              max="28"
            />
            <p className="text-xs text-muted-foreground">
              A transaction will be auto-recorded on this day each month
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Add SIP"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSipModal;
