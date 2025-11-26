import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface FinancialSnapshot {
  id: string;
  date: string;
  salary: number;
}

interface FinancialBreakdown {
  snapshot_id: string;
  category: 'expense' | 'investment' | 'savings';
  amount: number;
  current_value: number | null;
}

interface InvestmentGrowthChartProps {
  snapshots: FinancialSnapshot[];
  breakdowns: FinancialBreakdown[];
}

const InvestmentGrowthChart = ({ snapshots, breakdowns }: InvestmentGrowthChartProps) => {
  const data = snapshots
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(snapshot => {
      const snapshotBreakdowns = breakdowns.filter(
        b => b.snapshot_id === snapshot.id && b.category === 'investment'
      );
      
      const totalInvested = snapshotBreakdowns.reduce((sum, b) => sum + b.amount, 0);
      const totalCurrentValue = snapshotBreakdowns.reduce((sum, b) => {
        return sum + (b.current_value !== null ? b.current_value : b.amount);
      }, 0);

      return {
        date: format(new Date(snapshot.date), 'MMM yyyy'),
        totalInvested,
        currentValue: totalCurrentValue,
        growth: totalCurrentValue - totalInvested,
      };
    })
    .filter(d => d.totalInvested > 0);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Investment Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No investment data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Investment Growth Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => `₹${value.toFixed(2)}`}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="totalInvested" 
              stroke="#3b82f6" 
              name="Total Invested"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="currentValue" 
              stroke="#22c55e" 
              name="Current Value"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
        
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          {data.length > 0 && (
            <>
              <div>
                <p className="text-sm text-muted-foreground">Latest Invested</p>
                <p className="text-lg font-semibold">₹{data[data.length - 1].totalInvested.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="text-lg font-semibold">₹{data[data.length - 1].currentValue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Growth</p>
                <p className={`text-lg font-semibold ${data[data.length - 1].growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data[data.length - 1].growth >= 0 ? '+' : ''}₹{data[data.length - 1].growth.toFixed(2)}
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestmentGrowthChart;
