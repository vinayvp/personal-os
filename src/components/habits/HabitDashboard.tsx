import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Trash2, Target, Calendar, Edit2, Plus, Minus } from 'lucide-react';
import { format, isToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import type { Habit, HabitCompletion } from '../HabitTracker';

interface HabitDashboardProps {
  habits: Habit[];
  completions: HabitCompletion[];
  onToggleCompletion: (habitId: string, date: string, forceAdd?: boolean) => void;
  onDeleteHabit: (habitId: string) => void;
  onEditHabit: (habit: Habit) => void;
}

const HabitDashboard = ({ habits, completions, onToggleCompletion, onDeleteHabit, onEditHabit }: HabitDashboardProps) => {
  const today = format(new Date(), 'yyyy-MM-dd');

  const isHabitCompletedToday = (habitId: string) => {
    return completions.some(c => c.habit_id === habitId && c.completion_date === today);
  };

  const calculateStreak = (habitId: string) => {
    const habitCompletions = completions
      .filter(c => c.habit_id === habitId)
      .map(c => new Date(c.completion_date))
      .sort((a, b) => b.getTime() - a.getTime());

    if (habitCompletions.length === 0) return { current: 0, longest: 0 };

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Check if today is completed for current streak
    let checkDate = new Date(currentDate);
    let streakBroken = false;

    for (let i = 0; i < habitCompletions.length + 30; i++) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const isCompleted = habitCompletions.some(d => 
        format(d, 'yyyy-MM-dd') === dateStr
      );

      if (isCompleted) {
        if (!streakBroken) currentStreak++;
        tempStreak++;
      } else {
        if (!streakBroken) streakBroken = true;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        tempStreak = 0;
      }

      checkDate.setDate(checkDate.getDate() - 1);
    }

    if (tempStreak > longestStreak) longestStreak = tempStreak;

    return { current: currentStreak, longest: longestStreak };
  };

  const calculateProgress = (habit: Habit) => {
    // For "total" target period (no frequency), count all completions
    if (habit.target_period === 'total' || habit.frequency_type === 'none') {
      const totalCompletions = completions.filter(c => c.habit_id === habit.id).length;
      return {
        completed: totalCompletions,
        target: habit.target_count,
        percentage: Math.min((totalCompletions / habit.target_count) * 100, 100)
      };
    }

    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    switch (habit.target_period) {
      case 'weekly':
        periodStart = startOfWeek(now);
        periodEnd = endOfWeek(now);
        break;
      case 'monthly':
        periodStart = startOfMonth(now);
        periodEnd = endOfMonth(now);
        break;
      case 'yearly':
        periodStart = startOfYear(now);
        periodEnd = endOfYear(now);
        break;
      default:
        periodStart = startOfWeek(now);
        periodEnd = endOfWeek(now);
    }

    const completionsInPeriod = completions.filter(c => {
      if (c.habit_id !== habit.id) return false;
      const completionDate = new Date(c.completion_date);
      return completionDate >= periodStart && completionDate <= periodEnd;
    }).length;

    return {
      completed: completionsInPeriod,
      target: habit.target_count,
      percentage: Math.min((completionsInPeriod / habit.target_count) * 100, 100)
    };
  };

  const getFrequencyDisplay = (habit: Habit) => {
    if (habit.frequency_type === 'none') return 'Total Goal';
    if (habit.frequency_type === 'daily') return 'Daily';
    if (habit.frequency_type === 'weekly') return 'Weekly';
    if (habit.frequency_type === 'custom' && habit.custom_days) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return habit.custom_days.map(day => dayNames[day]).join(', ');
    }
    return 'Custom';
  };

  const getProgressLabel = (habit: Habit, progress: { completed: number; target: number }) => {
    if (habit.target_period === 'total' || habit.frequency_type === 'none') {
      return `${progress.completed}/${progress.target} total`;
    }
    const periodLabel = habit.target_period.slice(0, -2); // weekly -> week, monthly -> month
    return `${progress.completed}/${progress.target} this ${periodLabel}`;
  };

  if (habits.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No habits yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first habit to start building better routines
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2.5 md:space-y-4">
      {habits.map((habit) => {
        const isCompleted = isHabitCompletedToday(habit.id);
        const streak = calculateStreak(habit.id);
        const progress = calculateProgress(habit);
        const todayCompletions = completions.filter(c => c.habit_id === habit.id && c.completion_date === today).length;
        const isNoFrequencyHabit = habit.frequency_type === 'none';
        const canAddMore = isNoFrequencyHabit && progress.completed < progress.target;

        return (
          <Card key={habit.id} className="transition-all hover:shadow-md">
            <CardHeader className="p-3 md:p-6 pb-2 md:pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
                    {isNoFrequencyHabit ? (
                      <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-6 w-6 md:h-8 md:w-8"
                          onClick={() => onToggleCompletion(habit.id, today, false)}
                          disabled={todayCompletions === 0}
                        >
                          <Minus className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground hover:text-destructive" />
                        </Button>
                        <div 
                          className="flex items-center justify-center min-w-[2rem] md:min-w-[2.5rem] h-6 md:h-8 px-1.5 md:px-2 rounded-md font-semibold text-xs md:text-sm"
                          style={{ 
                            backgroundColor: `${habit.color || '#3B82F6'}20`,
                            color: habit.color || '#3B82F6'
                          }}
                        >
                          {progress.completed}/{progress.target}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-6 w-6 md:h-8 md:w-8"
                          onClick={() => onToggleCompletion(habit.id, today, true)}
                          disabled={!canAddMore}
                        >
                          <Plus className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground hover:text-green-500" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto shrink-0"
                        onClick={() => onToggleCompletion(habit.id, today)}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                        ) : (
                          <div className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6">
                            <span 
                              className="material-icons text-base md:text-lg hover:text-primary" 
                              style={{ color: habit.color || '#3B82F6' }}
                            >
                              {habit.icon || 'radio_button_checked'}
                            </span>
                          </div>
                        )}
                      </Button>
                    )}
                    <div className="min-w-0 flex-1">
                      <CardTitle className={`text-sm md:text-lg truncate ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        {habit.name}
                      </CardTitle>
                      {habit.goal && (
                        <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1 line-clamp-1">{habit.goal}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 md:gap-2 mt-1.5 md:mt-0">
                    <Badge variant="outline" className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                      <Calendar className="w-2.5 h-2.5 md:w-3 md:h-3 mr-0.5 md:mr-1" />
                      {getFrequencyDisplay(habit)}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                      <Target className="w-2.5 h-2.5 md:w-3 md:h-3 mr-0.5 md:mr-1" />
                      {getProgressLabel(habit, progress)}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-0.5 md:gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditHabit(habit)}
                    className="text-muted-foreground hover:text-foreground h-7 w-7 md:h-8 md:w-8 p-0"
                  >
                    <Edit2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteHabit(habit.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 md:h-8 md:w-8 p-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-3 md:p-6 pt-0">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1.5 md:space-y-2">
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{Math.round(progress.percentage)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 md:h-2">
                    <div
                      className="h-1.5 md:h-2 rounded-full transition-all"
                      style={{ 
                        width: `${progress.percentage}%`,
                        backgroundColor: habit.color || '#3B82F6'
                      }}
                    />
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold" style={{ color: habit.color || '#3B82F6' }}>
                    {streak.current}
                  </div>
                  <div className="text-[10px] md:text-xs text-muted-foreground">Current Streak</div>
                  <div className="text-[10px] md:text-xs text-muted-foreground">Best: {streak.longest}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default HabitDashboard;
