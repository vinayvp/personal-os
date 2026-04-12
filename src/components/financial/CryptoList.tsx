import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { financeDb } from "@/integrations/supabase/financeClient";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { InvestmentWithLatest, InvestmentTransaction, InvestmentValuation } from "./types";
import { calculateXIRR, buildCashFlows } from "./xirr";

interface CryptoListProps {
  investments: InvestmentWithLatest[];
  transactions: InvestmentTransaction[];
  valuations: InvestmentValuation[];
  onRefreshComplete: () => void;
}

const CryptoList = ({ investments, transactions, valuations, onRefreshComplete }: CryptoListProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

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
      const coinIds = cryptoInvestments
        .map((inv) => (inv as any).extra_configuration?.coin_id)
        .filter(Boolean) as string[];

      if (coinIds.length === 0) {
        toast({ title: "No coin IDs configured", description: "Set CoinGecko coin ID in the scheme code field", variant: "destructive" });
        setRefreshing(false);
        return;
      }

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
          const fundTransactions = transactions.filter((t) => t.investment_id === crypto.id);
          const fundValuations = valuations.filter((v) => v.investment_id === crypto.id);
          const sortedValuations = [...fundValuations].sort(
            (a, b) => new Date(b.valuation_date).getTime() - new Date(a.valuation_date).getTime()
          );
          const lastValuation = sortedValuations[0];

          let totalUnits = 0;

          if (lastValuation) {
            const lastStoredPrice = lastValuation.metadata?.price;
            if (lastStoredPrice && Number(lastStoredPrice) > 0) {
              totalUnits = Number(lastValuation.current_value) / Number(lastStoredPrice);
            } else {
              totalUnits = crypto.total_invested / priceInr;
            }
            
            const lastValDate = new Date(lastValuation.valuation_date);
            const buysAfter = fundTransactions.filter(
              (t) => Number(t.amount_invested) > 0 && new Date(t.transaction_date) > lastValDate
            );
            for (const buy of buysAfter) {
              totalUnits += Number(buy.amount_invested) / priceInr;
            }
          } else {
            totalUnits = crypto.total_invested / priceInr;
          }

          const newCurrentValue = Math.round(totalUnits * priceInr * 100) / 100;

          // Upsert into investment_valuations
          const { data: existingVal } = await financeDb
            .from("investment_valuations")
            .select("id")
            .eq("investment_id", crypto.id)
            .eq("valuation_date", today);

          if (existingVal && existingVal.length > 0) {
            const { error } = await financeDb
              .from("investment_valuations")
              .update({ current_value: newCurrentValue, metadata: { price: priceInr } })
              .eq("id", existingVal[0].id);
            if (error) { failCount++; continue; }
            successCount++;
          } else {
            const { error } = await financeDb.from("investment_valuations").insert({
              investment_id: crypto.id,
              valuation_date: today,
              current_value: newCurrentValue,
              metadata: { price: priceInr },
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

  const isPositiveTotal = summary.totalPL >= 0;

  // NEW: Empty State Check
  if (cryptoInvestments.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Cryptocurrency</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground italic border border-dashed border-border rounded-lg bg-card/50">
          Currently no investments in crypto. Add one to get started!
        </div>
      </div>
    );
  }

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