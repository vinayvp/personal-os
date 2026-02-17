import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, RefreshCw, BarChart3, Calendar, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { financeDb } from "@/integrations/supabase/financeClient";
import { format } from "date-fns";
import { InvestmentWithLatest, InvestmentTransaction, SipConfig } from "./types";

interface MutualFundsListProps {
  investments: InvestmentWithLatest[];
  transactions: InvestmentTransaction[];
  sipConfigs: SipConfig[];
  onRefreshComplete: () => void;
  onAddSip: () => void;
}

const MutualFundsList = ({ investments, transactions, sipConfigs, onRefreshComplete, onAddSip }: MutualFundsListProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const mutualFunds = investments.filter((inv) => (inv as any).mf_scheme_code);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

  // Summary metrics
  const summary = useMemo(() => {
    const totalInvested = mutualFunds.reduce((s, f) => s + f.total_invested, 0);
    const totalCurrent = mutualFunds.reduce((s, f) => s + f.current_value, 0);
    const totalPL = totalCurrent - totalInvested;
    const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;
    return { totalInvested, totalCurrent, totalPL, totalPLPercent };
  }, [mutualFunds]);

  const getNavCount = (investmentId: string) =>
    transactions.filter((t) => t.investment_id === investmentId && Number(t.current_value) > 0 && Number(t.amount_invested) === 0).length;

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
        const schemeCode = (fund as any).mf_scheme_code;
        if (!schemeCode) continue;

        try {
          const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}/latest`);
          if (!response.ok) { failCount++; continue; }

          const data = await response.json();
          if (!data?.data?.[0]?.nav) { failCount++; continue; }

          const latestNav = parseFloat(data.data[0].nav);
          const fundTransactions = transactions.filter((t) => t.investment_id === fund.id);
          const sortedByDate = [...fundTransactions].sort(
            (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
          );
          const lastValueRecord = sortedByDate.find((t) => Number(t.current_value) > 0);

          let newCurrentValue: number;

          if (lastValueRecord) {
            const prevDate = lastValueRecord.transaction_date;
            try {
              const histRes = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
              if (histRes.ok) {
                const histData = await histRes.json();
                const prevDateObj = new Date(prevDate);
                let closestNav: number | null = null;
                let closestDiff = Infinity;

                for (const entry of histData.data || []) {
                  const parts = entry.date.split("-");
                  const entryDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                  const diff = Math.abs(entryDate.getTime() - prevDateObj.getTime());
                  if (diff < closestDiff) { closestDiff = diff; closestNav = parseFloat(entry.nav); }
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
            newCurrentValue = fund.total_invested;
          }

          const today = format(new Date(), "yyyy-MM-dd");
          const { error } = await financeDb.from("investment_transactions").insert({
            investment_id: fund.id,
            transaction_date: today,
            amount_invested: 0,
            current_value: Math.round(newCurrentValue * 100) / 100,
          });

          if (error) { failCount++; } else { successCount++; }
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
        <h2 className="text-xl font-semibold">Mutual Fund Investments</h2>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Invested</p>
                <p className="text-xl font-bold">{formatCurrency(summary.totalInvested)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="text-xl font-bold">{formatCurrency(summary.totalCurrent)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isPositiveTotal ? "bg-green-500/10" : "bg-destructive/10"}`}>
                {isPositiveTotal ? <TrendingUp className="w-5 h-5 text-green-500" /> : <TrendingDown className="w-5 h-5 text-destructive" />}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total P/L</p>
                <p className={`text-xl font-bold ${isPositiveTotal ? "text-green-500" : "text-destructive"}`}>
                  {isPositiveTotal ? "+" : ""}{formatCurrency(summary.totalPL)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isPositiveTotal ? "bg-green-500/10" : "bg-destructive/10"}`}>
                {isPositiveTotal ? <TrendingUp className="w-5 h-5 text-green-500" /> : <TrendingDown className="w-5 h-5 text-destructive" />}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">P/L %</p>
                <p className={`text-xl font-bold ${isPositiveTotal ? "text-green-500" : "text-destructive"}`}>
                  {isPositiveTotal ? "+" : ""}{summary.totalPLPercent.toFixed(2)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Fund Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {mutualFunds.map((fund) => {
          const isPositive = fund.gain_loss_percent >= 0;
          const navCount = getNavCount(fund.id);
          const sip = getSipForFund(fund.id);

          return (
            <Card key={fund.id} className="bg-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">{fund.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Scheme: {(fund as any).mf_scheme_code} • {navCount} NAV records
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`shrink-0 ${isPositive ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"}`}
                  >
                    {isPositive ? "+" : ""}{fund.gain_loss_percent.toFixed(2)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Invested</p>
                    <p className="font-semibold">{formatCurrency(fund.total_invested)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Current Value</p>
                    <p className="font-semibold">{formatCurrency(fund.current_value)}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Profit / Loss</p>
                    <p className={`font-semibold ${isPositive ? "text-green-500" : "text-destructive"}`}>
                      {isPositive ? "+" : ""}{formatCurrency(fund.gain_loss)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Returns</p>
                    <p className={`font-semibold ${isPositive ? "text-green-500" : "text-destructive"}`}>
                      {isPositive ? "+" : ""}{fund.gain_loss_percent.toFixed(2)}%
                    </p>
                  </div>
                </div>

                {/* SIP Info */}
                {sip && (
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Active SIP</p>
                          <p className="font-semibold text-sm">
                            {formatCurrency(sip.amount)} on day {sip.sip_day}
                          </p>
                        </div>
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
