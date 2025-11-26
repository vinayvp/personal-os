import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AddFinancialSnapshotModal from "@/components/financial/AddFinancialSnapshotModal";
import FinancialPieChart from "@/components/financial/FinancialPieChart";
import FinancialTrendChart from "@/components/financial/FinancialTrendChart";
import FinancialSummary from "@/components/financial/FinancialSummary";
import InvestmentDiversification from "@/components/financial/InvestmentDiversification";
import InvestmentGrowthChart from "@/components/financial/InvestmentGrowthChart";

interface FinancialSnapshot {
  id: string;
  date: string;
  salary: number;
  created_at: string;
  updated_at: string;
}

interface FinancialBreakdown {
  id: string;
  snapshot_id: string;
  category: 'expense' | 'investment' | 'savings';
  name: string;
  amount: number;
  current_value: number | null;
  created_at: string;
}

const FinancialApp = () => {
  const [snapshots, setSnapshots] = useState<FinancialSnapshot[]>([]);
  const [breakdowns, setBreakdowns] = useState<FinancialBreakdown[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSnapshots();
    fetchBreakdowns();
  }, []);

  const fetchSnapshots = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_snapshots')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      setSnapshots(data || []);
      if (data && data.length > 0 && !selectedSnapshot) {
        setSelectedSnapshot(data[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching snapshots",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBreakdowns = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_breakdown')
        .select('*');

      if (error) throw error;

      setBreakdowns((data || []) as FinancialBreakdown[]);
    } catch (error: any) {
      toast({
        title: "Error fetching breakdown",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSnapshotAdded = () => {
    fetchSnapshots();
    fetchBreakdowns();
  };

  const handleDeleteSnapshot = async (id: string) => {
    try {
      const { error } = await supabase
        .from('financial_snapshots')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Snapshot deleted successfully",
      });

      fetchSnapshots();
      fetchBreakdowns();
    } catch (error: any) {
      toast({
        title: "Error deleting snapshot",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const currentSnapshot = snapshots.find(s => s.id === selectedSnapshot);
  const currentBreakdowns = breakdowns.filter(b => b.snapshot_id === selectedSnapshot);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Financial Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track your salary, expenses, and investments</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Snapshot
          </Button>
        </div>

        {snapshots.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <PieChartIcon className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">No financial data yet</h3>
                  <p className="text-muted-foreground">Add your first snapshot to get started</p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Snapshot
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {snapshots.map((snapshot) => (
                <Button
                  key={snapshot.id}
                  variant={selectedSnapshot === snapshot.id ? "default" : "outline"}
                  onClick={() => setSelectedSnapshot(snapshot.id)}
                  className="whitespace-nowrap"
                >
                  {new Date(snapshot.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </Button>
              ))}
            </div>

            {currentSnapshot && (
              <>
                <FinancialSummary
                  snapshot={currentSnapshot}
                  breakdowns={currentBreakdowns}
                  onDelete={() => handleDeleteSnapshot(currentSnapshot.id)}
                />

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5" />
                        Current Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FinancialPieChart
                        salary={currentSnapshot.salary}
                        breakdowns={currentBreakdowns}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Trend Over Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FinancialTrendChart
                        snapshots={snapshots}
                        breakdowns={breakdowns}
                      />
                    </CardContent>
                  </Card>
                </div>

                <InvestmentDiversification breakdowns={currentBreakdowns} />
                
                <InvestmentGrowthChart 
                  snapshots={snapshots}
                  breakdowns={breakdowns}
                />
              </>
            )}
          </>
        )}

        <AddFinancialSnapshotModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onSuccess={handleSnapshotAdded}
        />
      </div>
    </div>
  );
};

export default FinancialApp;
