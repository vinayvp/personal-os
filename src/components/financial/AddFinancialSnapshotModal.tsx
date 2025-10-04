import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BreakdownItem {
  category: 'expense' | 'investment' | 'savings';
  name: string;
  amount: string;
}

interface AddFinancialSnapshotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddFinancialSnapshotModal = ({ open, onOpenChange, onSuccess }: AddFinancialSnapshotModalProps) => {
  const [date, setDate] = useState<Date>(new Date());
  const [salary, setSalary] = useState("");
  const [breakdownItems, setBreakdownItems] = useState<BreakdownItem[]>([
    { category: 'expense', name: '', amount: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddItem = () => {
    setBreakdownItems([...breakdownItems, { category: 'expense', name: '', amount: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    setBreakdownItems(breakdownItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof BreakdownItem, value: string) => {
    const newItems = [...breakdownItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setBreakdownItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!salary || parseFloat(salary) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid salary amount",
        variant: "destructive",
      });
      return;
    }

    const validItems = breakdownItems.filter(item => item.name && item.amount && parseFloat(item.amount) > 0);

    setLoading(true);
    try {
      const { data: snapshot, error: snapshotError } = await supabase
        .from('financial_snapshots')
        .insert({
          date: format(date, 'yyyy-MM-dd'),
          salary: parseFloat(salary),
        })
        .select()
        .single();

      if (snapshotError) throw snapshotError;

      if (validItems.length > 0) {
        const breakdownData = validItems.map(item => ({
          snapshot_id: snapshot.id,
          category: item.category,
          name: item.name,
          amount: parseFloat(item.amount),
        }));

        const { error: breakdownError } = await supabase
          .from('financial_breakdown')
          .insert(breakdownData);

        if (breakdownError) throw breakdownError;
      }

      toast({
        title: "Success",
        description: "Financial snapshot added successfully",
      });

      setSalary("");
      setBreakdownItems([{ category: 'expense', name: '', amount: '' }]);
      setDate(new Date());
      onSuccess();
      onOpenChange(false);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Financial Snapshot</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
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
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Salary</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                placeholder="Enter your salary"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Breakdown</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {breakdownItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3">
                    <Select
                      value={item.category}
                      onValueChange={(value) => handleItemChange(index, 'category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="investment">Investment</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-5">
                    <Input
                      placeholder="Name"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                      disabled={breakdownItems.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Snapshot"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFinancialSnapshotModal;
