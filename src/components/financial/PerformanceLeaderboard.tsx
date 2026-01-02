import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Trophy } from "lucide-react";
import { InvestmentWithLatest } from "./types";

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
      <Card className="bg-card border-border h-full">
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
    <Card className="bg-card border-border h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5" />
          Performance Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <ScrollArea className="h-[280px] pr-4">
          <div className="space-y-3">
            {sortedInvestments.map((investment, index) => {
              const isPositive = investment.gain_loss_percent >= 0;
              const assetType = investment.asset_type;
              const assetColor = assetType?.color || 'hsl(var(--muted-foreground))';
              const assetName = assetType?.name || 'Unknown';

              return (
                <div
                  key={investment.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    index === 0 && isPositive
                      ? 'border-green-500/30 bg-green-500/5'
                      : index === sortedInvestments.length - 1 && !isPositive
                      ? 'border-destructive/30 bg-destructive/5'
                      : 'border-border bg-secondary/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="text-xl font-bold w-6 text-center"
                      style={{ color: index < 3 ? assetColor : undefined }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{investment.name}</p>
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{ 
                            backgroundColor: `${assetColor}20`,
                            color: assetColor,
                          }}
                        >
                          {assetName}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(investment.total_invested)} → {formatCurrency(investment.current_value)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`flex items-center gap-1 justify-end font-bold text-sm ${
                        isPositive ? 'text-green-500' : 'text-destructive'
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {isPositive ? '+' : ''}{investment.gain_loss_percent.toFixed(2)}%
                    </div>
                    <p className={`text-xs ${isPositive ? 'text-green-500' : 'text-destructive'}`}>
                      {isPositive ? '+' : ''}{formatCurrency(investment.gain_loss)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PerformanceLeaderboard;
