import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Percent, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { format, differenceInDays, isPast, isFuture } from "date-fns";
import { InvestmentWithLatest } from "./types";

interface FixedIncomeDetailsProps {
  investments: InvestmentWithLatest[];
}

const FixedIncomeDetails = ({ investments }: FixedIncomeDetailsProps) => {
  // Filter only fixed income investments (those with maturity date or interest rate)
  const fixedIncomeInvestments = investments.filter(
    (inv) => inv.maturity_date || inv.interest_rate || inv.tenure_months
  );

  if (fixedIncomeInvestments.length === 0) {
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

  const calculateMaturityProgress = (inv: InvestmentWithLatest) => {
    if (!inv.maturity_date || !inv.created_at) return 0;
    const startDate = new Date(inv.created_at);
    const maturityDate = new Date(inv.maturity_date);
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

  const calculateExpectedReturn = (inv: InvestmentWithLatest) => {
    if (!inv.interest_rate || !inv.tenure_months) return null;
    const principal = inv.total_invested;
    const rate = Number(inv.interest_rate) / 100;
    const years = Number(inv.tenure_months) / 12;
    // Simple interest calculation
    const interest = principal * rate * years;
    return { interest, maturityValue: principal + interest };
  };

  // Summary stats
  const totalFixedIncomeValue = fixedIncomeInvestments.reduce((sum, inv) => sum + inv.current_value, 0);
  const upcomingMaturities = fixedIncomeInvestments.filter(
    (inv) => inv.maturity_date && isFuture(new Date(inv.maturity_date)) && getDaysUntilMaturity(inv.maturity_date) <= 90
  );
  const maturedInvestments = fixedIncomeInvestments.filter(
    (inv) => inv.maturity_date && isPast(new Date(inv.maturity_date))
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Fixed Income Investments</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Fixed Income</p>
                <p className="text-xl font-bold">{formatCurrency(totalFixedIncomeValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Maturing in 90 days</p>
                <p className="text-xl font-bold">{upcomingMaturities.length} investments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <AlertCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Matured</p>
                <p className="text-xl font-bold">{maturedInvestments.length} investments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Investment Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {fixedIncomeInvestments.map((inv) => {
          const expectedReturn = calculateExpectedReturn(inv);
          const maturityProgress = calculateMaturityProgress(inv);
          const daysUntilMaturity = inv.maturity_date ? getDaysUntilMaturity(inv.maturity_date) : null;
          const isMatured = daysUntilMaturity !== null && daysUntilMaturity < 0;
          const isMaturingSoon = daysUntilMaturity !== null && daysUntilMaturity >= 0 && daysUntilMaturity <= 30;

          return (
            <Card key={inv.id} className="bg-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">{inv.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {inv.asset_type?.name}
                    </p>
                  </div>
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
                  {inv.interest_rate && (
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Interest Rate</p>
                        <p className="font-semibold">{Number(inv.interest_rate).toFixed(2)}%</p>
                      </div>
                    </div>
                  )}
                  {inv.tenure_months && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tenure</p>
                        <p className="font-semibold">{inv.tenure_months} months</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Invested & Current Value */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Invested</p>
                    <p className="font-semibold">{formatCurrency(inv.total_invested)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Current Value</p>
                    <p className="font-semibold">{formatCurrency(inv.current_value)}</p>
                  </div>
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
                {inv.maturity_date && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Maturity Date</span>
                      </div>
                      <span className="font-medium">{format(new Date(inv.maturity_date), "PPP")}</span>
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