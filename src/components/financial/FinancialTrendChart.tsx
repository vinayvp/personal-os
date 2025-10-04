import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface FinancialSnapshot {
  id: string;
  date: string;
  salary: number;
}

interface FinancialBreakdown {
  snapshot_id: string;
  category: 'expense' | 'investment' | 'savings';
  amount: number;
}

interface FinancialTrendChartProps {
  snapshots: FinancialSnapshot[];
  breakdowns: FinancialBreakdown[];
}

const FinancialTrendChart = ({ snapshots, breakdowns }: FinancialTrendChartProps) => {
  const data = snapshots
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(snapshot => {
      const snapshotBreakdowns = breakdowns.filter(b => b.snapshot_id === snapshot.id);
      
      const expenses = snapshotBreakdowns
        .filter(b => b.category === 'expense')
        .reduce((sum, b) => sum + b.amount, 0);
      
      const investments = snapshotBreakdowns
        .filter(b => b.category === 'investment')
        .reduce((sum, b) => sum + b.amount, 0);
      
      const savings = snapshotBreakdowns
        .filter(b => b.category === 'savings')
        .reduce((sum, b) => sum + b.amount, 0);

      return {
        date: format(new Date(snapshot.date), 'MMM yyyy'),
        salary: snapshot.salary,
        expenses,
        investments,
        savings,
        remaining: Math.max(0, snapshot.salary - expenses - investments - savings)
      };
    });

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No historical data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
        <Legend />
        <Line type="monotone" dataKey="salary" stroke="#8884d8" name="Salary" />
        <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" />
        <Line type="monotone" dataKey="investments" stroke="#22c55e" name="Investments" />
        <Line type="monotone" dataKey="savings" stroke="#3b82f6" name="Savings" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default FinancialTrendChart;
