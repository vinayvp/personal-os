import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface FinancialBreakdown {
  category: 'expense' | 'investment' | 'savings';
  name: string;
  amount: number;
}

interface InvestmentDiversificationProps {
  breakdowns: FinancialBreakdown[];
}

const INVESTMENT_COLORS = [
  '#10b981', // green-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
];

const InvestmentDiversification = ({ breakdowns }: InvestmentDiversificationProps) => {
  const investments = breakdowns.filter(b => b.category === 'investment');
  
  const totalInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0);

  if (investments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Investment Diversification
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

  const data = investments.map((inv, index) => ({
    name: inv.name,
    value: inv.amount,
    color: INVESTMENT_COLORS[index % INVESTMENT_COLORS.length]
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Investment Diversification
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">Total Investment</p>
          <p className="text-2xl font-bold">₹{totalInvestment.toFixed(2)}</p>
        </div>
        
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

        <div className="mt-4 space-y-2">
          {investments.map((inv, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: INVESTMENT_COLORS[index % INVESTMENT_COLORS.length] }}
                />
                <span className="font-medium">{inv.name}</span>
              </div>
              <div className="text-right">
                <p className="font-semibold">₹{inv.amount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  {((inv.amount / totalInvestment) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestmentDiversification;