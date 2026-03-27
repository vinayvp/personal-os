import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Percent, Clock, TrendingUp, AlertCircle, Smartphone } from "lucide-react";
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
  // Filter only transactions with fixed income details (those with maturity date or interest rate)
  const fixedIncomeTransactions: TransactionWithDetails[] = transactions
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

  if (fixedIncomeTransactions.length === 0) {
    return null;
  }

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

  const calculateExpectedReturn = (transaction: TransactionWithDetails) => {
    if (!transaction.interest_rate || !transaction.tenure_months) return null;
    const principal = Math.abs(Number(transaction.amount_invested));
    const rate = Number(transaction.interest_rate) / 100;
    const years = Number(transaction.tenure_months) / 12;
    // Simple interest calculation
    const interest = principal * rate * years;
    return { interest, maturityValue: principal + interest };
  };

  // Summary stats
  const totalFixedIncomeValue = fixedIncomeTransactions.reduce((sum, t) => sum + Math.abs(Number(t.amount_invested)), 0);
  const upcomingMaturities = fixedIncomeTransactions.filter(
    (t) => t.maturity_date && isFuture(new Date(t.maturity_date)) && getDaysUntilMaturity(t.maturity_date) <= 90
  );
  const maturedTransactions = fixedIncomeTransactions.filter(
    (t) => t.maturity_date && isPast(new Date(t.maturity_date))
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Fixed Income</p>
              <p className="text-xl font-bold">{formatCurrency(totalFixedIncomeValue)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Maturing in 90 days</p>
              <p className="text-xl font-bold">{upcomingMaturities.length} transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <AlertCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Matured</p>
              <p className="text-xl font-bold">{maturedTransactions.length} transactions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Transaction Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {fixedIncomeTransactions.map((transaction) => {
          const expectedReturn = calculateExpectedReturn(transaction);
          const maturityProgress = calculateMaturityProgress(transaction);
          const daysUntilMaturity = transaction.maturity_date ? getDaysUntilMaturity(transaction.maturity_date) : null;
          const isMatured = daysUntilMaturity !== null && daysUntilMaturity < 0;
          const isMaturingSoon = daysUntilMaturity !== null && daysUntilMaturity >= 0 && daysUntilMaturity <= 30;
          const principal = Math.abs(Number(transaction.amount_invested));

          return (
            <Card key={transaction.id} className="bg-card border-border relative overflow-hidden">
              
              {/* PLATFORM BADGE ADDED HERE */}
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
                {/* Status Badges moved slightly below title for better layout with platform badge */}
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
                {/* Key Metrics */}
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

                {/* Principal Amount */}
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">Principal</p>
                  <p className="font-semibold">{formatCurrency(principal)}</p>
                </div>

                {/* Expected Return */}
                {expectedReturn && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Expected Interest</p>
                      <p className="font-semibold text-green-500">+{formatCurrency(expectedReturn.interest)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Maturity Value</p>
                      <p className="font-semibold">{formatCurrency(expectedReturn.maturityValue)}</p>
                    </div>
                  </div>
                )}

                {/* Maturity Progress */}
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
    </div>
  );
};

export default FixedIncomeDetails;