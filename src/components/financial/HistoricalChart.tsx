import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Maximize2 } from "lucide-react";
import { format } from "date-fns";
import { AssetType, Investment, InvestmentTransaction, InvestmentValuation } from "./types";
import HistoricalChartModal from "./HistoricalChartModal";

interface HistoricalChartProps {
  assetType: AssetType;
  investments: Investment[];
  transactions: InvestmentTransaction[];
  valuations: InvestmentValuation[];
}

const HistoricalChart = ({ assetType, investments, transactions, valuations }: HistoricalChartProps) => {
  const [modalOpen, setModalOpen] = useState(false);

  const assetInvestments = investments.filter((inv) => inv.asset_type_id === assetType.id);
  const investmentIds = new Set(assetInvestments.map((inv) => inv.id));
  
  const assetTransactions = transactions.filter((t) => investmentIds.has(t.investment_id));
  const assetValuations = valuations.filter((v) => investmentIds.has(v.investment_id));

  if (assetTransactions.length === 0 && assetValuations.length === 0) {
    return null;
  }

  // Build chart data: combine transactions (invested) and valuations (current value)
  const sortedTransactions = [...assetTransactions].sort(
    (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
  );

  let cumulativeInvested = 0;
  const dateMap = new Map<string, { invested: number; current: number }>();
  
  // Process transactions for invested line
  sortedTransactions.forEach((t) => {
    const amountInvested = Number(t.amount_invested);
    if (amountInvested !== 0) {
      cumulativeInvested += amountInvested;
    }
    dateMap.set(t.transaction_date, {
      invested: cumulativeInvested,
      current: dateMap.get(t.transaction_date)?.current || 0,
    });
  });

  // Process valuations for current value line
  // Sum valuations per date across all investments in this asset type
  const valByDate = new Map<string, number>();
  assetValuations.forEach((v) => {
    valByDate.set(v.valuation_date, (valByDate.get(v.valuation_date) || 0) + Number(v.current_value));
  });

  // Merge valuation data into dateMap
  valByDate.forEach((currentVal, date) => {
    const existing = dateMap.get(date);
    if (existing) {
      existing.current = currentVal;
    } else {
      // Find the last known invested value
      let lastInvested = 0;
      for (const [d, v] of dateMap.entries()) {
        if (d <= date) lastInvested = v.invested;
      }
      dateMap.set(date, { invested: lastInvested, current: currentVal });
    }
  });

  const chartData = Array.from(dateMap.entries())
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .filter(([, values]) => values.invested > 0 || values.current > 0)
    .map(([date, values]) => ({
      date,
      dateFormatted: format(new Date(date), 'MMM dd'),
      invested: values.invested,
      current: values.current || undefined,
    }));

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
  };

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" style={{ color: assetType.color }} />
            {assetType.name} Performance
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setModalOpen(true)} className="h-8 w-8">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="dateFormatted" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis tickFormatter={formatCurrency} stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                formatter={(value: number) => [new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)]}
              />
              <Legend />
              <Line type="monotone" dataKey="invested" name="Invested Value" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="current" name="Current Value" stroke={assetType.color} strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <HistoricalChartModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        assetType={assetType}
        investments={investments}
        transactions={transactions}
        valuations={valuations}
      />
    </>
  );
};

export default HistoricalChart;
