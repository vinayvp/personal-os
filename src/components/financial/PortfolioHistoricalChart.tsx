import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { format, parseISO, subMonths, isAfter } from "date-fns";
import { Investment, InvestmentTransaction, InvestmentValuation } from "./types";

interface PortfolioHistoricalChartProps {
  investments: Investment[];
  transactions: InvestmentTransaction[];
  valuations: InvestmentValuation[];
}

const PortfolioHistoricalChart = ({ investments, transactions, valuations }: PortfolioHistoricalChartProps) => {
  if (transactions.length === 0 && valuations.length === 0) {
    return null;
  }

  const normalizeDate = (isoString: string) => isoString.split('T')[0];

  // 1. Group ALL transactions by date
  const txByDate = new Map<string, number>();
  transactions.forEach((t) => {
    const date = normalizeDate(t.transaction_date);
    txByDate.set(date, (txByDate.get(date) || 0) + Number(t.amount_invested));
  });

  // 2. Group ALL valuations by date
  const valByDate = new Map<string, InvestmentValuation[]>();
  valuations.forEach((v) => {
    const date = normalizeDate(v.valuation_date);
    const existing = valByDate.get(date) || [];
    existing.push(v);
    valByDate.set(date, existing);
  });

  // 3. Sort chronologically
  const allDates = Array.from(new Set([...txByDate.keys(), ...valByDate.keys()]))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // 4. Trackers
  let runningInvested = 0;
  const latestKnownValuations = new Map<string, number>(); 
  const sixMonthsAgo = subMonths(new Date(), 6);

  const fullChartData = allDates.map((date) => {
    const txImpact = txByDate.get(date) || 0;
    runningInvested += txImpact;

    const daysValuations = valByDate.get(date) || [];
    daysValuations.forEach(v => {
      // Maps by transaction_id for FDs/Bonds, and investment_id for Mutual Funds/Crypto
      const entityKey = v.transaction_id || v.investment_id;
      latestKnownValuations.set(entityKey, Number(v.current_value));
    });

    let runningCurrent = 0;
    latestKnownValuations.forEach(value => {
      runningCurrent += value;
    });

    return {
      date,
      dateObj: parseISO(date),
      dateFormatted: format(parseISO(date), 'MMM dd'),
      invested: runningInvested,
      current: latestKnownValuations.size > 0 ? runningCurrent : undefined,
    };
  });

  // 5. Display only last 6 months
  const chartData = fullChartData.filter(item => isAfter(item.dateObj, sixMonthsAgo));

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Total Portfolio History
        </CardTitle>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Last 6 Months</span>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
            <XAxis 
              dataKey="dateFormatted" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={11} 
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis 
              tickFormatter={formatCurrency} 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={11} 
              tickLine={false}
              axisLine={false}
              width={45}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))', 
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value: number) => [
                new Intl.NumberFormat('en-IN', { 
                  style: 'currency', 
                  currency: 'INR', 
                  maximumFractionDigits: 0 
                }).format(value)
              ]}
            />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '20px' }} />
            <Line 
              type="monotone" 
              dataKey="invested" 
              name="Total Invested" 
              stroke="hsl(var(--muted-foreground))" 
              strokeWidth={2} 
              dot={false} 
              activeDot={{ r: 4 }}
              strokeDasharray="5 5"
            />
            <Line 
              type="monotone" 
              dataKey="current" 
              name="Total Value" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2.5} 
              dot={false} 
              connectNulls
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PortfolioHistoricalChart;