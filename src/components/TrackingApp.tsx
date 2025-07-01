
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Dumbbell, Heart, Home, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import CalendarView from './CalendarView';
import AddTrackerModal from './AddTrackerModal';

interface DayRecord {
  id: string;
  date: string;
  gym_day: boolean;
  relief_day: boolean;
  custom_trackers?: Record<string, boolean>;
}

interface CustomTracker {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const TrackingApp = () => {
  const [todayRecord, setTodayRecord] = useState<DayRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<DayRecord[]>([]);
  const [stats, setStats] = useState({ gymDays: 0, noNutDays: 0, totalDays: 0 });
  const [customTrackers, setCustomTrackers] = useState<CustomTracker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    fetchData();
    loadCustomTrackers();
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

  const loadCustomTrackers = () => {
    const saved = localStorage.getItem('customTrackers');
    if (saved) {
      try {
        setCustomTrackers(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading custom trackers:', error);
      }
    }
  };

  const saveCustomTrackers = (trackers: CustomTracker[]) => {
    localStorage.setItem('customTrackers', JSON.stringify(trackers));
    setCustomTrackers(trackers);
  };

  const handleAddTracker = (tracker: { name: string; icon: string; color: string }) => {
    const newTracker: CustomTracker = {
      id: Date.now().toString(),
      ...tracker
    };
    const updatedTrackers = [...customTrackers, newTracker];
    saveCustomTrackers(updatedTrackers);
  };

  const handleDeleteTracker = (trackerId: string) => {
    const updatedTrackers = customTrackers.filter(t => t.id !== trackerId);
    saveCustomTrackers(updatedTrackers);
    
    // Also remove from all records
    const updatedRecords = recentRecords.map(record => {
      if (record.custom_trackers && record.custom_trackers[trackerId]) {
        const { [trackerId]: removed, ...rest } = record.custom_trackers;
        return { ...record, custom_trackers: rest };
      }
      return record;
    });
    setRecentRecords(updatedRecords);
    
    // Update today's record if it has this tracker
    if (todayRecord?.custom_trackers?.[trackerId]) {
      const { [trackerId]: removed, ...rest } = todayRecord.custom_trackers;
      setTodayRecord({ ...todayRecord, custom_trackers: rest });
    }

    toast({
      title: "Tracker Deleted",
      description: "Custom tracker has been removed.",
    });
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

  const toggleCustomTracker = async (trackerId: string) => {
    try {
      const currentValue = todayRecord?.custom_trackers?.[trackerId] || false;
      const newValue = !currentValue;
      
      const updatedCustomTrackers = {
        ...todayRecord?.custom_trackers,
        [trackerId]: newValue
      };

      if (todayRecord) {
        // Update existing record with custom trackers
        const { error } = await supabase
          .from('daily_tracking')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('id', todayRecord.id);

        if (error) throw error;

        // Update local state
        setTodayRecord({
          ...todayRecord,
          custom_trackers: updatedCustomTrackers
        });
      } else {
        // Create new record with custom tracker
        const { data, error } = await supabase
          .from('daily_tracking')
          .insert({
            date: today,
            gym_day: false,
            relief_day: false
          })
          .select()
          .single();

        if (error) throw error;

        setTodayRecord({
          ...data,
          custom_trackers: updatedCustomTrackers
        });
      }

      // Save to localStorage for persistence
      const allRecords = JSON.parse(localStorage.getItem('customTrackerRecords') || '{}');
      if (!allRecords[today]) {
        allRecords[today] = {};
      }
      allRecords[today][trackerId] = newValue;
      localStorage.setItem('customTrackerRecords', JSON.stringify(allRecords));

      const trackerName = customTrackers.find(t => t.id === trackerId)?.name || 'Tracker';
      toast({
        title: "Updated!",
        description: `${trackerName} ${newValue ? 'marked' : 'unmarked'} for today.`,
      });

      fetchData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update custom tracker.",
      });
    }
  };

  // Load custom tracker data from localStorage
  const getCustomTrackerValue = (trackerId: string, date?: string) => {
    const targetDate = date || today;
    const allRecords = JSON.parse(localStorage.getItem('customTrackerRecords') || '{}');
    return allRecords[targetDate]?.[trackerId] || false;
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
          <TabsList className="grid w-full grid-cols-2">
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
            {/* Add Tracker Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Manage Trackers</CardTitle>
                  <AddTrackerModal onTrackerAdded={handleAddTracker} />
                </div>
              </CardHeader>
              {customTrackers.length > 0 && (
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {customTrackers.map((tracker) => (
                      <div
                        key={tracker.id}
                        className="p-3 border rounded-lg text-center relative group"
                        style={{ borderColor: tracker.color + '40' }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDeleteTracker(tracker.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                        <div className="text-lg mb-1">{tracker.icon}</div>
                        <div className="text-sm font-medium" style={{ color: tracker.color }}>
                          {tracker.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Today's Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Calendar className="w-5 h-5 text-primary" />
                  Today - {format(new Date(), 'MMM d, yyyy')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Default Trackers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                      variant={todayRecord?.gym_day ? "default" : "outline"}
                      size="lg"
                      onClick={() => toggleDay('gym')}
                      className="h-20 flex flex-col gap-2"
                    >
                      <Dumbbell className="w-6 h-6 sm:w-8 sm:h-8" />
                      <span className="text-sm font-medium">
                        {todayRecord?.gym_day ? 'Gym Day ✓' : 'Mark Gym Day'}
                      </span>
                    </Button>
                    
                    <Button
                      variant={todayRecord?.relief_day ? "default" : "outline"}
                      size="lg"
                      onClick={() => toggleDay('nonut')}
                      className="h-20 flex flex-col gap-2"
                    >
                      <Heart className="w-6 h-6 sm:w-8 sm:h-8" />
                      <span className="text-sm font-medium">
                        {todayRecord?.relief_day ? 'NoNut Day ✓' : 'Mark NoNut Day'}
                      </span>
                    </Button>
                  </div>

                  {/* Custom Trackers */}
                  {customTrackers.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {customTrackers.map((tracker) => {
                        const isActive = getCustomTrackerValue(tracker.id);
                        return (
                          <Button
                            key={tracker.id}
                            variant={isActive ? "default" : "outline"}
                            size="lg"
                            onClick={() => toggleCustomTracker(tracker.id)}
                            className="h-20 flex flex-col gap-2"
                            style={isActive ? { backgroundColor: tracker.color, borderColor: tracker.color } : { borderColor: tracker.color + '40' }}
                          >
                            <span className="text-2xl">{tracker.icon}</span>
                            <span className="text-xs font-medium">
                              {isActive ? `${tracker.name} ✓` : `Mark ${tracker.name}`}
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">{stats.gymDays}</div>
                    <p className="text-sm text-muted-foreground">Total Gym Days</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-destructive">{stats.noNutDays}</div>
                    <p className="text-sm text-muted-foreground">Total NoNut Days</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
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
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentRecords.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium text-foreground text-sm sm:text-base">
                          {format(new Date(record.date), 'MMM d, yyyy')}
                        </span>
                        <div className="flex gap-2 flex-wrap">
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
                          {customTrackers.map(tracker => {
                            if (getCustomTrackerValue(tracker.id, record.date)) {
                              return (
                                <span 
                                  key={tracker.id}
                                  className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                                  style={{ backgroundColor: tracker.color + '20', color: tracker.color }}
                                >
                                  <span>{tracker.icon}</span>
                                  <span className="hidden sm:inline">{tracker.name}</span>
                                </span>
                              );
                            }
                            return null;
                          })}
                          {!record.gym_day && !record.relief_day && !customTrackers.some(t => getCustomTrackerValue(t.id, record.date)) && (
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
            <CalendarView customTrackers={customTrackers} getCustomTrackerValue={getCustomTrackerValue} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TrackingApp;
