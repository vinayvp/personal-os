import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Wallet, Receipt, Briefcase, PieChart, TrendingUp } from "lucide-react";
import { financeDb } from "@/integrations/supabase/financeClient";
import { useToast } from "@/hooks/use-toast";
import HeroMetrics from "@/components/financial/HeroMetrics";
import AssetAllocationChart from "@/components/financial/AssetAllocationChart";
import PortfolioHistoricalChart from "@/components/financial/PortfolioHistoricalChart";
import InvestmentsList from "@/components/financial/InvestmentsList";
import MutualFundsList from "@/components/financial/MutualFundsList";
import HistoricalChart from "@/components/financial/HistoricalChart";
import FixedIncomeDetails from "@/components/financial/FixedIncomeDetails";
import CryptoList from "@/components/financial/CryptoList";
import P2PList from "@/components/financial/P2PList";
import AddInvestmentModal from "@/components/financial/AddInvestmentModal";
import AddTransactionModal from "@/components/financial/AddTransactionModal";
import AddAssetTypeModal from "@/components/financial/AddAssetTypeModal";
import RecordValueModal from "@/components/financial/RecordValueModal";
import AddSipModal from "@/components/financial/AddSipModal";
import PageLoader from "@/components/common/PageLoader";
import RefreshButton from "@/components/common/RefreshButton";
import { 
  Investment, 
  InvestmentTransaction, 
  InvestmentWithLatest, 
  AssetType,
  SipConfig,
  InvestmentValuation
} from "@/components/financial/types";

const FinancialApp = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [valuations, setValuations] = useState<InvestmentValuation[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [sipConfigs, setSipConfigs] = useState<SipConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddInvestmentOpen, setIsAddInvestmentOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isAddAssetTypeOpen, setIsAddAssetTypeOpen] = useState(false);
  const [isRecordValueOpen, setIsRecordValueOpen] = useState(false);
  const [isAddSipOpen, setIsAddSipOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [investmentsRes, transactionsRes, assetTypesRes, sipRes, valuationsRes] = await Promise.all([
        financeDb
          .from("investments")
          .select(`
            *, 
            asset_type:asset_types(*),
            investment_platforms(*) 
          `)
          .order("created_at", { ascending: false }),
        
        financeDb.from("investment_transactions").select("*").order("transaction_date", { ascending: true }),
        financeDb.from("asset_types").select("*").order("name", { ascending: true }),
        financeDb.from("sip_configs").select("*").order("created_at", { ascending: false }),
        financeDb.from("investment_valuations").select("*").order("valuation_date", { ascending: true }),
      ]);

      if (investmentsRes.error) throw investmentsRes.error;
      if (transactionsRes.error) throw transactionsRes.error;
      if (assetTypesRes.error) throw assetTypesRes.error;
      if (sipRes.error) throw sipRes.error;
      if (valuationsRes.error) throw valuationsRes.error;

      setInvestments((investmentsRes.data || []) as Investment[]);
      setTransactions((transactionsRes.data || []) as InvestmentTransaction[]);
      setAssetTypes((assetTypesRes.data || []) as AssetType[]);
      setSipConfigs((sipRes.data || []) as SipConfig[]);
      setValuations((valuationsRes.data || []) as InvestmentValuation[]);
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

  // Calculate investment metrics using the new transaction-level valuation logic
  const investmentsWithMetrics = useMemo((): InvestmentWithLatest[] => {
    return investments.map((inv) => {
      const invTransactions = transactions.filter((t) => t.investment_id === inv.id);
      const invValuations = valuations.filter((v) => v.investment_id === inv.id);
      
      const totalInvested = invTransactions.reduce((sum, t) => sum + Number(t.amount_invested), 0);

      if (invTransactions.length === 0) {
        return {
          ...inv,
          total_invested: 0,
          current_value: 0,
          gain_loss: 0,
          gain_loss_percent: 0,
        };
      }
      
      // Sort chronologically (oldest to newest)
      const chronologicalValuations = [...invValuations].sort(
        (a, b) => new Date(a.valuation_date).getTime() - new Date(b.valuation_date).getTime()
      );

      // Track the latest known valuation for each entity (transaction or pooled investment)
      const latestValuationsMap = new Map<string, number>();

      let currentValue = totalInvested; // Fallback to invested amount if no valuations exist

      if (chronologicalValuations.length > 0) {
        chronologicalValuations.forEach((v) => {
          // If transaction_id exists (FDs/Bonds), map by transaction. Otherwise, map by investment_id (Mutual Funds)
          const key = v.transaction_id || v.investment_id;
          latestValuationsMap.set(key, Number(v.current_value));
        });

        // Sum up the latest snapshots
        currentValue = 0;
        latestValuationsMap.forEach((value) => {
          currentValue += value;
        });
      }
      
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
  }, [investments, transactions, valuations]);

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
    const activeIds = [...new Set(investments.map((inv) => inv.asset_type_id))];
    return assetTypes.filter((at) => activeIds.includes(at.id));
  }, [investments, assetTypes]);

  // ... Rest of the component remains exactly the same
  if (loading) {
    return (
      <PageLoader message="Loading your portfolio..." />
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
          <RefreshButton onRefresh={fetchData} />
        </div>

        {/* Navigation Tabs with Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <Tabs defaultValue="portfolio" className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setIsAddAssetTypeOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Asset Type
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsAddInvestmentOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Investment
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsAddTransactionOpen(true)} disabled={investments.length === 0}>
                  <Plus className="w-4 h-4 mr-2" />
                  Transaction
                </Button>
                <Button size="sm" onClick={() => setIsRecordValueOpen(true)} disabled={investments.length === 0}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Record Value
                </Button>
              </div>
            </div>

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
                  <AssetAllocationChart investments={investmentsWithMetrics} assetTypes={assetTypes} />
                  {/* <PerformanceLeaderboard investments={investmentsWithMetrics.filter((i) => i.total_invested > 0)} /> */}
                  <PortfolioHistoricalChart investments={investments} transactions={transactions} valuations={valuations} />
                </div>

                {/* All Investments List */}
                <InvestmentsList investments={investmentsWithMetrics.filter((i) => i.total_invested > 0)} />

                {/* Asset Type Details Section */}
                <Card className="bg-card border-border">
                  <CardContent className="p-0">
                    <Tabs defaultValue="mutual-funds" className="w-full">
                      <div className="border-b border-border px-5 pt-4 pb-4 overflow-x-auto">
                        <TabsList className="w-full max-w-3xl grid grid-cols-5 min-w-[600px]">
                          <TabsTrigger value="mutual-funds">Mutual Funds</TabsTrigger>
                          <TabsTrigger value="crypto">Crypto</TabsTrigger>
                          <TabsTrigger value="fixed-deposits">Fixed Deposits</TabsTrigger>
                          <TabsTrigger value="bonds">Bonds</TabsTrigger>
                          <TabsTrigger value="p2p">P2P</TabsTrigger>
                        </TabsList>
                      </div>
                      <TabsContent value="mutual-funds" className="m-0 p-4">
                        <MutualFundsList 
                          investments={investmentsWithMetrics.filter((i) => i.total_invested > 0)} 
                          transactions={transactions}
                          valuations={valuations}
                          sipConfigs={sipConfigs}
                          onRefreshComplete={fetchData}
                          onAddSip={() => setIsAddSipOpen(true)}
                        />
                      </TabsContent>
                      <TabsContent value="crypto" className="m-0 p-4">
                        <CryptoList
                          investments={investmentsWithMetrics.filter((i) => i.total_invested > 0)}
                          transactions={transactions}
                          valuations={valuations}
                          onRefreshComplete={fetchData}
                        />
                      </TabsContent>
                      <TabsContent value="fixed-deposits" className="m-0 p-4">
                        <FixedIncomeDetails 
                          investments={investmentsWithMetrics} 
                          transactions={transactions} 
                          valuations={valuations}
                          title="Fixed Deposits" assetTypeFilter="fixed deposit"
                          onRefreshComplete={fetchData} />
                      </TabsContent>
                      <TabsContent value="bonds" className="m-0 p-4">
                        <FixedIncomeDetails 
                          investments={investmentsWithMetrics} 
                          transactions={transactions} 
                          valuations={valuations}
                          title="Bonds" assetTypeFilter="bond"
                          onRefreshComplete={fetchData} />
                      </TabsContent>
                      <TabsContent value="p2p" className="m-0 p-4">
                        <P2PList 
                          investments={investmentsWithMetrics.filter((i) => i.asset_type?.name.toLowerCase().includes("p2p"))}
                          transactions={transactions}
                          valuations={valuations}
                          onRefreshComplete={fetchData}
                        />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Historical Performance Charts */}
                {activeAssetTypes.length > 0 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Historical Performance by Asset Type</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {activeAssetTypes.map((assetType) => (
                        <HistoricalChart
                          key={assetType.id}
                          assetType={assetType}
                          investments={investments}
                          transactions={transactions}
                          valuations={valuations}
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
        </div>

        {/* Modals */}
        <AddAssetTypeModal
          open={isAddAssetTypeOpen}
          onOpenChange={setIsAddAssetTypeOpen}
          onSuccess={fetchData}
        />
        <AddInvestmentModal
          open={isAddInvestmentOpen}
          onOpenChange={setIsAddInvestmentOpen}
          onSuccess={fetchData}
          assetTypes={assetTypes}
        />
        <AddTransactionModal
          open={isAddTransactionOpen}
          onOpenChange={setIsAddTransactionOpen}
          onSuccess={fetchData}
          investments={investments}
          assetTypes={assetTypes}
        />
        <RecordValueModal
          open={isRecordValueOpen}
          onOpenChange={setIsRecordValueOpen}
          onSuccess={fetchData}
          investments={investments}
        />
        <AddSipModal
          open={isAddSipOpen}
          onOpenChange={setIsAddSipOpen}
          onSuccess={fetchData}
          investments={investments}
        />
      </div>
    </div>
  );
};

export default FinancialApp;