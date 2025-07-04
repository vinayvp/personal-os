
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Calendar, BarChart3, Plus, Settings } from 'lucide-react';
import HabitDashboard from './habits/HabitDashboard';
import HabitCalendar from './habits/HabitCalendar';
import HabitStats from './habits/HabitStats';
import CreateHabitModal from './habits/CreateHabitModal';

export interface Habit {
  id: string;
  name: string;
  goal?: string;
  frequency_type: 'daily' | 'weekly' | 'custom';
  target_count: number;
  target_period: 'weekly' | 'monthly' | 'yearly';
  custom_days?: number[];
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_at: string;
  completion_date: string;
}

const HabitTracker = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchHabits();
    fetchCompletions();
  }, []);

  const fetchHabits = async () => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHabits(data || []);
    } catch (error) {
      console.error('Error fetching habits:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load habits.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompletions = async () => {
    try {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .order('completion_date', { ascending: false });

      if (error) throw error;
      setCompletions(data || []);
    } catch (error) {
      console.error('Error fetching completions:', error);
    }
  };

  const handleCreateHabit = async (habitData: Omit<Habit, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .insert(habitData)
        .select()
        .single();

      if (error) throw error;
      
      setHabits(prev => [data, ...prev]);
      setIsCreateModalOpen(false);
      
      toast({
        title: "Success",
        description: "Habit created successfully!",
      });
    } catch (error) {
      console.error('Error creating habit:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create habit.",
      });
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId);

      if (error) throw error;
      
      setHabits(prev => prev.filter(h => h.id !== habitId));
      setCompletions(prev => prev.filter(c => c.habit_id !== habitId));
      
      toast({
        title: "Success",
        description: "Habit deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete habit.",
      });
    }
  };

  const handleToggleCompletion = async (habitId: string, date: string) => {
    try {
      const existing = completions.find(c => 
        c.habit_id === habitId && c.completion_date === date
      );

      if (existing) {
        // Remove completion
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        setCompletions(prev => prev.filter(c => c.id !== existing.id));
      } else {
        // Add completion
        const { data, error } = await supabase
          .from('habit_completions')
          .insert({
            habit_id: habitId,
            completion_date: date
          })
          .select()
          .single();

        if (error) throw error;
        setCompletions(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update habit completion.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Habit Tracker</h1>
            <p className="text-muted-foreground">Build better habits, one day at a time</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Habit
          </Button>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Statistics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <HabitDashboard
              habits={habits}
              completions={completions}
              onToggleCompletion={handleToggleCompletion}
              onDeleteHabit={handleDeleteHabit}
            />
          </TabsContent>

          <TabsContent value="calendar">
            <HabitCalendar
              habits={habits}
              completions={completions}
              onToggleCompletion={handleToggleCompletion}
            />
          </TabsContent>

          <TabsContent value="stats">
            <HabitStats
              habits={habits}
              completions={completions}
            />
          </TabsContent>
        </Tabs>

        <CreateHabitModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateHabit={handleCreateHabit}
        />
      </div>
    </div>
  );
};

export default HabitTracker;
