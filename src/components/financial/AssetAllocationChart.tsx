import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { InvestmentWithLatest, AssetType } from "./types";

interface AssetAllocationChartProps {
  investments: InvestmentWithLatest[];
  assetTypes: AssetType[];
}

const AssetAllocationChart = ({ investments, assetTypes }: AssetAllocationChartProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Group investments by asset type
  const assetTypeMap = new Map<string, { id: string; name: string; color: string; value: number }>();
  
  investments.forEach((inv) => {
    const assetType = inv.asset_type || assetTypes.find((at) => at.id === inv.asset_type_id);
    if (!assetType) return;

    const existing = assetTypeMap.get(assetType.id);
    if (existing) {
      existing.value += inv.current_value;
    } else {
      assetTypeMap.set(assetType.id, {
        id: assetType.id,
        name: assetType.name,
        color: assetType.color,
        value: inv.current_value,
      });
    }
  });

  const chartData = Array.from(assetTypeMap.values())
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

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
    <Card className="bg-card border-border flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PieChartIcon className="h-5 w-5 text-primary" />
          Asset Allocation
        </CardTitle>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded font-medium">
          {formatCurrency(totalValue)}
        </span>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between pt-2">
        <div className="w-full">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                isAnimationActive={false}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    className="outline-none focus:outline-none transition-opacity duration-200 cursor-pointer"
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--card-foreground))',
                  fontSize: '12px',
                }}
                itemStyle={{
                  color: 'hsl(var(--card-foreground))',
                }}
                formatter={(value: number) => [
                  `${formatCurrency(value)} (${((value / totalValue) * 100).toFixed(1)}%)`,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Responsive Legend */}
        <div className="mt-3 pt-3 border-t border-border/60 max-h-40 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {chartData.map((entry, index) => {
              const percent = ((entry.value / totalValue) * 100).toFixed(1);
              const isHovered = activeIndex === index;
              return (
                <div
                  key={entry.id || entry.name}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`flex items-center justify-between text-xs px-2 py-1 rounded transition-colors cursor-pointer ${
                    isHovered ? 'bg-muted/80' : 'hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 mr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="truncate text-muted-foreground" title={entry.name}>
                      {entry.name}
                    </span>
                  </div>
                  <span className="font-medium shrink-0 tabular-nums">
                    {percent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssetAllocationChart;
