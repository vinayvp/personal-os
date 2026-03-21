import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Maximize2 } from "lucide-react";
import { format, parseISO, subMonths, isAfter } from "date-fns";
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

  // 1. Group transactions by date
  const txByDate = new Map<string, number>();
  assetTransactions.forEach((t) => {
    txByDate.set(t.transaction_date, (txByDate.get(t.transaction_date) || 0) + Number(t.amount_invested));
  });

  // 2. Group valuations by date
  const valByDate = new Map<string, number>();
  assetValuations.forEach((v) => {
    valByDate.set(v.valuation_date, (valByDate.get(v.valuation_date) || 0) + Number(v.current_value));
  });

  // 3. Get all unique dates and sort them
  const allDates = Array.from(new Set([...txByDate.keys(), ...valByDate.keys()]))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // 4. Build the FULL continuous timeline first (to ensure cumulative values are correct)
  let runningInvested = 0;
  let runningCurrent = 0;
  const sixMonthsAgo = subMonths(new Date(), 6);

  const fullChartData = allDates.map((date) => {
    const txImpact = txByDate.get(date) || 0;
    runningInvested += txImpact;

    const newValuation = valByDate.get(date);
    if (newValuation !== undefined) {
      runningCurrent = newValuation;
    }

    return {
      date,
      dateObj: parseISO(date),
      dateFormatted: format(parseISO(date), 'MMM dd'),
      invested: runningInvested,
      current: runningCurrent > 0 ? runningCurrent : undefined,
    };
  });

  // 5. Filter for only the last 6 months for the display
  const chartData = fullChartData.filter(item => isAfter(item.dateObj, sixMonthsAgo));

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
  };

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" style={{ color: assetType.color }} />
            {assetType.name} Performance
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Last 6 Months</span>
            <Button variant="ghost" size="icon" onClick={() => setModalOpen(true)} className="h-8 w-8">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
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
                name="Invested" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 4 }}
                strokeDasharray="5 5" // Makes invested line slightly distinct
              />
              <Line 
                type="monotone" 
                dataKey="current" 
                name="Current" 
                stroke={assetType.color} 
                strokeWidth={2.5} 
                dot={false} 
                connectNulls
                activeDot={{ r: 6 }}
              />
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