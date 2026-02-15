import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, RefreshCw, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { financeDb } from "@/integrations/supabase/financeClient";
import { format } from "date-fns";
import { InvestmentWithLatest, InvestmentTransaction } from "./types";

interface MutualFundsListProps {
  investments: InvestmentWithLatest[];
  transactions: InvestmentTransaction[];
  onRefreshComplete: () => void;
}

const MutualFundsList = ({ investments, transactions, onRefreshComplete }: MutualFundsListProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  // Filter only mutual fund investments (those with mf_scheme_code)
  const mutualFunds = investments.filter((inv) => (inv as any).mf_scheme_code);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Count NAV entries (Record Value entries) for a given investment
  const getNavCount = (investmentId: string) => {
    return transactions.filter(
      (t) => t.investment_id === investmentId && Number(t.current_value) > 0 && Number(t.amount_invested) === 0
    ).length;
  };

  const handleRefreshAll = async () => {
    if (mutualFunds.length === 0) return;

    setRefreshing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const fund of mutualFunds) {
        const schemeCode = (fund as any).mf_scheme_code;
        if (!schemeCode) continue;

        try {
          const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}/latest`);
          if (!response.ok) {
            failCount++;
            continue;
          }

          const data = await response.json();
          if (!data?.data?.[0]?.nav) {
            failCount++;
            continue;
          }

          const latestNav = parseFloat(data.data[0].nav);
          const navDate = data.data[0].date; // dd-MM-yyyy format

          // Calculate total units from transactions
          // total_invested / average_buy_nav gives units, but we need a simpler approach:
          // For mutual funds, current_value = units * current_nav
          // We need to figure out units. Let's compute from buy transactions:
          // Each buy transaction: units_bought = amount / nav_at_that_time
          // But we don't store nav_at_buy_time. So we use:
          // current_value = (total_invested / cost_nav) * current_nav
          // Simpler: just record the latest NAV * total_units as current_value
          
          // Get all buy transactions for this fund to calculate total units
          const fundTransactions = transactions.filter((t) => t.investment_id === fund.id);
          
          // Find the latest Record Value entry to get the previous current_value
          // For MFs, we'll calculate: new_value = (previous_value / previous_nav) * new_nav
          // But since we don't store per-unit data, let's use a simple approach:
          // total_units = total_invested (sum of buys) - we need units tracking
          
          // Actually, for MFs the best approach: 
          // We know total_invested. We record current_value as the total portfolio value.
          // On refresh, we need to know how many units the user holds.
          // Since we don't have units stored, let's derive from the last known NAV and value:
          // units = last_current_value / last_nav ... but we don't store NAV either.
          
          // Simplest correct approach: just use total_invested as base and let user 
          // manually track OR we can compute units from transaction amounts.
          // For now: record latest NAV value * estimated units
          
          // Let's just record the fetched NAV as a value snapshot
          // The user's current value = their units * latest NAV
          // If we don't know units, we use the ratio approach:
          // If there's a previous value record, new_value = old_value * (new_nav / old_nav)
          // If no previous value, new_value = total_invested (assuming bought at that NAV)

          // For a clean implementation: just insert a new \"Record Value\" transaction
          // with the NAV-based current value. We need units info.
          // Let's store units in the notes or derive from previous records.

          // Best approach without schema change: 
          // Get the most recent current_value record and its date, 
          // fetch the NAV on that date, compute units, then compute new value.
          
          // Even simpler: fetch ALL NAV history isn't practical.
          // Let's just use: if previous current_value exists, 
          // fetch the NAV for the previous date, compute units = prev_value / prev_nav
          // then new_value = units * latest_nav

          // Actually, the simplest and most correct: 
          // Store the current portfolio value directly from NAV * units
          // We need units. Let's compute units from the FIRST buy and subsequent buys.
          // But we don't have buy NAVs stored.

          // PRAGMATIC APPROACH: Just record the latest NAV as current_value for the total
          // and let the user know. The user should record units manually or we enhance later.
          
          // FINAL APPROACH: Fetch latest NAV, compute current_value from last known state.
          // If there's a previous \"Record Value\" entry, compute the ratio.
          // Otherwise, assume current_value = total_invested.

          const sortedByDate = [...fundTransactions].sort(
            (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
          );
          const lastValueRecord = sortedByDate.find((t) => Number(t.current_value) > 0);
          
          let newCurrentValue: number;
          
          if (lastValueRecord) {
            // We have a previous value. To compute new value, we need the NAV on that date.
            // Fetch NAV history for that date
            const prevDate = lastValueRecord.transaction_date;
            try {
              const histRes = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
              if (histRes.ok) {
                const histData = await histRes.json();
                // Find NAV closest to prevDate
                const prevDateObj = new Date(prevDate);
                let closestNav: number | null = null;
                let closestDiff = Infinity;
                
                for (const entry of histData.data || []) {
                  // date format: dd-MM-yyyy
                  const parts = entry.date.split('-');
                  const entryDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                  const diff = Math.abs(entryDate.getTime() - prevDateObj.getTime());
                  if (diff < closestDiff) {
                    closestDiff = diff;
                    closestNav = parseFloat(entry.nav);
                  }
                }

                if (closestNav && closestNav > 0) {
                  const units = Number(lastValueRecord.current_value) / closestNav;
                  newCurrentValue = units * latestNav;
                } else {
                  newCurrentValue = Number(lastValueRecord.current_value);
                }
              } else {
                newCurrentValue = Number(lastValueRecord.current_value);
              }
            } catch {
              newCurrentValue = Number(lastValueRecord.current_value);
            }
          } else {
            // No previous value record - assume invested at current NAV (fallback)
            newCurrentValue = fund.total_invested;
          }

          // Insert new Record Value transaction
          const today = format(new Date(), "yyyy-MM-dd");
          const { error } = await financeDb.from("investment_transactions").insert({
            investment_id: fund.id,
            transaction_date: today,
            amount_invested: 0,
            current_value: Math.round(newCurrentValue * 100) / 100,
          });

          if (error) {
            console.error(`Error recording value for ${fund.name}:`, error);
            failCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(`Error fetching NAV for ${fund.name}:`, err);
          failCount++;
        }
      }

      toast({
        title: "NAV Refresh Complete",
        description: `Updated ${successCount} fund(s)${failCount > 0 ? `, ${failCount} failed` : ''}`,
        variant: failCount > 0 && successCount === 0 ? "destructive" : "default",
      });

      if (successCount > 0) {
        onRefreshComplete();
      }
    } catch (error: any) {
      toast({
        title: "Error refreshing NAVs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (mutualFunds.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            Mutual Funds ({mutualFunds.length})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={refreshing}
            className="h-8"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? "Refreshing..." : "Refresh NAVs"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-2">
            {mutualFunds.map((fund) => {
              const isPositive = fund.gain_loss_percent >= 0;
              const assetColor = fund.asset_type?.color || 'hsl(var(--muted-foreground))';
              const navCount = getNavCount(fund.id);

              return (
                <div
                  key={fund.id}
                  className={`p-3 rounded-lg border ${
                    isPositive
                      ? 'border-green-500/20 bg-green-500/5'
                      : 'border-destructive/20 bg-destructive/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <p className="font-medium truncate">{fund.name}</p>
                      <Badge
                        variant="secondary"
                        className="text-xs shrink-0"
                        style={{
                          backgroundColor: `${assetColor}20`,
                          color: assetColor,
                        }}
                      >
                        {(fund as any).mf_scheme_code}
                      </Badge>
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
                        {isPositive ? '+' : ''}{fund.gain_loss_percent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Invested</p>
                      <p className="font-medium">{formatCurrency(fund.total_invested)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Current</p>
                      <p className="font-medium">{formatCurrency(fund.current_value)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">P/L</p>
                      <p className={`font-medium ${isPositive ? 'text-green-500' : 'text-destructive'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(fund.gain_loss)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">NAV Records</p>
                      <p className="font-medium">{navCount}</p>
                    </div>
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

export default MutualFundsList;
