import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Dumbbell, Heart, Edit3 } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

interface DayRecord {
  id: string;
  date: string;
  gym_day: boolean;
  relief_day: boolean;
}

const CalendarView = () => {
  const [records, setRecords] = useState<DayRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_tracking')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load calendar data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRecordForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return records.find(record => record.date === dateString);
  };

  const toggleDay = async (date: Date, type: 'gym' | 'nonut') => {
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      const existingRecord = getRecordForDate(date);
      const newValue = type === 'gym' 
        ? !existingRecord?.gym_day 
        : !existingRecord?.relief_day;

      if (existingRecord) {
        // Update existing record
        const { error } = await supabase
          .from('daily_tracking')
          .update({
            [type === 'gym' ? 'gym_day' : 'relief_day']: newValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('daily_tracking')
          .insert({
            date: dateString,
            gym_day: type === 'gym' ? newValue : false,
            relief_day: type === 'nonut' ? newValue : false
          });

        if (error) throw error;
      }

      toast({
        title: "Updated!",
        description: `${type === 'gym' ? 'Gym' : 'NoNut'} day ${newValue ? 'marked' : 'unmarked'} for ${format(date, 'MMM d, yyyy')}.`,
      });

      fetchRecords();
      setEditingDate(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update tracking data.",
      });
    }
  };

  const getDaysToShow = () => {
    switch (viewMode) {
      case 'day':
        return [selectedDate];
      case 'week':
        return eachDayOfInterval({
          start: startOfWeek(selectedDate),
          end: endOfWeek(selectedDate)
        });
      case 'month':
        return eachDayOfInterval({
          start: startOfMonth(selectedDate),
          end: endOfMonth(selectedDate)
        });
      default:
        return [selectedDate];
    }
  };

  const renderDayCard = (date: Date) => {
    const record = getRecordForDate(date);
    const isToday = isSameDay(date, new Date());
    const dateString = format(date, 'yyyy-MM-dd');
    const isEditing = editingDate === dateString;
    const hasGym = record?.gym_day || false;
    const hasNoNut = record?.relief_day || false;
    const hasBoth = hasGym && hasNoNut;

    return (
      <Card key={date.toString()} className={`
        transition-all duration-200 
        ${isToday ? 'ring-2 ring-primary' : ''} 
        ${isEditing ? 'ring-2 ring-blue-500 border-blue-500' : 'border-border'}
      `}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex justify-between items-center">
            <span>
              {format(date, 'EEE, MMM d')}
              {isToday && <span className="ml-2 text-xs text-primary">(Today)</span>}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingDate(isEditing ? null : dateString)}
              className="h-6 w-6 p-0"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={hasGym ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleDay(date, 'gym')}
                  className="text-xs flex items-center gap-1"
                >
                  <Dumbbell className="w-3 h-3" />
                  Gym
                </Button>
                <Button
                  variant={hasNoNut ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleDay(date, 'nonut')}
                  className="text-xs flex items-center gap-1"
                >
                  <Heart className="w-3 h-3" />
                  NoNut
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingDate(null)}
                className="w-full text-xs"
              >
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {hasBoth ? (
                <div className="p-2 bg-gradient-to-r from-primary/20 to-destructive/20 rounded-lg border border-primary/30">
                  <div className="flex items-center justify-center gap-2 text-xs font-medium">
                    <div className="flex items-center gap-1 text-primary">
                      <Dumbbell className="w-3 h-3" />
                      <span>Gym</span>
                    </div>
                    <span className="text-muted-foreground">+</span>
                    <div className="flex items-center gap-1 text-destructive">
                      <Heart className="w-3 h-3" />
                      <span>NoNut</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {hasGym && (
                    <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium flex items-center gap-1 justify-center">
                      <Dumbbell className="w-3 h-3" />
                      Gym Day
                    </span>
                  )}
                  {hasNoNut && (
                    <span className="px-2 py-1 bg-destructive/20 text-destructive rounded-full text-xs font-medium flex items-center gap-1 justify-center">
                      <Heart className="w-3 h-3" />
                      NoNut Day
                    </span>
                  )}
                  {!hasGym && !hasNoNut && (
                    <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs text-center">
                      Rest Day
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" />
          Calendar View
        </h2>
        
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'day' | 'week' | 'month')}>
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="w-full"
              modifiers={{
                gymDay: (date) => {
                  const record = getRecordForDate(date);
                  return record?.gym_day || false;
                },
                noNutDay: (date) => {
                  const record = getRecordForDate(date);
                  return record?.relief_day || false;
                }
              }}
              modifiersStyles={{
                gymDay: {
                  backgroundColor: 'hsl(var(--primary) / 0.2)',
                  color: 'hsl(var(--primary))',
                  fontWeight: 'bold'
                },
                noNutDay: {
                  backgroundColor: 'hsl(var(--destructive) / 0.2)',
                  color: 'hsl(var(--destructive))',
                  fontWeight: 'bold'
                }
              }}
            />
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary/20 rounded"></div>
                <span>Gym Days</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-destructive/20 rounded"></div>
                <span>NoNut Days</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-primary/20 to-destructive/20 rounded border border-primary/30"></div>
                <span>Both Gym & NoNut</span>
              </div>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  💡 Click the edit icon on any day card to mark gym or NoNut days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {viewMode === 'day' && format(selectedDate, 'MMMM d, yyyy')}
              {viewMode === 'week' && `Week of ${format(startOfWeek(selectedDate), 'MMM d, yyyy')}`}
              {viewMode === 'month' && format(selectedDate, 'MMMM yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {getDaysToShow().map(renderDayCard)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalendarView;
