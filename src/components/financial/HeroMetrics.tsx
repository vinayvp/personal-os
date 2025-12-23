import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";

interface HeroMetricsProps {
  totalPortfolioValue: number;
  totalInvested: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
}

const HeroMetrics = ({
  totalPortfolioValue,
  totalInvested,
  totalGainLoss,
  totalGainLossPercent,
}: HeroMetricsProps) => {
  const isPositive = totalGainLoss >= 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Portfolio Value</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(totalPortfolioValue)}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Invested</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(totalInvested)}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
              <PiggyBank className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Gain/Loss</p>
              <p className={`text-3xl font-bold mt-2 ${isPositive ? 'text-green-500' : 'text-destructive'}`}>
                {isPositive ? '+' : ''}{formatCurrency(totalGainLoss)}
              </p>
              <p className={`text-sm font-medium mt-1 ${isPositive ? 'text-green-500' : 'text-destructive'}`}>
                {isPositive ? '+' : ''}{totalGainLossPercent.toFixed(2)}%
              </p>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isPositive ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
              {isPositive ? (
                <TrendingUp className="h-6 w-6 text-green-500" />
              ) : (
                <TrendingDown className="h-6 w-6 text-destructive" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HeroMetrics;
