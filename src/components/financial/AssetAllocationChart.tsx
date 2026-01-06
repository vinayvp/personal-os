import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { InvestmentWithLatest, AssetType } from "./types";

interface AssetAllocationChartProps {
  investments: InvestmentWithLatest[];
  assetTypes: AssetType[];
}

const AssetAllocationChart = ({ investments, assetTypes }: AssetAllocationChartProps) => {
  // Group investments by asset type
  const assetTypeMap = new Map<string, { name: string; color: string; value: number }>();
  
  investments.forEach((inv) => {
    const assetType = inv.asset_type || assetTypes.find((at) => at.id === inv.asset_type_id);
    if (!assetType) return;

    const existing = assetTypeMap.get(assetType.id);
    if (existing) {
      existing.value += inv.current_value;
    } else {
      assetTypeMap.set(assetType.id, {
        name: assetType.name,
        color: assetType.color,
        value: inv.current_value,
      });
    }
  });

  const chartData = Array.from(assetTypeMap.values()).filter((d) => d.value > 0);
  const totalValue = chartData.reduce((sum, d) => sum + d.value, 0);

  if (chartData.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChartIcon className="h-5 w-5" />
            Asset Allocation
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <p className="text-muted-foreground">No data to display</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <PieChartIcon className="h-5 w-5" />
          Asset Allocation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              activeIndex={0}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  className="outline-none focus:outline-none"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--card-foreground))',
              }}
              itemStyle={{
                color: 'hsl(var(--card-foreground))',
              }}
              formatter={(value: number) => [
                `${formatCurrency(value)} (${((value / totalValue) * 100).toFixed(1)}%)`,
              ]}
            />
            <Legend
              formatter={(value, entry: any) => {
                const percent = ((entry.payload.value / totalValue) * 100).toFixed(1);
                return `${value} (${percent}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default AssetAllocationChart;
