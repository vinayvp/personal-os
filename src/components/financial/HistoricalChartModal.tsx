import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CalendarIcon, TrendingUp, CircleDot, LineChart as LineIcon } from "lucide-react";
import { 
  format, 
  parseISO, 
  endOfWeek, 
  endOfMonth, 
  endOfYear, 
  eachDayOfInterval, 
  eachWeekOfInterval, 
  eachMonthOfInterval, 
  eachYearOfInterval,
  isAfter
} from "date-fns";
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
  const [showDots, setShowDots] = useState(false);
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
    if (!fromDate || !toDate) return [];

    // 1. Group ALL data by date (Full history for cumulative accuracy)
    const txByDate = new Map<string, number>();
    assetTransactions.forEach((t) => {
      txByDate.set(t.transaction_date, (txByDate.get(t.transaction_date) || 0) + Number(t.amount_invested));
    });

    const valByDate = new Map<string, number>();
    assetValuations.forEach((v) => {
      valByDate.set(v.valuation_date, (valByDate.get(v.valuation_date) || 0) + Number(v.current_value));
    });

    const allDates = Array.from(new Set([...txByDate.keys(), ...valByDate.keys()]))
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    // 2. Build Daily Timeline (Memory)
    let runningInvested = 0;
    let runningCurrent = 0;
    const dailyTimeline = new Map<string, { invested: number; current: number }>();

    allDates.forEach((date) => {
      runningInvested += txByDate.get(date) || 0;
      const newValuation = valByDate.get(date);
      if (newValuation !== undefined) runningCurrent = newValuation;
      dailyTimeline.set(date, { invested: runningInvested, current: runningCurrent });
    });

    // 3. Define reporting periods
    let periods: Date[];
    const interval = { start: fromDate, end: toDate };
    
    switch (granularity) {
      case "daily": periods = eachDayOfInterval(interval); break;
      case "weekly": periods = eachWeekOfInterval(interval, { weekStartsOn: 1 }); break;
      case "monthly": periods = eachMonthOfInterval(interval); break;
      case "yearly": periods = eachYearOfInterval(interval); break;
      default: periods = [];
    }

    // 4. Map periods to last known data point
    return periods.map((periodStart) => {
      let periodEnd: Date;
      let dateLabel: string;

      switch (granularity) {
        case "daily":
          periodEnd = periodStart;
          dateLabel = format(periodStart, "MMM dd");
          break;
        case "weekly":
          periodEnd = endOfWeek(periodStart, { weekStartsOn: 1 });
          dateLabel = `Week of ${format(periodStart, "MMM dd")}`;
          break;
        case "monthly":
          periodEnd = endOfMonth(periodStart);
          dateLabel = format(periodStart, "MMM yyyy");
          break;
        case "yearly":
          periodEnd = endOfYear(periodStart);
          dateLabel = format(periodStart, "yyyy");
          break;
        default: periodEnd = periodStart; dateLabel = "";
      }

      const searchDate = periodEnd > toDate ? toDate : periodEnd;
      const searchStr = format(searchDate, "yyyy-MM-dd");

      // Find last known date <= searchStr
      const lastKnownDate = allDates.filter((d) => d <= searchStr).reverse()[0];
      const values = lastKnownDate ? dailyTimeline.get(lastKnownDate) : { invested: 0, current: 0 };

      return {
        date: searchStr,
        dateFormatted: dateLabel,
        invested: values?.invested || 0,
        current: values?.current && values.current > 0 ? values.current : undefined,
      };
    }).filter(d => d.invested > 0 || d.current);
  }, [assetTransactions, assetValuations, fromDate, toDate, granularity]);

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-card border-border">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="h-6 w-6" style={{ color: assetType.color }} />
            {assetType.name} Detailed Performance
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-4 py-4 border-b border-border mb-6">
          {/* Granularity Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Interval</span>
            <Select value={granularity} onValueChange={(v) => setGranularity(v as Granularity)}>
              <SelectTrigger className="w-32 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Pickers */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Range</span>
            <div className="flex items-center bg-background border rounded-md px-2 h-9">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="h-7 px-2 text-xs font-normal">
                    {fromDate ? format(fromDate, "dd MMM yyyy") : "Start"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={fromDate} onSelect={setFromDate} /></PopoverContent>
              </Popover>
              <span className="text-muted-foreground text-xs mx-1">→</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="h-7 px-2 text-xs font-normal">
                    {toDate ? format(toDate, "dd MMM yyyy") : "End"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={toDate} onSelect={setToDate} /></PopoverContent>
              </Popover>
            </div>
          </div>

          {/* DOTS TOGGLE */}
          <div className="ml-auto flex items-center gap-2">
            <Button 
              variant={showDots ? "secondary" : "outline"} 
              size="sm" 
              onClick={() => setShowDots(!showDots)}
              className="h-9 gap-2"
            >
              {showDots ? <CircleDot className="h-4 w-4" /> : <LineIcon className="h-4 w-4" />}
              <span className="text-xs">{showDots ? "Hide Dots" : "Show Dots"}</span>
            </Button>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                <XAxis 
                  dataKey="dateFormatted" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  minTickGap={40}
                />
                <YAxis 
                  tickFormatter={formatCurrency} 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  width={60}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                  formatter={(value: number) => [new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)]}
                />
                <Legend verticalAlign="top" align="right" height={40}/>
                <Line 
                  type="monotone" 
                  dataKey="invested" 
                  name="Invested Value" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                  dot={showDots ? { r: 3, fill: 'hsl(var(--muted-foreground))' } : false} 
                  activeDot={{ r: 5 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="current" 
                  name="Current Value" 
                  stroke={assetType.color} 
                  strokeWidth={3} 
                  dot={showDots ? { r: 4, fill: assetType.color, strokeWidth: 2, stroke: 'white' } : false} 
                  connectNulls 
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground italic border border-dashed rounded-lg">
            No data records found for the selected interval.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default HistoricalChartModal;