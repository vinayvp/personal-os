import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Investment, AssetType } from "./types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  investments: Investment[];
  assetTypes?: AssetType[];
}

const AddTransactionModal = ({ open, onOpenChange, onSuccess, investments, assetTypes = [] }: AddTransactionModalProps) => {
  const [investmentId, setInvestmentId] = useState("");
  const [transactionType, setTransactionType] = useState<"buy" | "withdraw" | "fees">("buy");
  const [date, setDate] = useState<Date>(new Date());
  const [amount, setAmount] = useState("");
  const [tenureMonths, setTenureMonths] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [maturityDate, setMaturityDate] = useState<Date | undefined>(undefined);
  const [showFixedIncomeFields, setShowFixedIncomeFields] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [maturityCalendarOpen, setMaturityCalendarOpen] = useState(false);
  const { toast } = useToast();

  // Check if the selected investment is a fixed-income type
  const selectedInvestment = investments.find((inv) => inv.id === investmentId);
  const selectedAssetType = assetTypes.find(at => at.id === selectedInvestment?.asset_type_id);
  const isFixedIncome = selectedAssetType?.name.toLowerCase().includes("bond") || 
                        selectedAssetType?.name.toLowerCase().includes("fd") ||
                        selectedAssetType?.name.toLowerCase().includes("fixed deposit") ||
                        selectedAssetType?.name.toLowerCase().includes("deposit") ||
                        selectedAssetType?.name.toLowerCase().includes("debt");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!investmentId || !amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Buy is positive, withdraw and fees are negative
      const amountValue = parseFloat(amount);
      const finalAmount = transactionType === "buy" ? amountValue : -amountValue;
      
      const { error } = await supabase.from("investment_transactions").insert({
        investment_id: investmentId,
        transaction_date: format(date, "yyyy-MM-dd"),
        amount_invested: finalAmount,
        current_value: 0, // Will be updated via Record Value
        tenure_months: tenureMonths ? parseInt(tenureMonths) : null,
        interest_rate: interestRate ? parseFloat(interestRate) : null,
        maturity_date: maturityDate ? format(maturityDate, "yyyy-MM-dd") : null,
      });

      if (error) throw error;

      const formattedAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(amountValue);
      
      const transactionLabel = transactionType === "buy" ? "Invested" : transactionType === "withdraw" ? "Withdrew" : "Fees paid";
      
      toast({
        title: "Transaction Recorded",
        description: `${transactionLabel} ${formattedAmount} in ${selectedInvestment?.name || "investment"} on ${format(date, "PPP")}`,
      });

      setInvestmentId("");
      setTransactionType("buy");
      setDate(new Date());
      setAmount("");
      setTenureMonths("");
      setInterestRate("");
      setMaturityDate(undefined);
      setShowFixedIncomeFields(false);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
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
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="investment">Investment</Label>
            <Select value={investmentId} onValueChange={setInvestmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an investment" />
              </SelectTrigger>
              <SelectContent>
                {investments.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <Select value={transactionType} onValueChange={(v) => setTransactionType(v as "buy" | "withdraw" | "fees")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Buy / Invest</SelectItem>
                <SelectItem value="withdraw">Withdraw / Sell</SelectItem>
                <SelectItem value="fees">Fees / Charges</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto min-w-[280px] p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (d) {
                      setDate(d);
                      setCalendarOpen(false);
                    }
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100000"
            />
          </div>

          {/* Fixed Income Fields - Collapsible */}
          {isFixedIncome && (
            <Collapsible open={showFixedIncomeFields} onOpenChange={setShowFixedIncomeFields}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                  <span className="text-sm text-muted-foreground">Fixed Income Details (Optional)</span>
                  {showFixedIncomeFields ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-4">
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
                    <Popover open={maturityCalendarOpen} onOpenChange={setMaturityCalendarOpen}>
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
                      <PopoverContent className="w-auto min-w-[280px] p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={maturityDate}
                          onSelect={(d) => {
                            setMaturityDate(d);
                            setMaturityCalendarOpen(false);
                          }}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Add Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionModal;
