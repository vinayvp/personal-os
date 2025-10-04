import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingDown, TrendingUp, PiggyBank, Trash2 } from "lucide-react";

interface FinancialSnapshot {
  id: string;
  date: string;
  salary: number;
}

interface FinancialBreakdown {
  category: 'expense' | 'investment' | 'savings';
  name: string;
  amount: number;
}

interface FinancialSummaryProps {
  snapshot: FinancialSnapshot;
  breakdowns: FinancialBreakdown[];
  onDelete: () => void;
}

const FinancialSummary = ({ snapshot, breakdowns, onDelete }: FinancialSummaryProps) => {
  const expenses = breakdowns
    .filter(b => b.category === 'expense')
    .reduce((sum, b) => sum + b.amount, 0);
  
  const investments = breakdowns
    .filter(b => b.category === 'investment')
    .reduce((sum, b) => sum + b.amount, 0);
  
  const savings = breakdowns
    .filter(b => b.category === 'savings')
    .reduce((sum, b) => sum + b.amount, 0);

  const remaining = Math.max(0, snapshot.salary - expenses - investments - savings);

  const stats = [
    {
      title: "Salary",
      value: snapshot.salary,
      icon: DollarSign,
      color: "text-blue-500"
    },
    {
      title: "Expenses",
      value: expenses,
      icon: TrendingDown,
      color: "text-red-500"
    },
    {
      title: "Investments",
      value: investments,
      icon: TrendingUp,
      color: "text-green-500"
    },
    {
      title: "Savings",
      value: savings,
      icon: PiggyBank,
      color: "text-blue-500"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">
            {new Date(snapshot.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <p className="text-sm text-muted-foreground">
            Remaining: ₹{remaining.toFixed(2)}
          </p>
        </div>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-xl font-semibold">₹{stat.value.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {breakdowns.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Detailed Breakdown</h3>
            <div className="space-y-2">
              {breakdowns.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.category === 'expense' ? 'bg-red-100 text-red-700' :
                      item.category === 'investment' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {item.category}
                    </span>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-semibold">₹{item.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialSummary;
