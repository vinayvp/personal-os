import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, RefreshCw, BarChart3, Calendar, Trash2, Plus, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { financeDb } from "@/integrations/supabase/financeClient";
import { format } from "date-fns";
import { InvestmentWithLatest, InvestmentTransaction, SipConfig } from "./types";
import { calculateXIRR, buildCashFlows } from "./xirr";

interface MutualFundsListProps {
  investments: InvestmentWithLatest[];
  transactions: InvestmentTransaction[];
  sipConfigs: SipConfig[];
  onRefreshComplete: () => void;
  onAddSip: () => void;
}

interface FundNavData {
  nav: number;
  units: number;
}

const MutualFundsList = ({ investments, transactions, sipConfigs, onRefreshComplete, onAddSip }: MutualFundsListProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const [navData, setNavData] = useState<Record<string, FundNavData>>({});
  const { toast } = useToast();

  const mutualFunds =  investments.filter((inv) => {
    const assetTypeName = (inv as any).asset_types?.name || (inv as any).asset_type?.name;
    return assetTypeName?.toLowerCase() === "Mutual Funds".toLowerCase();
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

  // Fetch current NAVs on mount to compute units
  useEffect(() => {
    const fetchNavs = async () => {
      const data: Record<string, FundNavData> = {};
      for (const fund of mutualFunds) {
        const schemeCode = (fund as any).extra_configuration?.mf_scheme_code;
        if (!schemeCode || fund.current_value <= 0) continue;
        try {
          const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}/latest`);
          if (!res.ok) continue;
          const json = await res.json();
          const nav = parseFloat(json?.data?.[0]?.nav);
          if (nav > 0) {
            data[fund.id] = { nav, units: fund.current_value / nav };
          }
        } catch { /* skip */ }
      }
      setNavData(data);
    };
    if (mutualFunds.length > 0) fetchNavs();
  }, [mutualFunds.length]);

  // Per-fund XIRR
  const fundXirr = useMemo(() => {
    const result: Record<string, number | null> = {};
    for (const fund of mutualFunds) {
      const fundTx = transactions.filter((t) => t.investment_id === fund.id);
      const cashFlows = buildCashFlows(fundTx, fund.current_value);
      result[fund.id] = calculateXIRR(cashFlows);
    }
    return result;
  }, [mutualFunds, transactions]);

  // Overall XIRR
  const overallXirr = useMemo(() => {
    const allTx = mutualFunds.flatMap((fund) =>
      transactions.filter((t) => t.investment_id === fund.id)
    );
    const totalCurrentValue = mutualFunds.reduce((s, f) => s + f.current_value, 0);
    const cashFlows = buildCashFlows(allTx, totalCurrentValue);
    return calculateXIRR(cashFlows);
  }, [mutualFunds, transactions]);

  // Summary metrics
  const summary = useMemo(() => {
    const totalInvested = mutualFunds.reduce((s, f) => s + f.total_invested, 0);
    const totalCurrent = mutualFunds.reduce((s, f) => s + f.current_value, 0);
    const totalPL = totalCurrent - totalInvested;
    const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;
    return { totalInvested, totalCurrent, totalPL, totalPLPercent };
  }, [mutualFunds]);

  const getSipForFund = (investmentId: string) =>
    sipConfigs.find((s) => s.investment_id === investmentId && s.is_active);

  const handleDeleteSip = async (sipId: string) => {
    try {
      const { error } = await financeDb.from("sip_configs").delete().eq("id", sipId);
      if (error) throw error;
      toast({ title: "SIP removed" });
      onRefreshComplete();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleRefreshAll = async () => {
    if (mutualFunds.length === 0) return;
    setRefreshing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const fund of mutualFunds) {
        const schemeCode = (fund as any).extra_configuration?.mf_scheme_code;
        if (!schemeCode) continue;

        try {
          // Fetch latest NAV
          const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}/latest`);
          if (!response.ok) { failCount++; continue; }
          const data = await response.json();
          if (!data?.data?.[0]?.nav) { failCount++; continue; }
          const latestNav = parseFloat(data.data[0].nav);

          // Get all transactions for this fund
          const fundTransactions = transactions.filter((t) => t.investment_id === fund.id);
          const sortedByDate = [...fundTransactions].sort(
            (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
          );
          const lastValueRecord = sortedByDate.find((t) => Number(t.current_value) > 0);

          let totalUnits = 0;

          // Fetch full historical NAV data
          let histNavMap: Record<string, number> = {};
          try {
            const histRes = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
            if (histRes.ok) {
              const histData = await histRes.json();
              for (const entry of histData.data || []) {
                const parts = entry.date.split("-");
                const key = `${parts[2]}-${parts[1]}-${parts[0]}`;
                histNavMap[key] = parseFloat(entry.nav);
              }
            }
          } catch { /* use fallback */ }

          const findClosestNav = (dateStr: string): number | null => {
            const targetDate = new Date(dateStr);
            let closest: number | null = null;
            let closestDiff = Infinity;
            for (const [key, nav] of Object.entries(histNavMap)) {
              const d = new Date(key);
              const diff = Math.abs(d.getTime() - targetDate.getTime());
              if (diff < closestDiff) { closestDiff = diff; closest = nav; }
            }
            return closest;
          };

          if (lastValueRecord) {
            // Compute units from last value record
            const prevNav = findClosestNav(lastValueRecord.transaction_date);
            if (prevNav && prevNav > 0) {
              totalUnits = Number(lastValueRecord.current_value) / prevNav;
            } else {
              totalUnits = Number(lastValueRecord.current_value) / latestNav;
            }

            // Account for buys AFTER the last value record
            const lastValueDate = new Date(lastValueRecord.transaction_date);
            const buysAfterLastValue = fundTransactions.filter((t) => {
              return Number(t.amount_invested) > 0 && new Date(t.transaction_date) > lastValueDate;
            });

            for (const buy of buysAfterLastValue) {
              const buyNav = findClosestNav(buy.transaction_date);
              if (buyNav && buyNav > 0) {
                totalUnits += Number(buy.amount_invested) / buyNav;
              } else {
                // Fallback: use latest NAV
                totalUnits += Number(buy.amount_invested) / latestNav;
              }
            }
          } else {
            // No value records, compute units from all buys
            for (const tx of fundTransactions) {
              if (Number(tx.amount_invested) > 0) {
                const txNav = findClosestNav(tx.transaction_date);
                if (txNav && txNav > 0) {
                  totalUnits += Number(tx.amount_invested) / txNav;
                } else {
                  totalUnits += Number(tx.amount_invested) / latestNav;
                }
              }
            }
          }

          const newCurrentValue = Math.round(totalUnits * latestNav * 100) / 100;

          const today = format(new Date(), "yyyy-MM-dd");

          // Check if a value record already exists for today
          const { data: existingRecords } = await financeDb
            .from("investment_transactions")
            .select("id")
            .eq("investment_id", fund.id)
            .eq("transaction_date", today)
            .eq("amount_invested", 0);

          if (existingRecords && existingRecords.length > 0) {
            // Update the first existing record and delete any extra duplicates
            const [keepRecord, ...extraRecords] = existingRecords;
            const { error } = await financeDb
              .from("investment_transactions")
              .update({ current_value: newCurrentValue })
              .eq("id", keepRecord.id);
            if (error) { failCount++; continue; }

            // Clean up duplicates
            for (const extra of extraRecords) {
              await financeDb.from("investment_transactions").delete().eq("id", extra.id);
            }
            successCount++;
          } else {
            // Insert new record for a new day
            const { error } = await financeDb.from("investment_transactions").insert({
              investment_id: fund.id,
              transaction_date: today,
              amount_invested: 0,
              current_value: newCurrentValue,
            });
            if (error) { failCount++; } else { successCount++; }
          }


        } catch {
          failCount++;
        }
      }

      toast({
        title: "NAV Refresh Complete",
        description: `Updated ${successCount} fund(s)${failCount > 0 ? `, ${failCount} failed` : ""}`,
        variant: failCount > 0 && successCount === 0 ? "destructive" : "default",
      });

      if (successCount > 0) onRefreshComplete();
    } catch (error: any) {
      toast({ title: "Error refreshing NAVs", description: error.message, variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  if (mutualFunds.length === 0) return null;

  const isPositiveTotal = summary.totalPL >= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Mutual Funds</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onAddSip}>
            <Plus className="h-4 w-4 mr-2" />
            Add SIP
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefreshAll} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh NAVs"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Overall XIRR</p>
            <p className={`text-lg font-bold mt-1 ${overallXirr !== null && overallXirr >= 0 ? "text-green-500" : "text-destructive"}`}>
              {overallXirr !== null ? `${(overallXirr * 100).toFixed(2)}%` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Individual Fund Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {mutualFunds.map((fund) => {
          const isPositive = fund.gain_loss >= 0;
          const sip = getSipForFund(fund.id);
          const xirr = fundXirr[fund.id];
          const nav = navData[fund.id];

          return (
            <Card key={fund.id} className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold leading-tight">{fund.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Invested</p>
                    <p className="font-semibold">{formatCurrency(fund.total_invested)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Current Value</p>
                    <p className="font-semibold">{formatCurrency(fund.current_value)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">P/L</p>
                    <p className={`font-semibold ${isPositive ? "text-green-500" : "text-destructive"}`}>
                      {isPositive ? "+" : ""}{formatCurrency(fund.gain_loss)} ({isPositive ? "+" : ""}{fund.gain_loss_percent.toFixed(2)}%)
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">XIRR</p>
                    <p className={`font-semibold ${xirr !== null && xirr >= 0 ? "text-green-500" : "text-destructive"}`}>
                      {xirr !== null ? `${(xirr * 100).toFixed(2)}%` : "—"}
                    </p>
                  </div>
                  {nav && (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground">Units</p>
                        <p className="font-semibold">{nav.units.toFixed(3)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">NAV</p>
                        <p className="font-semibold">₹{nav.nav.toFixed(2)}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* SIP Info */}
                {sip && (
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">SIP:</span>
                      <span className="font-medium">{formatCurrency(sip.amount)} on day {sip.sip_day}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteSip(sip.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MutualFundsList;
