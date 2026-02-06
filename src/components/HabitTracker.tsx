
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
import EditHabitModal from './habits/EditHabitModal';

export interface Habit {
  id: string;
  name: string;
  goal?: string;
  frequency_type: 'daily' | 'weekly' | 'custom' | 'none';
  target_count: number;
  target_period: 'weekly' | 'monthly' | 'yearly' | 'total';
  custom_days?: number[];
  icon?: string;
  color?: string;
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
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
      // Type assertion to ensure compatibility with our Habit interface
      setHabits((data || []) as Habit[]);
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
      setCompletions((data || []) as HabitCompletion[]);
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
      
      setHabits(prev => [data as Habit, ...prev]);
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

  const handleEditHabit = async (habitId: string, habitData: Omit<Habit, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .update(habitData)
        .eq('id', habitId)
        .select()
        .single();

      if (error) throw error;
      
      setHabits(prev => prev.map(h => h.id === habitId ? data as Habit : h));
      setIsEditModalOpen(false);
      setEditingHabit(null);
      
      toast({
        title: "Success",
        description: "Habit updated successfully!",
      });
    } catch (error) {
      console.error('Error updating habit:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update habit.",
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

  const handleOpenEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setIsEditModalOpen(true);
  };

  const handleToggleCompletion = async (habitId: string, date: string, forceAdd?: boolean) => {
    try {
      const habit = habits.find(h => h.id === habitId);
      const existingCompletions = completions.filter(c => 
        c.habit_id === habitId && c.completion_date === date
      );

      // For habits with no frequency, allow multiple completions up to target_count
      if (habit && habit.frequency_type === 'none') {
        const totalCompletions = completions.filter(c => c.habit_id === habitId).length;
        
        if (forceAdd === false && existingCompletions.length > 0) {
          // Remove last completion for today
          const lastCompletion = existingCompletions[existingCompletions.length - 1];
          const { error } = await supabase
            .from('habit_completions')
            .delete()
            .eq('id', lastCompletion.id);

          if (error) throw error;
          setCompletions(prev => prev.filter(c => c.id !== lastCompletion.id));
        } else if (totalCompletions < habit.target_count) {
          // Add new completion
          const { data, error } = await supabase
            .from('habit_completions')
            .insert({
              habit_id: habitId,
              completion_date: date
            })
            .select()
            .single();

          if (error) throw error;
          setCompletions(prev => [...prev, data as HabitCompletion]);
        }
      } else {
        // Standard toggle behavior for regular habits
        const existing = existingCompletions[0];

        if (existing) {
          const { error } = await supabase
            .from('habit_completions')
            .delete()
            .eq('id', existing.id);

          if (error) throw error;
          setCompletions(prev => prev.filter(c => c.id !== existing.id));
        } else {
          const { data, error } = await supabase
            .from('habit_completions')
            .insert({
              habit_id: habitId,
              completion_date: date
            })
            .select()
            .single();

          if (error) throw error;
          setCompletions(prev => [...prev, data as HabitCompletion]);
        }
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
      <div className="max-w-6xl mx-auto p-3 md:p-4">
        <div className="flex items-center justify-between gap-2 mb-4 md:mb-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-3xl font-bold text-foreground truncate">Habit Tracker</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Build better habits, one day at a time</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="flex items-center gap-1.5 text-xs md:text-sm px-2.5 md:px-4 shrink-0">
            <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">New Habit</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-9 md:h-10">
            <TabsTrigger value="dashboard" className="flex items-center gap-1.5 text-xs md:text-sm px-2 md:px-3">
              <Settings className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-1.5 text-xs md:text-sm px-2 md:px-3">
              <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-1.5 text-xs md:text-sm px-2 md:px-3">
              <BarChart3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Statistics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <HabitDashboard
              habits={habits}
              completions={completions}
              onToggleCompletion={handleToggleCompletion}
              onDeleteHabit={handleDeleteHabit}
              onEditHabit={handleOpenEditModal}
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

        <EditHabitModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onEditHabit={handleEditHabit}
          habit={editingHabit}
        />
      </div>
    </div>
  );
};

export default HabitTracker;
