import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { financeDb } from "@/integrations/supabase/financeClient";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { InvestmentWithLatest, InvestmentTransaction } from "./types";
import { calculateXIRR, buildCashFlows } from "./xirr";

interface CryptoListProps {
  investments: InvestmentWithLatest[];
  transactions: InvestmentTransaction[];
  onRefreshComplete: () => void;
}

const CryptoList = ({ investments, transactions, onRefreshComplete }: CryptoListProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  // Filter crypto investments: asset_type name contains "crypto" (case-insensitive)
  const cryptoInvestments = investments.filter(
    (inv) => (inv.asset_type as any)?.name?.toLowerCase().includes("crypto")
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

  // Per-fund XIRR
  const fundXirr = useMemo(() => {
    const result: Record<string, number | null> = {};
    for (const fund of cryptoInvestments) {
      const fundTx = transactions.filter((t) => t.investment_id === fund.id);
      const cashFlows = buildCashFlows(fundTx, fund.current_value);
      result[fund.id] = calculateXIRR(cashFlows);
    }
    return result;
  }, [cryptoInvestments, transactions]);

  // Summary metrics
  const summary = useMemo(() => {
    const totalInvested = cryptoInvestments.reduce((s, f) => s + f.total_invested, 0);
    const totalCurrent = cryptoInvestments.reduce((s, f) => s + f.current_value, 0);
    const totalPL = totalCurrent - totalInvested;
    const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;
    return { totalInvested, totalCurrent, totalPL, totalPLPercent };
  }, [cryptoInvestments]);

  const handleRefreshAll = async () => {
    if (cryptoInvestments.length === 0) return;
    setRefreshing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Collect all coin IDs (stored in extra_configuration.coin_id) for crypto investments
      const coinIds = cryptoInvestments
        .map((inv) => (inv as any).extra_configuration?.coin_id)
        .filter(Boolean) as string[];

      if (coinIds.length === 0) {
        toast({ title: "No coin IDs configured", description: "Set CoinGecko coin ID in the scheme code field", variant: "destructive" });
        setRefreshing(false);
        return;
      }

      // Fetch all prices in one call
      const { data: priceData, error: fnError } = await supabase.functions.invoke("get-crypto-price", {
        body: { ids: [...new Set(coinIds)] },
      });

      if (fnError) throw fnError;

      const today = format(new Date(), "yyyy-MM-dd");

      for (const crypto of cryptoInvestments) {
        const coinId = (crypto as any).extra_configuration?.coin_id;
        if (!coinId) { failCount++; continue; }

        const priceInr = priceData?.[coinId]?.inr;
        if (!priceInr) { failCount++; continue; }

        try {
          // Get transactions to calculate units
          const fundTransactions = transactions.filter((t) => t.investment_id === crypto.id);
          const sortedByDate = [...fundTransactions].sort(
            (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
          );
          const lastValueRecord = sortedByDate.find((t) => Number(t.current_value) > 0);

          let totalUnits = 0;

          if (lastValueRecord) {
            // Derive units from last recorded value / last recorded price
            // For crypto, we need to find what price was at that time
            // Simplification: units = last_value / current_price won't work
            // Better: compute units from all buy transactions
            // Each buy: units += amount_invested / price_at_time
            // Since we don't have historical prices easily, use: units = last_value / last_price
            // But we don't store last_price. So let's compute from total_invested and gain pattern.
            // Simplest accurate approach: total_units = current_value_at_last_record / price_at_last_record
            // Since we don't have historical crypto prices, let's just use:
            // newValue = (lastRecordedValue / oldPrice) * newPrice -- but we don't have oldPrice
            
            // Best approach for crypto: just update current_value directly using a ratio
            // Or simply: the user's current_value from the last record represents some quantity
            // We'll compute units as total_invested / average_buy_price approximation
            // Actually, let's just calculate total units from buy transactions
            totalUnits = 0;
            for (const tx of fundTransactions) {
              if (Number(tx.amount_invested) > 0) {
                // We don't have historical prices, so we can't derive units from buys alone
                // Use the last value record to get units
                break;
              }
            }
            
            // Fallback: if we have a last value record, compute units from it
            // We need some reference price. Since the last value was recorded via this same refresh,
            // the pattern is: lastValue = units * lastPrice, so units = lastValue / lastPrice
            // But we don't store lastPrice. 
            // 
            // Simplest reliable approach: store units info or just compute new value proportionally
            // newValue = totalInvested + (totalInvested * currentMarketReturn)
            // But that's not right either.
            //
            // The correct approach for crypto: compute total quantity from buy transactions
            // quantity = sum of (amount / price_at_buy_time)
            // Since we don't track buy prices, we'll use the overall approach:
            // Just set current_value = the value the user sees (which was last recorded)
            // and update it proportionally: newValue = lastRecordValue * (newPrice / ???)
            //
            // Without historical prices, the best we can do is trust the last recorded value
            // and compute quantity = lastRecordedValue / currentPrice... but that's circular.
            //
            // Actually the simplest correct approach for crypto:
            // The user enters quantity when buying. The quantity IS amount_invested in crypto terms.
            // No - amount_invested is in INR.
            //
            // Let me reconsider: the user buys crypto worth ₹10,000. We record amount_invested=10000.
            // At the time of purchase, if BTC was ₹50,00,000, they got 0.002 BTC.
            // But we don't know the price at purchase time without historical data.
            //
            // Given constraints, the simplest approach:
            // If there's a previous value record, compute quantity = previousValue / previousPrice
            // But we don't have previousPrice stored.
            //
            // Practical solution: just track using total_invested and manual Record Value.
            // For auto-refresh, use a simple approach:
            // If there was a previous auto-refresh value record, we stored the value.
            // We don't have price history. So let's store the price in the record somehow.
            // We can use the interest_rate field to store the price at time of recording!
            
            // Check if last value record has a stored price (in interest_rate field)
            const lastStoredPrice = lastValueRecord.interest_rate;
            if (lastStoredPrice && Number(lastStoredPrice) > 0) {
              totalUnits = Number(lastValueRecord.current_value) / Number(lastStoredPrice);
            } else {
              // No stored price - fall back to computing from total invested / current price
              totalUnits = crypto.total_invested / priceInr;
            }
            
            // Add units from buys AFTER the last value record
            const lastValueDate = new Date(lastValueRecord.transaction_date);
            const buysAfter = fundTransactions.filter(
              (t) => Number(t.amount_invested) > 0 && new Date(t.transaction_date) > lastValueDate
            );
            for (const buy of buysAfter) {
              // These buys happened after last record, use current price as approximation
              totalUnits += Number(buy.amount_invested) / priceInr;
            }
          } else {
            // No value records - estimate units from total invested / current price
            totalUnits = crypto.total_invested / priceInr;
          }

          const newCurrentValue = Math.round(totalUnits * priceInr * 100) / 100;

          // Check if a value record already exists for today
          const { data: existingRecords } = await financeDb
            .from("investment_transactions")
            .select("id")
            .eq("investment_id", crypto.id)
            .eq("transaction_date", today)
            .eq("amount_invested", 0);

          if (existingRecords && existingRecords.length > 0) {
            const [keepRecord, ...extraRecords] = existingRecords;
            const { error } = await financeDb
              .from("investment_transactions")
              .update({ current_value: newCurrentValue, interest_rate: priceInr })
              .eq("id", keepRecord.id);
            if (error) { failCount++; continue; }

            for (const extra of extraRecords) {
              await financeDb.from("investment_transactions").delete().eq("id", extra.id);
            }
            successCount++;
          } else {
            const { error } = await financeDb.from("investment_transactions").insert({
              investment_id: crypto.id,
              transaction_date: today,
              amount_invested: 0,
              current_value: newCurrentValue,
              interest_rate: priceInr,
            });
            if (error) { failCount++; } else { successCount++; }
          }
        } catch {
          failCount++;
        }
      }

      toast({
        title: "Crypto Refresh Complete",
        description: `Updated ${successCount} coin(s)${failCount > 0 ? `, ${failCount} failed` : ""}`,
        variant: failCount > 0 && successCount === 0 ? "destructive" : "default",
      });

      if (successCount > 0) onRefreshComplete();
    } catch (error: any) {
      toast({ title: "Error refreshing prices", description: error.message, variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  if (cryptoInvestments.length === 0) return null;

  const isPositiveTotal = summary.totalPL >= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Cryptocurrency</h2>
        <Button variant="outline" size="sm" onClick={handleRefreshAll} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Prices"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Invested</p>
            <p className="text-lg font-bold mt-1">{formatCurrency(summary.totalInvested)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Current Value</p>
            <p className="text-lg font-bold mt-1">{formatCurrency(summary.totalCurrent)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total P/L</p>
            <p className={`text-lg font-bold mt-1 ${isPositiveTotal ? "text-green-500" : "text-destructive"}`}>
              {isPositiveTotal ? "+" : ""}{formatCurrency(summary.totalPL)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">P/L %</p>
            <p className={`text-lg font-bold mt-1 ${isPositiveTotal ? "text-green-500" : "text-destructive"}`}>
              {isPositiveTotal ? "+" : ""}{summary.totalPLPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Individual Crypto Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {cryptoInvestments.map((crypto) => {
          const isPositive = crypto.gain_loss >= 0;
          const xirr = fundXirr[crypto.id];

          return (
            <Card key={crypto.id} className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold leading-tight">{crypto.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Invested</p>
                    <p className="font-semibold">{formatCurrency(crypto.total_invested)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Current Value</p>
                    <p className="font-semibold">{formatCurrency(crypto.current_value)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">P/L</p>
                    <p className={`font-semibold ${isPositive ? "text-green-500" : "text-destructive"}`}>
                      {isPositive ? "+" : ""}{formatCurrency(crypto.gain_loss)} ({isPositive ? "+" : ""}{crypto.gain_loss_percent.toFixed(2)}%)
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">XIRR</p>
                    <p className={`font-semibold ${xirr !== null && xirr >= 0 ? "text-green-500" : "text-destructive"}`}>
                      {xirr !== null ? `${(xirr * 100).toFixed(2)}%` : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CryptoList;
