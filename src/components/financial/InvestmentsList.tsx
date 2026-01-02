import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, List, ArrowUpDown } from "lucide-react";
import { InvestmentWithLatest } from "./types";

interface InvestmentsListProps {
  investments: InvestmentWithLatest[];
}

type SortField = "gain_loss_percent" | "gain_loss";
type SortOrder = "asc" | "desc";

const InvestmentsList = ({ investments }: InvestmentsListProps) => {
  const [sortField, setSortField] = useState<SortField>("gain_loss_percent");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const sortedInvestments = [...investments].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
  };

  if (investments.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <List className="h-5 w-5" />
            All Investments
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <List className="h-5 w-5" />
            All Investments ({investments.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
              <SelectTrigger className="w-[130px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gain_loss_percent">P/L %</SelectItem>
                <SelectItem value="gain_loss">P/L Value</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleSortOrder}
              className="h-8 px-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortOrder === "desc" ? "High→Low" : "Low→High"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {sortedInvestments.map((investment) => {
              const isPositive = investment.gain_loss_percent >= 0;
              const assetType = investment.asset_type;
              const assetColor = assetType?.color || 'hsl(var(--muted-foreground))';
              const assetName = assetType?.name || 'Unknown';

              return (
                <div
                  key={investment.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isPositive
                      ? 'border-green-500/20 bg-green-500/5'
                      : 'border-destructive/20 bg-destructive/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{investment.name}</p>
                        <Badge
                          variant="secondary"
                          className="text-xs shrink-0"
                          style={{ 
                            backgroundColor: `${assetColor}20`,
                            color: assetColor,
                          }}
                        >
                          {assetName}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatCurrency(investment.total_invested)} → {formatCurrency(investment.current_value)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div
                      className={`flex items-center gap-1 justify-end font-semibold text-sm ${
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

export default InvestmentsList;
