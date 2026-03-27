import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Percent, Clock, TrendingUp, AlertCircle, Smartphone, Coins, LayoutGrid } from "lucide-react";
import { format, differenceInDays, isPast, isFuture } from "date-fns";
import { InvestmentTransaction, InvestmentWithLatest } from "./types";

interface FixedIncomeDetailsProps {
  investments: InvestmentWithLatest[];
  transactions: InvestmentTransaction[];
  title?: string;
  assetTypeFilter?: string;
}

interface TransactionWithDetails extends InvestmentTransaction {
  investment_name: string;
  asset_type_name: string;
  platform_name: string;
}

const FixedIncomeDetails = ({ investments, transactions, title = "Fixed Income Investments", assetTypeFilter }: FixedIncomeDetailsProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  const baseTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.maturity_date || t.interest_rate || t.tenure_months)
      .map((t) => {
        const inv = investments.find((i) => i.id === t.investment_id);
        return {
          ...t,
          investment_name: inv?.name || "Unknown",
          asset_type_name: inv?.asset_type?.name || "Unknown",
          platform_name: (inv as any)?.investment_platforms?.name || "Manual Entry",
        };
      })
      .filter((t) => !assetTypeFilter || t.asset_type_name.toLowerCase().includes(assetTypeFilter.toLowerCase()));
  }, [transactions, investments, assetTypeFilter]);

  const platforms = useMemo(() => {
    const names = baseTransactions.map(t => t.platform_name);
    return Array.from(new Set(names)).sort();
  }, [baseTransactions]);

  const filteredTransactions = useMemo(() => {
    if (selectedPlatform === "all") return baseTransactions;
    return baseTransactions.filter(t => t.platform_name === selectedPlatform);
  }, [baseTransactions, selectedPlatform]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateMaturityProgress = (transaction: TransactionWithDetails) => {
    if (!transaction.maturity_date || !transaction.transaction_date) return 0;
    const startDate = new Date(transaction.transaction_date);
    const maturityDate = new Date(transaction.maturity_date);
    const today = new Date();
    
    const totalDays = differenceInDays(maturityDate, startDate);
    const elapsedDays = differenceInDays(today, startDate);
    
    if (totalDays <= 0) return 100;
    return Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
  };

  const getDaysUntilMaturity = (maturityDate: string) => {
    const today = new Date();
    const maturity = new Date(maturityDate);
    return differenceInDays(maturity, today);
  };

  // UPDATED: Calculates both Current and Expected returns based on time elapsed
  const calculateReturns = (transaction: TransactionWithDetails) => {
    if (!transaction.interest_rate || !transaction.tenure_months || !transaction.transaction_date) return null;
    
    const principal = Math.abs(Number(transaction.amount_invested));
    const rate = Number(transaction.interest_rate) / 100;
    const years = Number(transaction.tenure_months) / 12;
    
    // Standard FD Compounding frequency is Quarterly (4 times a year)
    const compoundingFrequency = 4;
    
    // Compound Interest Formula: A = P(1 + r/n)^(nt)
    const maturityValue = principal * Math.pow((1 + rate / compoundingFrequency), compoundingFrequency * years);
    const expectedInterest = maturityValue - principal;
    
    let currentInterest = 0;
    let currentValue = principal;
    const startDate = new Date(transaction.transaction_date);
    const today = new Date();
    
    // Determine total duration
    let totalDays = years * 365.25;
    if (transaction.maturity_date) {
      const maturityDate = new Date(transaction.maturity_date);
      totalDays = differenceInDays(maturityDate, startDate);
    }
    
    const elapsedDays = Math.max(0, differenceInDays(today, startDate));
    
    if (elapsedDays >= totalDays && totalDays > 0) {
      // Reached or passed maturity
      currentInterest = expectedInterest;
      currentValue = maturityValue;
    } else if (totalDays > 0) {
      // Calculate compound interest exactly up to the current elapsed time
      const elapsedYears = elapsedDays / 365.25;
      currentValue = principal * Math.pow((1 + rate / compoundingFrequency), compoundingFrequency * elapsedYears);
      currentInterest = currentValue - principal;
    }

    return { 
      expectedInterest, 
      currentInterest,
      maturityValue,
      currentValue
    };
  };

  if (baseTransactions.length === 0) {
    return null;
  }

  // Summary stats calculations
  const totalFixedIncomeValue = filteredTransactions.reduce((sum, t) => sum + Math.abs(Number(t.amount_invested)), 0);
  
  // NEW: Summing up Current vs Expected
  const { totalExpectedGains, totalCurrentGains } = filteredTransactions.reduce((acc, t) => {
    const returns = calculateReturns(t);
    if (returns) {
      acc.totalExpectedGains += returns.expectedInterest;
      acc.totalCurrentGains += returns.currentInterest;
    }
    return acc;
  }, { totalExpectedGains: 0, totalCurrentGains: 0 });

  const upcomingMaturities = filteredTransactions.filter(
    (t) => t.maturity_date && isFuture(new Date(t.maturity_date)) && getDaysUntilMaturity(t.maturity_date) <= 90
  );
  const maturedTransactions = filteredTransactions.filter(
    (t) => t.maturity_date && isPast(new Date(t.maturity_date))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        
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
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex flex-col justify-center gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="w-4 h-4 text-primary" />
              <p className="text-xs">Total Principal</p>
            </div>
            <p className="text-lg font-bold">{formatCurrency(totalFixedIncomeValue)}</p>
          </CardContent>
        </Card>

        {/* UPDATED: Combined Current / Expected Card */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex flex-col justify-center gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Coins className="w-4 h-4 text-green-500" />
              <p className="text-xs">Gains (Current / Expected)</p>
            </div>
            <div className="flex items-baseline gap-1 flex-wrap">
              <p className="text-lg font-bold text-green-500">+{formatCurrency(totalCurrentGains)}</p>
              <p className="text-xs font-medium text-muted-foreground">/ +{formatCurrency(totalExpectedGains)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex flex-col justify-center gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4 text-amber-500" />
              <p className="text-xs">Maturing {'<'} 90 days</p>
            </div>
            <p className="text-lg font-bold">{upcomingMaturities.length} items</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex flex-col justify-center gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-4 h-4 text-green-500" />
              <p className="text-xs">Matured</p>
            </div>
            <p className="text-lg font-bold">{maturedTransactions.length} items</p>
          </CardContent>
        </Card>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground italic border border-dashed rounded-lg">
          No fixed income investments found for the selected platform.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTransactions.map((transaction) => {
            const returns = calculateReturns(transaction);
            const maturityProgress = calculateMaturityProgress(transaction);
            const daysUntilMaturity = transaction.maturity_date ? getDaysUntilMaturity(transaction.maturity_date) : null;
            const isMatured = daysUntilMaturity !== null && daysUntilMaturity < 0;
            const isMaturingSoon = daysUntilMaturity !== null && daysUntilMaturity >= 0 && daysUntilMaturity <= 30;
            const principal = Math.abs(Number(transaction.amount_invested));

            return (
              <Card key={transaction.id} className="bg-card border-border relative overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 bg-muted text-[10px] font-bold uppercase tracking-wider text-muted-foreground rounded-bl-lg flex items-center gap-1 z-10">
                  <Smartphone className="w-3 h-3" />
                  {transaction.platform_name}
                </div>

                <CardHeader className="pb-2 pt-5">
                  <div className="flex items-start justify-between pr-20">
                    <div>
                      <CardTitle className="text-base font-semibold">{transaction.investment_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {transaction.asset_type_name} • {format(new Date(transaction.transaction_date), "PP")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {isMatured && (
                      <Badge variant="default" className="bg-green-500">Matured</Badge>
                    )}
                    {isMaturingSoon && !isMatured && (
                      <Badge variant="default" className="bg-amber-500">Maturing Soon</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {transaction.interest_rate && (
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Interest Rate</p>
                          <p className="font-semibold">{Number(transaction.interest_rate).toFixed(2)}%</p>
                        </div>
                      </div>
                    )}
                    {transaction.tenure_months && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Tenure</p>
                          <p className="font-semibold">{transaction.tenure_months} months</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">Principal</p>
                    <p className="font-semibold">{formatCurrency(principal)}</p>
                  </div>

                  {/* UPDATED: 2x2 Grid for Current vs Expected Returns */}
                  {returns && (
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-2 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Current Gain</p>
                        <p className="font-semibold text-green-500">+{formatCurrency(returns.currentInterest)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Expected Gain</p>
                        <p className="font-semibold text-muted-foreground">+{formatCurrency(returns.expectedInterest)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Current Value</p>
                        <p className="font-semibold">{formatCurrency(returns.currentValue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Maturity Value</p>
                        <p className="font-semibold">{formatCurrency(returns.maturityValue)}</p>
                      </div>
                    </div>
                  )}

                  {transaction.maturity_date && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Maturity Date</span>
                        </div>
                        <span className="font-medium">{format(new Date(transaction.maturity_date), "PPP")}</span>
                      </div>
                      <Progress value={maturityProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-right">
                        {isMatured 
                          ? "Matured" 
                          : `${daysUntilMaturity} days remaining`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FixedIncomeDetails;