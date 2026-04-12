import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { financeDb } from "@/integrations/supabase/financeClient";
import { InvestmentWithLatest } from "./types";
import { format } from "date-fns";

interface UpdateP2PModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investment: InvestmentWithLatest;
  onSuccess: () => void;
}

const UpdateP2PModal = ({ open, onOpenChange, investment, onSuccess }: UpdateP2PModalProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Valuation Fields (Blank by default so we can ignore them if untouched)
  const [principalOutstanding, setPrincipalOutstanding] = useState("");
  const [receivedAmount, setReceivedAmount] = useState(""); // Renamed from availableBalance
  const [bankBalance, setBankBalance] = useState("");

  // Stats Fields (Blank by default)
  const [activeLoans, setActiveLoans] = useState("");
  const [closedLoans, setClosedLoans] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const existingConfig = (investment.extra_configuration as any) || {};
      
      // 1. Check if we need to update the valuation
      const isUpdatingValuation = principalOutstanding !== "" || receivedAmount !== "" || bankBalance !== "";

      if (isUpdatingValuation) {
        const pOut = Number(principalOutstanding) || 0;
        const rAmt = Number(receivedAmount) || 0;
        const bBal = Number(bankBalance) || 0;
        
        const totalValue = pOut + bBal;
        const today = format(new Date(), 'yyyy-MM-dd');

        // Check if a valuation already exists for today
        const { data: existingVal } = await financeDb
          .from("investment_valuations")
          .select("id")
          .eq("investment_id", investment.id)
          .eq("valuation_date", today)
          .maybeSingle();

        if (existingVal) {
          // Update existing valuation
          const { error: valError } = await financeDb
            .from("investment_valuations")
            .update({
              current_value: totalValue,
              metadata: {
                principal_outstanding: pOut,
                received_amount: rAmt,
                p2p_bank_balance: bBal
              }
            })
            .eq("id", existingVal.id);
          if (valError) throw valError;
        } else {
          // Insert new valuation
          const { error: valError } = await financeDb
            .from("investment_valuations")
            .insert({
              investment_id: investment.id,
              valuation_date: today,
              current_value: totalValue,
              metadata: {
                principal_outstanding: pOut,
                received_amount: rAmt,
                p2p_bank_balance: bBal
              }
            });
          if (valError) throw valError;
        }
      }

      // 2. Update the JSON config (Preserve old values if input is blank)
      const newActive = activeLoans !== "" ? Number(activeLoans) : (existingConfig.active || 0);
      const newClosed = closedLoans !== "" ? Number(closedLoans) : (existingConfig.closed || 0);
      const total = newActive + newClosed;

      const newConfig = {
        ...existingConfig,
        loans: total,
        active: newActive,
        closed: newClosed,
      };

      const { error: invError } = await financeDb
        .from("investments")
        .update({ extra_configuration: newConfig })
        .eq("id", investment.id);

      if (invError) throw invError;

      toast({
        title: "P2P Portfolio Updated",
        description: isUpdatingValuation 
          ? "Valuation and loan stats updated successfully."
          : "Loan stats updated successfully.",
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error updating P2P",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Stats: {investment?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          
          {/* Valuation Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground border-b pb-1">1. Current Value (Optional)</h4>
            <p className="text-xs text-muted-foreground -mt-2">Leave blank to keep existing valuation.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Principal Outstanding</Label>
                <Input type="number" step="0.01" value={principalOutstanding} onChange={(e) => setPrincipalOutstanding(e.target.value)} placeholder="₹" />
              </div>
              <div className="space-y-2">
                <Label>Received Amount</Label>
                <Input type="number" step="0.01" value={receivedAmount} onChange={(e) => setReceivedAmount(e.target.value)} placeholder="₹" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>P2P Bank Account Balance</Label>
                <Input type="number" step="0.01" value={bankBalance} onChange={(e) => setBankBalance(e.target.value)} placeholder="₹" />
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground border-b pb-1">2. Loan Stats (Optional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Active Loans</Label>
                <Input type="number" value={activeLoans} onChange={(e) => setActiveLoans(e.target.value)} placeholder={`Current: ${(investment?.extra_configuration as any)?.active || 0}`} />
              </div>
              <div className="space-y-2">
                <Label>Closed Loans</Label>
                <Input type="number" value={closedLoans} onChange={(e) => setClosedLoans(e.target.value)} placeholder={`Current: ${(investment?.extra_configuration as any)?.closed || 0}`} />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="button" variant="outline" className="mr-2" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Updates"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateP2PModal;