import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CalendarIcon, TrendingUp } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, eachYearOfInterval, isWithinInterval, isSameDay, isSameWeek, isSameMonth, isSameYear } from "date-fns";
import { cn } from "@/lib/utils";
import { AssetType, Investment, InvestmentTransaction, InvestmentValuation } from "./types";

type Granularity = "daily" | "weekly" | "monthly" | "yearly";

interface HistoricalChartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetType: AssetType;
  investments: Investment[];
  transactions: InvestmentTransaction[];
  valuations: InvestmentValuation[];
}

const HistoricalChartModal = ({ open, onOpenChange, assetType, investments, transactions, valuations }: HistoricalChartModalProps) => {
  const [granularity, setGranularity] = useState<Granularity>("monthly");
  const [fromDate, setFromDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date;
  });
  const [toDate, setToDate] = useState<Date | undefined>(new Date());

  const assetInvestments = investments.filter((inv) => inv.asset_type_id === assetType.id);
  const investmentIds = new Set(assetInvestments.map((inv) => inv.id));
  
  const assetTransactions = transactions.filter((t) => investmentIds.has(t.investment_id));
  const assetValuations = valuations.filter((v) => investmentIds.has(v.investment_id));

  const chartData = useMemo(() => {
    if ((assetTransactions.length === 0 && assetValuations.length === 0) || !fromDate || !toDate) return [];

    const sortedTransactions = [...assetTransactions].sort(
      (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );

    // Build cumulative invested
    let cumulativeInvested = 0;
    const dateMap = new Map<string, { invested: number; current: number }>();

    // Pre-calculate cumulative invested before fromDate
    sortedTransactions.forEach((t) => {
      const transactionDate = new Date(t.transaction_date);
      if (transactionDate < fromDate) {
        if (Number(t.amount_invested) !== 0) {
          cumulativeInvested += Number(t.amount_invested);
        }
      }
    });

    // Process transactions in range
    const filteredTransactions = sortedTransactions.filter((t) => {
      const date = new Date(t.transaction_date);
      return isWithinInterval(date, { start: fromDate, end: toDate });
    });

    filteredTransactions.forEach((t) => {
      const amountInvested = Number(t.amount_invested);
      if (amountInvested !== 0) {
        cumulativeInvested += amountInvested;
      }
      dateMap.set(t.transaction_date, {
        invested: cumulativeInvested,
        current: dateMap.get(t.transaction_date)?.current || 0,
      });
    });

    // Process valuations in range
    const filteredValuations = assetValuations.filter((v) => {
      const date = new Date(v.valuation_date);
      return isWithinInterval(date, { start: fromDate, end: toDate });
    });

    const valByDate = new Map<string, number>();
    filteredValuations.forEach((v) => {
      valByDate.set(v.valuation_date, (valByDate.get(v.valuation_date) || 0) + Number(v.current_value));
    });

    valByDate.forEach((currentVal, date) => {
      const existing = dateMap.get(date);
      if (existing) {
        existing.current = currentVal;
      } else {
        let lastInvested = cumulativeInvested;
        for (const [d, v] of dateMap.entries()) {
          if (d <= date) lastInvested = v.invested;
        }
        dateMap.set(date, { invested: lastInvested, current: currentVal });
      }
    });

    // Aggregate based on granularity
    const aggregatedData: { date: string; dateFormatted: string; invested: number; current: number }[] = [];

    const getIntervalEnd = (date: Date): Date => {
      switch (granularity) {
        case "daily": return date;
        case "weekly": return endOfWeek(date, { weekStartsOn: 1 });
        case "monthly": return endOfMonth(date);
        case "yearly": return endOfYear(date);
      }
    };

    const formatDate = (date: Date): string => {
      switch (granularity) {
        case "daily": return format(date, "MMM dd");
        case "weekly": return format(date, "MMM dd");
        case "monthly": return format(date, "MMM yyyy");
        case "yearly": return format(date, "yyyy");
      }
    };

    let periods: Date[];
    switch (granularity) {
      case "daily": periods = eachDayOfInterval({ start: fromDate, end: toDate }); break;
      case "weekly": periods = eachWeekOfInterval({ start: fromDate, end: toDate }, { weekStartsOn: 1 }); break;
      case "monthly": periods = eachMonthOfInterval({ start: fromDate, end: toDate }); break;
      case "yearly": periods = eachYearOfInterval({ start: fromDate, end: toDate }); break;
    }

    periods.forEach((period) => {
      const periodEnd = getIntervalEnd(period);
      const periodEndStr = format(periodEnd > toDate ? toDate : periodEnd, "yyyy-MM-dd");

      let lastInvested = 0;
      let lastCurrent = 0;

      Array.from(dateMap.entries())
        .filter(([dateStr]) => new Date(dateStr) <= new Date(periodEndStr))
        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
        .slice(0, 1)
        .forEach(([, values]) => {
          lastInvested = values.invested;
          lastCurrent = values.current;
        });

      if (lastInvested > 0 || lastCurrent > 0) {
        aggregatedData.push({
          date: periodEndStr,
          dateFormatted: formatDate(periodEnd > toDate ? toDate : periodEnd),
          invested: lastInvested,
          current: lastCurrent,
        });
      }
    });

    return aggregatedData;
  }, [assetTransactions, assetValuations, fromDate, toDate, granularity]);

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" style={{ color: assetType.color }} />
            {assetType.name} Performance - Detailed View
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">View:</span>
            <Select value={granularity} onValueChange={(v) => setGranularity(v as Granularity)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">From:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-36 justify-start text-left font-normal", !fromDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromDate ? format(fromDate, "MMM dd, yyyy") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">To:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-36 justify-start text-left font-normal", !toDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {toDate ? format(toDate, "MMM dd, yyyy") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="dateFormatted" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis tickFormatter={formatCurrency} stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--card-foreground))' }}
                itemStyle={{ color: 'hsl(var(--card-foreground))' }}
                formatter={(value: number) => [new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)]}
              />
              <Legend />
              <Line type="monotone" dataKey="invested" name="Invested Value" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={{ fill: 'hsl(var(--muted-foreground))', strokeWidth: 2, r: 4 }} />
              <Line type="monotone" dataKey="current" name="Current Value" stroke={assetType.color} strokeWidth={2} dot={{ fill: assetType.color, strokeWidth: 2, r: 4 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No data available for the selected date range
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default HistoricalChartModal;
