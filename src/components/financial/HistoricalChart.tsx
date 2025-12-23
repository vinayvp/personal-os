import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { AssetType, ASSET_TYPE_LABELS, ASSET_TYPE_COLORS, Investment, InvestmentTransaction } from "./types";

interface HistoricalChartProps {
  assetType: AssetType;
  investments: Investment[];
  transactions: InvestmentTransaction[];
}

const HistoricalChart = ({ assetType, investments, transactions }: HistoricalChartProps) => {
  // Filter investments by asset type
  const assetInvestments = investments.filter((inv) => inv.asset_type === assetType);
  const investmentIds = new Set(assetInvestments.map((inv) => inv.id));
  
  // Get transactions for these investments
  const assetTransactions = transactions.filter((t) => investmentIds.has(t.investment_id));

  if (assetTransactions.length === 0) {
    return null;
  }

  // Group by date and sum values
  const dateMap = new Map<string, { invested: number; current: number }>();
  
  assetTransactions.forEach((t) => {
    const existing = dateMap.get(t.transaction_date) || { invested: 0, current: 0 };
    dateMap.set(t.transaction_date, {
      invested: existing.invested + Number(t.amount_invested),
      current: existing.current + Number(t.current_value),
    });
  });

  const chartData = Array.from(dateMap.entries())
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, values]) => ({
      date,
      dateFormatted: format(new Date(date), 'MMM dd'),
      invested: values.invested,
      current: values.current,
    }));

  const formatCurrency = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(1)}Cr`;
    }
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(0)}K`;
    }
    return `₹${value}`;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5" style={{ color: ASSET_TYPE_COLORS[assetType] }} />
          {ASSET_TYPE_LABELS[assetType]} Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="dateFormatted"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis
              tickFormatter={formatCurrency}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [
                new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                }).format(value),
              ]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="invested"
              name="Invested Value"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--muted-foreground))', strokeWidth: 2, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="current"
              name="Current Value"
              stroke={ASSET_TYPE_COLORS[assetType]}
              strokeWidth={2}
              dot={{ fill: ASSET_TYPE_COLORS[assetType], strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default HistoricalChart;
