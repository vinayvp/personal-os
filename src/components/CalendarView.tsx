
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Dumbbell, Heart } from 'lucide-react';
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

    return (
      <Card key={date.toString()} className={`${isToday ? 'ring-2 ring-primary' : ''}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {format(date, 'EEE, MMM d')}
            {isToday && <span className="ml-2 text-xs text-primary">(Today)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {record?.gym_day && (
              <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium flex items-center gap-1">
                <Dumbbell className="w-3 h-3" />
                Gym
              </span>
            )}
            {record?.relief_day && (
              <span className="px-2 py-1 bg-destructive/20 text-destructive rounded-full text-xs font-medium flex items-center gap-1">
                <Heart className="w-3 h-3" />
                NoNut
              </span>
            )}
            {!record?.gym_day && !record?.relief_day && (
              <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs">
                Rest Day
              </span>
            )}
          </div>
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
