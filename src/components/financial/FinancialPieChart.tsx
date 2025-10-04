import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface FinancialBreakdown {
  category: 'expense' | 'investment' | 'savings';
  name: string;
  amount: number;
}

interface FinancialPieChartProps {
  salary: number;
  breakdowns: FinancialBreakdown[];
}

const COLORS = {
  expense: '#ef4444',
  investment: '#22c55e',
  savings: '#3b82f6',
  remaining: '#94a3b8'
};

const FinancialPieChart = ({ salary, breakdowns }: FinancialPieChartProps) => {
  const totalAllocated = breakdowns.reduce((sum, item) => sum + item.amount, 0);
  const remaining = Math.max(0, salary - totalAllocated);

  const categoryTotals = breakdowns.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {} as Record<string, number>);

  const data = [
    ...Object.entries(categoryTotals).map(([category, amount]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: amount,
      color: COLORS[category as keyof typeof COLORS]
    })),
    ...(remaining > 0 ? [{
      name: 'Remaining',
      value: remaining,
      color: COLORS.remaining
    }] : [])
  ];

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No breakdown data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default FinancialPieChart;
