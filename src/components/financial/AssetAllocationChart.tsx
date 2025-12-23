import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { AssetType, ASSET_TYPE_LABELS, ASSET_TYPE_COLORS, InvestmentWithLatest } from "./types";

interface AssetAllocationChartProps {
  investments: InvestmentWithLatest[];
}

const AssetAllocationChart = ({ investments }: AssetAllocationChartProps) => {
  // Group by asset type
  const allocationData = Object.entries(
    investments.reduce((acc, inv) => {
      acc[inv.asset_type] = (acc[inv.asset_type] || 0) + inv.current_value;
      return acc;
    }, {} as Record<AssetType, number>)
  ).map(([type, value]) => ({
    name: ASSET_TYPE_LABELS[type as AssetType],
    value,
    color: ASSET_TYPE_COLORS[type as AssetType],
  }));

  const total = allocationData.reduce((sum, item) => sum + item.value, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (allocationData.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChartIcon className="h-5 w-5" />
            Asset Allocation
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No investments to display</p>
        </CardContent>
      </Card>
    );
  }

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
              data={allocationData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {allocationData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Value']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend
              formatter={(value: string) => {
                const item = allocationData.find((d) => d.name === value);
                const percent = item ? ((item.value / total) * 100).toFixed(1) : 0;
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
