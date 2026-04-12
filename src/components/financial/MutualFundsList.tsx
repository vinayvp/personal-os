import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Calendar, 
  Trash2, 
  Plus, 
  LayoutGrid, 
  Smartphone,
  AlertTriangle // <-- Added AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { financeDb } from "@/integrations/supabase/financeClient";
import { format } from "date-fns";
import { InvestmentWithLatest, InvestmentTransaction, InvestmentValuation, SipConfig } from "./types";
import { calculateXIRR, buildCashFlows } from "./xirr";

interface MutualFundsListProps {
  investments: InvestmentWithLatest[];
  transactions: InvestmentTransaction[];
  valuations: InvestmentValuation[];
  sipConfigs: SipConfig[];
  onRefreshComplete: () => void;
  onAddSip: () => void;
}

interface FundNavData {
  nav: number;
  units: number;
}

const MutualFundsList = ({ investments, transactions, valuations, sipConfigs, onRefreshComplete, onAddSip }: MutualFundsListProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const [navData, setNavData] = useState<Record<string, FundNavData>>({});
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const { toast } = useToast();

  // 1. Filter for Mutual Funds first
  const allMutualFunds = useMemo(() => {
    return investments.filter((inv) => {
      const assetTypeName = (inv as any).asset_types?.name || (inv as any).asset_type?.name;
      return assetTypeName?.toLowerCase() === "Mutual Funds".toLowerCase();
    });
  }, [investments]);

  // NEW: Per-fund XIRR Calculation
  const fundXirr = useMemo(() => {
    const result: Record<string, number | null> = {};
    allMutualFunds.forEach((fund) => {
      const fundTx = transactions.filter((t) => t.investment_id === fund.id);
      const cashFlows = buildCashFlows(fundTx, fund.current_value);
      result[fund.id] = calculateXIRR(cashFlows);
    });
    return result;
  }, [allMutualFunds, transactions]);

  // Calculate the most recent sync date for mutual funds globally
  const lastSyncDate = useMemo(() => {
    if (!valuations || valuations.length === 0 || allMutualFunds.length === 0) return null;
    
    const mfIds = new Set(allMutualFunds.map(f => f.id));
    const relevantVals = valuations.filter(v => mfIds.has(v.investment_id));
    
    if (relevantVals.length === 0) return null;

    const latest = relevantVals.reduce((max, current) => 
      new Date(current.valuation_date) > new Date(max.valuation_date) ? current : max
    );

    return new Date(latest.valuation_date);
  }, [valuations, allMutualFunds]);

  // 2. Get unique platforms for the filter dropdown
  const platforms = useMemo(() => {
    const names = allMutualFunds.map(f => (f as any).investment_platforms?.name || "Unknown");
    return Array.from(new Set(names)).sort();
  }, [allMutualFunds]);

  // 3. Apply platform filter
  const filteredFunds = useMemo(() => {
    if (selectedPlatform === "all") return allMutualFunds;
    return allMutualFunds.filter(f => ((f as any).investment_platforms?.name || "Unknown") === selectedPlatform);
  }, [allMutualFunds, selectedPlatform]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

  // Fetch current NAVs
  useEffect(() => {
    const fetchNavs = async () => {
      const data: Record<string, FundNavData> = {};
      for (const fund of allMutualFunds) {
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
    if (allMutualFunds.length > 0) fetchNavs();
  }, [allMutualFunds]);

  // Summary metrics (calculated based on FILTERED funds)
  const summary = useMemo(() => {
    const totalInvested = filteredFunds.reduce((s, f) => s + f.total_invested, 0);
    const totalCurrent = filteredFunds.reduce((s, f) => s + f.current_value, 0);
    const totalPL = totalCurrent - totalInvested;
    const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;
    
    // Overall XIRR for filtered view
    const filteredTx = filteredFunds.flatMap((fund) =>
      transactions.filter((t) => t.investment_id === fund.id)
    );
    const overallXirr = calculateXIRR(buildCashFlows(filteredTx, totalCurrent));

    return { totalInvested, totalCurrent, totalPL, totalPLPercent, overallXirr };
  }, [filteredFunds, transactions]);

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
    if (allMutualFunds.length === 0) return;
    setRefreshing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const fund of allMutualFunds) {
        const schemeCode = (fund as any).extra_configuration?.mf_scheme_code;
        if (!schemeCode) continue;

        try {
          // Fetch latest NAV
          const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}/latest`);
          if (!response.ok) { failCount++; continue; }
          const data = await response.json();
          if (!data?.data?.[0]?.nav) { failCount++; continue; }
          const latestNav = parseFloat(data.data[0].nav);

          // Get all transactions and valuations for this fund
          const fundTransactions = transactions.filter((t) => t.investment_id === fund.id);
          const fundValuations = valuations.filter((v) => v.investment_id === fund.id);
          const sortedValuations = [...fundValuations].sort(
            (a, b) => new Date(b.valuation_date).getTime() - new Date(a.valuation_date).getTime()
          );
          const lastValuation = sortedValuations[0];

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

          if (lastValuation) {
            // Compute units from last valuation
            const prevNav = findClosestNav(lastValuation.valuation_date);
            if (prevNav && prevNav > 0) {
              totalUnits = Number(lastValuation.current_value) / prevNav;
            } else {
              totalUnits = Number(lastValuation.current_value) / latestNav;
            }

            // Account for buys AFTER the last valuation
            const lastValDate = new Date(lastValuation.valuation_date);
            const buysAfterLastValue = fundTransactions.filter((t) => {
              return Number(t.amount_invested) > 0 && new Date(t.transaction_date) > lastValDate;
            });

            for (const buy of buysAfterLastValue) {
              const buyNav = findClosestNav(buy.transaction_date);
              if (buyNav && buyNav > 0) {
                totalUnits += Number(buy.amount_invested) / buyNav;
              } else {
                totalUnits += Number(buy.amount_invested) / latestNav;
              }
            }
          } else {
            // No valuations, compute units from all buys
            for (const tx of fundTransactions) {
              if (Number(tx.amount_invested) > 0) {
                const txNav = findClosestNav(tx.transaction_date);
                if (txNav && txNav > 0) {
                  let units = (Number(tx.amount_invested) / txNav).toFixed(3);
                  totalUnits += Number(units);
                } else {
                  totalUnits += Number(tx.amount_invested) / latestNav;
                }
              }
            }
          }

          const roundedUnits = Number(totalUnits.toFixed(3));
          const newCurrentValue = Number((roundedUnits * latestNav).toFixed(3));
          const today = format(new Date(), "yyyy-MM-dd");

          // Upsert into investment_valuations
          const { data: existingVal } = await financeDb
            .from("investment_valuations")
            .select("id")
            .eq("investment_id", fund.id)
            .eq("valuation_date", today);

          if (existingVal && existingVal.length > 0) {
            const { error } = await financeDb
              .from("investment_valuations")
              .update({ current_value: newCurrentValue })
              .eq("id", existingVal[0].id);
            if (error) { failCount++; continue; }
            successCount++;
          } else {
            const { error } = await financeDb.from("investment_valuations").insert({
              investment_id: fund.id,
              valuation_date: today,
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

  if (allMutualFunds.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Mutual Funds</h2>
          <p className="text-sm text-muted-foreground">Managing {filteredFunds.length} investments</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Last Sync Timestamp */}
          {lastSyncDate && (
            <div className="text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-md border border-border/50">
              Last sync: <span className="font-medium text-foreground">{format(lastSyncDate, 'dd MMM yyyy')}</span>
            </div>
          )}

          {/* PLATFORM FILTER */}
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-[180px] bg-background">
              <LayoutGrid className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {platforms.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

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
        <Card className="bg-card border-border"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Invested</p><p className="text-lg font-bold mt-1">{formatCurrency(summary.totalInvested)}</p></CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Current Value</p><p className="text-lg font-bold mt-1">{formatCurrency(summary.totalCurrent)}</p></CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-4"><p className="text-xs text-muted-foreground">P/L</p><p className={`text-lg font-bold mt-1 ${summary.totalPL >= 0 ? "text-green-500" : "text-destructive"}`}>{formatCurrency(summary.totalPL)}</p></CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-4"><p className="text-xs text-muted-foreground">P/L %</p><p className={`text-lg font-bold mt-1 ${summary.totalPL >= 0 ? "text-green-500" : "text-destructive"}`}>{summary.totalPLPercent.toFixed(2)}%</p></CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Overall XIRR</p><p className={`text-lg font-bold mt-1 ${summary.overallXirr && summary.overallXirr >= 0 ? "text-green-500" : "text-destructive"}`}>{summary.overallXirr ? `${(summary.overallXirr * 100).toFixed(2)}%` : "—"}</p></CardContent></Card>
      </div>

      {/* Individual Fund Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredFunds.map((fund) => {
          const isPositive = fund.gain_loss >= 0;
          const sip = getSipForFund(fund.id);
          const platformName = (fund as any).investment_platforms?.name || "Manual Entry";
          const nav = navData[fund.id];
          const xirr = fundXirr[fund.id];

          // Find the latest transaction date for this specific fund
          const fundTransactions = transactions.filter(t => t.investment_id === fund.id);
          const latestTx = fundTransactions.length > 0 
            ? fundTransactions.reduce((latest, current) => new Date(current.transaction_date) > new Date(latest.transaction_date) ? current : latest)
            : null;
          const latestTxDate = latestTx ? new Date(latestTx.transaction_date) : null;

          // Find the latest valuation date for this specific fund
          const fundVals = valuations.filter(v => v.investment_id === fund.id);
          const latestVal = fundVals.length > 0
            ? fundVals.reduce((latest, current) => new Date(current.valuation_date) > new Date(latest.valuation_date) ? current : latest)
            : null;
          const latestValDate = latestVal ? new Date(latestVal.valuation_date) : null;

          // Check if there's a transaction AFTER the last valuation
          const needsUpdateWarning = latestTxDate && latestValDate && latestTxDate > latestValDate;

          return (
            <Card key={fund.id} className="bg-card border-border relative overflow-hidden">
              {/* Platform Ribbon/Badge */}
              <div className="absolute top-0 right-0 px-3 py-1 bg-muted text-[10px] font-bold uppercase tracking-wider text-muted-foreground rounded-bl-lg flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                {platformName}
              </div>

              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold leading-tight pr-20">{fund.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  
                  {/* Invested Section with Last Investment Date */}
                  <div>
                    <p className="text-xs text-muted-foreground">Invested</p>
                    <p className="font-semibold">{formatCurrency(fund.total_invested)}</p>
                    {latestTxDate && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wide">
                        Last Tx: {format(latestTxDate, 'dd MMM yyyy')}
                      </p>
                    )}
                  </div>

                  {/* Current Value Section with WARNING and As Of Date */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs text-muted-foreground">Current Value</p>
                      {/* NEW: WARNING BADGE */}
                      {needsUpdateWarning && (
                        <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-semibold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20" title="A transaction was added after your last valuation. Click Refresh NAVs to update.">
                          <AlertTriangle className="w-3 h-3" /> Outdated
                        </span>
                      )}
                    </div>
                    <p className="font-semibold">{formatCurrency(fund.current_value)}</p>
                    {latestValDate && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wide">
                        As of: {format(latestValDate, 'dd MMM')}
                      </p>
                    )}
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
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">NAV (Units)</p>
                      <p className="font-semibold">₹{nav.nav.toFixed(2)} ({nav.units.toFixed(3)})</p>
                    </div>
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
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:text-destructive" onClick={() => handleDeleteSip(sip.id)}>
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