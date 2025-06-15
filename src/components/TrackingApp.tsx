
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Dumbbell, Heart, Home } from 'lucide-react';
import { format } from 'date-fns';
import CalendarView from './CalendarView';

interface DayRecord {
  id: string;
  date: string;
  gym_day: boolean;
  relief_day: boolean;
}

const TrackingApp = () => {
  const [todayRecord, setTodayRecord] = useState<DayRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<DayRecord[]>([]);
  const [stats, setStats] = useState({ gymDays: 0, noNutDays: 0, totalDays: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch today's record
      const { data: todayData } = await supabase
        .from('daily_tracking')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      setTodayRecord(todayData);

      // Fetch recent records (last 7 days)
      const { data: recentData } = await supabase
        .from('daily_tracking')
        .select('*')
        .order('date', { ascending: false })
        .limit(7);

      setRecentRecords(recentData || []);

      // Calculate stats
      const { data: allData } = await supabase
        .from('daily_tracking')
        .select('*');

      if (allData) {
        const gymDays = allData.filter(record => record.gym_day).length;
        const noNutDays = allData.filter(record => record.relief_day).length;
        setStats({ gymDays, noNutDays, totalDays: allData.length });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load tracking data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDay = async (type: 'gym' | 'nonut') => {
    try {
      const newValue = type === 'gym' 
        ? !todayRecord?.gym_day 
        : !todayRecord?.relief_day;

      if (todayRecord) {
        // Update existing record
        const { error } = await supabase
          .from('daily_tracking')
          .update({
            [type === 'gym' ? 'gym_day' : 'relief_day']: newValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', todayRecord.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('daily_tracking')
          .insert({
            date: today,
            gym_day: type === 'gym' ? newValue : false,
            relief_day: type === 'nonut' ? newValue : false
          });

        if (error) throw error;
      }

      toast({
        title: "Updated!",
        description: `${type === 'gym' ? 'Gym' : 'NoNut'} day ${newValue ? 'marked' : 'unmarked'} for today.`,
      });

      fetchData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update tracking data.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your tracking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 glass-card">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Today's Tracking */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Calendar className="w-5 h-5 text-primary" />
                  Today - {format(new Date(), 'MMM d, yyyy')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    variant={todayRecord?.gym_day ? "secondary" : "outline"}
                    size="lg"
                    onClick={() => toggleDay('gym')}
                    className={`h-20 flex flex-col gap-2 transition-all duration-200 ${
                      todayRecord?.gym_day 
                        ? 'bg-secondary/80 text-secondary-foreground hover:bg-secondary' 
                        : 'glass-button hover:bg-white/10 focus:bg-white/10 focus:ring-2 focus:ring-primary focus:ring-offset-2'
                    }`}
                  >
                    <Dumbbell className="w-6 h-6 sm:w-8 sm:h-8" />
                    <span className="text-sm font-medium">
                      {todayRecord?.gym_day ? 'Gym Day ✓' : 'Mark Gym Day'}
                    </span>
                  </Button>
                  
                  <Button
                    variant={todayRecord?.relief_day ? "secondary" : "outline"}
                    size="lg"
                    onClick={() => toggleDay('nonut')}
                    className={`h-20 flex flex-col gap-2 transition-all duration-200 ${
                      todayRecord?.relief_day 
                        ? 'bg-secondary/80 text-secondary-foreground hover:bg-secondary' 
                        : 'glass-button hover:bg-white/10 focus:bg-white/10 focus:ring-2 focus:ring-primary focus:ring-offset-2'
                    }`}
                  >
                    <Heart className="w-6 h-6 sm:w-8 sm:h-8" />
                    <span className="text-sm font-medium">
                      {todayRecord?.relief_day ? 'NoNut Day ✓' : 'Mark NoNut Day'}
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">{stats.gymDays}</div>
                    <p className="text-sm text-muted-foreground">Total Gym Days</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-destructive">{stats.noNutDays}</div>
                    <p className="text-sm text-muted-foreground">Total NoNut Days</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">{stats.totalDays}</div>
                    <p className="text-sm text-muted-foreground">Days Tracked</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            {recentRecords.length > 0 && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentRecords.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 glass rounded-lg">
                        <span className="font-medium text-foreground text-sm sm:text-base">
                          {format(new Date(record.date), 'MMM d, yyyy')}
                        </span>
                        <div className="flex gap-2">
                          {record.gym_day && (
                            <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium flex items-center gap-1">
                              <Dumbbell className="w-3 h-3" />
                              <span className="hidden sm:inline">Gym</span>
                            </span>
                          )}
                          {record.relief_day && (
                            <span className="px-2 py-1 bg-destructive/20 text-destructive rounded-full text-xs font-medium flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              <span className="hidden sm:inline">NoNut</span>
                            </span>
                          )}
                          {!record.gym_day && !record.relief_day && (
                            <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs">
                              Rest Day
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TrackingApp;
