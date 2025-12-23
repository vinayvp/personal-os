import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Trophy } from "lucide-react";
import { InvestmentWithLatest, ASSET_TYPE_LABELS, ASSET_TYPE_COLORS } from "./types";

interface PerformanceLeaderboardProps {
  investments: InvestmentWithLatest[];
}

const PerformanceLeaderboard = ({ investments }: PerformanceLeaderboardProps) => {
  const sortedInvestments = [...investments].sort(
    (a, b) => b.gain_loss_percent - a.gain_loss_percent
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (sortedInvestments.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5" />
            Performance Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">No investments to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5" />
          Performance Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedInvestments.map((investment, index) => {
          const isPositive = investment.gain_loss_percent >= 0;
          return (
            <div
              key={investment.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                index === 0 && isPositive
                  ? 'border-green-500/30 bg-green-500/5'
                  : index === sortedInvestments.length - 1 && !isPositive
                  ? 'border-destructive/30 bg-destructive/5'
                  : 'border-border bg-secondary/30'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className="text-2xl font-bold w-8 text-center"
                  style={{ color: index < 3 ? ASSET_TYPE_COLORS[investment.asset_type] : undefined }}
                >
                  {index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{investment.name}</p>
                    <Badge
                      variant="secondary"
                      style={{ 
                        backgroundColor: `${ASSET_TYPE_COLORS[investment.asset_type]}20`,
                        color: ASSET_TYPE_COLORS[investment.asset_type],
                      }}
                    >
                      {ASSET_TYPE_LABELS[investment.asset_type]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Invested: {formatCurrency(investment.total_invested)} → Current: {formatCurrency(investment.current_value)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`flex items-center gap-1 justify-end font-bold ${
                    isPositive ? 'text-green-500' : 'text-destructive'
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {isPositive ? '+' : ''}{investment.gain_loss_percent.toFixed(2)}%
                </div>
                <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-destructive'}`}>
                  {isPositive ? '+' : ''}{formatCurrency(investment.gain_loss)}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default PerformanceLeaderboard;
