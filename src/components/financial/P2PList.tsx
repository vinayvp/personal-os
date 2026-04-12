import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Landmark, RefreshCw, TrendingUp, Wallet, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { InvestmentTransaction, InvestmentWithLatest, InvestmentValuation } from "./types";
import UpdateP2PModal from "./UpdateP2PModal";

interface P2PListProps {
  investments: InvestmentWithLatest[];
  transactions: InvestmentTransaction[];
  valuations: InvestmentValuation[]; // Added valuations to props
  onRefreshComplete: () => void;
}

const P2PList = ({ investments, transactions, valuations, onRefreshComplete }: P2PListProps) => {
  const [selectedInvestment, setSelectedInvestment] = useState<InvestmentWithLatest | null>(null);

  // Auto-calculate ANR based on first transaction date
  const calculatePlatformANR = (inv: InvestmentWithLatest) => {
    if (inv.total_invested <= 0) return 0;
    
    const invTxs = transactions.filter(t => t.investment_id === inv.id);
    if (invTxs.length === 0) return 0;

    const earliestTx = invTxs.reduce((earliest, current) => 
      new Date(current.transaction_date) < new Date(earliest.transaction_date) ? current : earliest
    );

    const daysInvested = differenceInDays(new Date(), new Date(earliestTx.transaction_date)) || 1; 
    
    const absoluteReturn = (inv.gain_loss / inv.total_invested) * 100; 
    const anr = absoluteReturn * (365 / daysInvested);
    
    return anr;
  };

  const globalStats = useMemo(() => {
    let invested = 0;
    let current = 0;
    let weightedAnrSum = 0;
    let totalAnrWeight = 0;

    investments.forEach((inv) => {
      invested += inv.total_invested;
      current += inv.current_value;
      
      const platformANR = calculatePlatformANR(inv);
      if (inv.total_invested > 0) {
        weightedAnrSum += (platformANR * inv.total_invested);
        totalAnrWeight += inv.total_invested;
      }
    });

    const gainLoss = current - invested;
    const avgAnr = totalAnrWeight > 0 ? (weightedAnrSum / totalAnrWeight) : 0;

    return { invested, current, gainLoss, avgAnr };
  }, [investments, transactions]);

  if (investments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No P2P investments found. Add one to get started!
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="space-y-6">
      
      {/* Global Header & Separated Stat Cards */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Peer-to-Peer Lending</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border p-4 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Wallet className="w-4 h-4" /> Total Invested
            </div>
            <p className="text-xl font-bold">{formatCurrency(globalStats.invested)}</p>
          </Card>

          <Card className="bg-card border-border p-4 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Landmark className="w-4 h-4" /> Current Value
            </div>
            <p className="text-xl font-bold">{formatCurrency(globalStats.current)}</p>
          </Card>

          <Card className="bg-card border-border p-4 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" /> Total Gains
            </div>
            <p className={`text-xl font-bold ${globalStats.gainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {globalStats.gainLoss >= 0 ? '+' : ''}{formatCurrency(globalStats.gainLoss)}
            </p>
          </Card>

          <Card className="bg-card border-border p-4 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Activity className="w-4 h-4 text-primary" /> Avg. ANR
            </div>
            <p className="text-xl font-bold text-primary">{globalStats.avgAnr.toFixed(2)}%</p>
          </Card>
        </div>
      </div>

      {/* List of Individual P2P Platforms */}
      <div className="space-y-4 mt-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Platforms</h3>
        {investments.map((inv) => {
          
          // 1. Get latest transaction date
          const invTxs = transactions.filter(t => t.investment_id === inv.id);
          const latestTx = invTxs.length > 0 
            ? invTxs.reduce((latest, current) => new Date(current.transaction_date) > new Date(latest.transaction_date) ? current : latest)
            : null;
          const latestTxDate = latestTx ? new Date(latestTx.transaction_date) : null;

          // 2. Get latest valuation date and its metadata
          const invVals = valuations?.filter(v => v.investment_id === inv.id) || [];
          const latestVal = invVals.length > 0
            ? invVals.reduce((latest, current) => new Date(current.valuation_date) > new Date(latest.valuation_date) ? current : latest)
            : null;
          const latestValDate = latestVal ? new Date(latestVal.valuation_date) : null;

          // Extract metadata correctly from the valuation table
          const metadata = (latestVal?.metadata as any) || {};
          const principalOutstanding = Number(metadata.principal_outstanding) || 0;
          const receivedAmount = Number(metadata.received_amount) || 0;
          const bankBalance = Number(metadata.bank_balance) || 0;

          // 3. Logic for Outdated Warning
          // If a transaction occurred strictly AFTER the last valuation date, trigger warning
          const needsUpdateWarning = latestTxDate && latestValDate && latestTxDate > latestValDate;

          const anr = calculatePlatformANR(inv);

          return (
            <Card key={inv.id} className="bg-card border-border overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row items-center justify-between p-5 gap-6">
  
                  {/* Platform Name */}
                  <div className="flex items-center gap-3 w-full lg:w-48 shrink-0">
                    <div className="p-2.5 bg-primary/10 rounded-lg">
                      <Landmark className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="font-semibold text-base">{inv.name}</h4>
                  </div>

                  {/* Stats Container */}
                  <div className="flex-1 flex flex-wrap lg:flex-nowrap items-start justify-between gap-6 w-full">
                    
                    {/* Invested */}
                    <div className="flex flex-col">
                      <p className="text-muted-foreground text-xs mb-1">Invested</p>
                      <p className="font-medium text-base">{formatCurrency(inv.total_invested)}</p>
                      {latestTxDate && (
                        <p className="text-[10px] text-muted-foreground mt-1 tracking-wide">
                          Last Tx: {format(latestTxDate, 'dd MMM yyyy')}
                        </p>
                      )}
                    </div>

                    {/* Current Value & Horizontal Breakdown */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-muted-foreground text-xs">Current Value</p>
                        {/* WARNING BADGE */}
                        {needsUpdateWarning && (
                          <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-semibold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20" title="A transaction was added after your last valuation.">
                            <AlertTriangle className="w-3 h-3" /> Outdated
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-baseline gap-2 mb-1">
                        <p className="font-semibold text-base text-primary">{formatCurrency(inv.current_value)}</p>
                        {latestValDate && (
                          <p className="text-[10px] text-muted-foreground">
                            (As of {format(latestValDate, 'dd MMM')})
                          </p>
                        )}
                      </div>
                      
                      {/* Horizontal, compact breakdown */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          Prin: {formatCurrency(principalOutstanding)}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                          Rec: {formatCurrency(receivedAmount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                          Bank: {formatCurrency(bankBalance)}
                        </span>
                      </div>
                    </div>

                    {/* Total Gains */}
                    <div className="flex flex-col">
                      <p className="text-muted-foreground text-xs mb-1">Total Gains</p>
                      <p className={`font-medium text-base ${inv.gain_loss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {inv.gain_loss >= 0 ? '+' : ''}{formatCurrency(inv.gain_loss)}
                      </p>
                    </div>

                    {/* Platform ANR */}
                    <div className="flex flex-col">
                      <p className="text-muted-foreground text-xs mb-1">Platform ANR</p>
                      <p className={`font-medium text-base ${anr >= 0 ? 'text-primary' : 'text-red-500'}`}>
                        {anr.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* Update Action */}
                  <div className="w-full lg:w-auto shrink-0 flex justify-end">
                    <Button variant={needsUpdateWarning ? "default" : "outline"} size="sm" onClick={() => setSelectedInvestment(inv)}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Update
                    </Button>
                  </div>
                </div>  
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedInvestment && (
        <UpdateP2PModal
          open={!!selectedInvestment}
          onOpenChange={(open) => !open && setSelectedInvestment(null)}
          investment={selectedInvestment}
          onSuccess={() => {
            setSelectedInvestment(null);
            onRefreshComplete();
          }}
        />
      )}
    </div>
  );
};

export default P2PList;