import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Wallet, Receipt, Briefcase, PieChart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import HeroMetrics from "@/components/financial/HeroMetrics";
import AssetAllocationChart from "@/components/financial/AssetAllocationChart";
import PerformanceLeaderboard from "@/components/financial/PerformanceLeaderboard";
import HistoricalChart from "@/components/financial/HistoricalChart";
import AddInvestmentModal from "@/components/financial/AddInvestmentModal";
import AddTransactionModal from "@/components/financial/AddTransactionModal";
import { 
  Investment, 
  InvestmentTransaction, 
  InvestmentWithLatest, 
  AssetType 
} from "@/components/financial/types";

const FinancialApp = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddInvestmentOpen, setIsAddInvestmentOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [investmentsRes, transactionsRes] = await Promise.all([
        supabase.from("investments").select("*").order("created_at", { ascending: false }),
        supabase.from("investment_transactions").select("*").order("transaction_date", { ascending: true }),
      ]);

      if (investmentsRes.error) throw investmentsRes.error;
      if (transactionsRes.error) throw transactionsRes.error;

      setInvestments((investmentsRes.data || []) as Investment[]);
      setTransactions((transactionsRes.data || []) as InvestmentTransaction[]);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate investment metrics with latest transaction values
  const investmentsWithMetrics = useMemo((): InvestmentWithLatest[] => {
    return investments.map((inv) => {
      const invTransactions = transactions.filter((t) => t.investment_id === inv.id);
      
      if (invTransactions.length === 0) {
        return {
          ...inv,
          total_invested: 0,
          current_value: 0,
          gain_loss: 0,
          gain_loss_percent: 0,
        };
      }

      // Get the latest transaction for current value
      const latestTransaction = invTransactions[invTransactions.length - 1];
      const totalInvested = Number(latestTransaction.amount_invested);
      const currentValue = Number(latestTransaction.current_value);
      const gainLoss = currentValue - totalInvested;
      const gainLossPercent = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

      return {
        ...inv,
        total_invested: totalInvested,
        current_value: currentValue,
        gain_loss: gainLoss,
        gain_loss_percent: gainLossPercent,
      };
    });
  }, [investments, transactions]);

  // Calculate portfolio totals
  const portfolioMetrics = useMemo(() => {
    const totalPortfolioValue = investmentsWithMetrics.reduce((sum, inv) => sum + inv.current_value, 0);
    const totalInvested = investmentsWithMetrics.reduce((sum, inv) => sum + inv.total_invested, 0);
    const totalGainLoss = totalPortfolioValue - totalInvested;
    const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    return {
      totalPortfolioValue,
      totalInvested,
      totalGainLoss,
      totalGainLossPercent,
    };
  }, [investmentsWithMetrics]);

  // Get unique asset types that have data
  const activeAssetTypes = useMemo(() => {
    return [...new Set(investments.map((inv) => inv.asset_type))] as AssetType[];
  }, [investments]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Financial Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track your investments and portfolio performance</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsAddInvestmentOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Investment
            </Button>
            <Button onClick={() => setIsAddTransactionOpen(true)} disabled={investments.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Log Transaction
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs defaultValue="portfolio" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="income" disabled className="gap-2">
              <Wallet className="w-4 h-4" />
              Income
            </TabsTrigger>
            <TabsTrigger value="expenses" disabled className="gap-2">
              <Receipt className="w-4 h-4" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="gap-2">
              <Briefcase className="w-4 h-4" />
              Portfolio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-8 mt-8">
            {investments.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-16">
                  <div className="text-center space-y-4">
                    <PieChart className="w-16 h-16 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-xl font-semibold">No investments yet</h3>
                      <p className="text-muted-foreground mt-2">
                        Start by adding your first investment to track your portfolio
                      </p>
                    </div>
                    <Button onClick={() => setIsAddInvestmentOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Investment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Hero Metrics */}
                <HeroMetrics {...portfolioMetrics} />

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AssetAllocationChart investments={investmentsWithMetrics} />
                  <PerformanceLeaderboard investments={investmentsWithMetrics.filter((i) => i.total_invested > 0)} />
                </div>

                {/* Historical Performance Charts */}
                {activeAssetTypes.length > 0 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Historical Performance by Asset Type</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {activeAssetTypes.map((assetType) => (
                        <HistoricalChart
                          key={assetType}
                          assetType={assetType}
                          investments={investments}
                          transactions={transactions}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="income">
            <Card className="bg-card border-border">
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground">Income tracking coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card className="bg-card border-border">
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground">Expense tracking coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <AddInvestmentModal
          open={isAddInvestmentOpen}
          onOpenChange={setIsAddInvestmentOpen}
          onSuccess={fetchData}
        />
        <AddTransactionModal
          open={isAddTransactionOpen}
          onOpenChange={setIsAddTransactionOpen}
          onSuccess={fetchData}
          investments={investments}
        />
      </div>
    </div>
  );
};

export default FinancialApp;
