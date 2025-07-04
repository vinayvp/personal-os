
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Trash2, Target, Calendar } from 'lucide-react';
import { format, isToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import type { Habit, HabitCompletion } from '../HabitTracker';

interface HabitDashboardProps {
  habits: Habit[];
  completions: HabitCompletion[];
  onToggleCompletion: (habitId: string, date: string) => void;
  onDeleteHabit: (habitId: string) => void;
}

const HabitDashboard = ({ habits, completions, onToggleCompletion, onDeleteHabit }: HabitDashboardProps) => {
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
    if (habit.frequency_type === 'daily') return 'Daily';
    if (habit.frequency_type === 'weekly') return 'Weekly';
    if (habit.frequency_type === 'custom' && habit.custom_days) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return habit.custom_days.map(day => dayNames[day]).join(', ');
    }
    return 'Custom';
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
    <div className="space-y-4">
      {habits.map((habit) => {
        const isCompleted = isHabitCompletedToday(habit.id);
        const streak = calculateStreak(habit.id);
        const progress = calculateProgress(habit);

        return (
          <Card key={habit.id} className="transition-all hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto"
                      onClick={() => onToggleCompletion(habit.id, today)}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-muted-foreground hover:text-primary" />
                      )}
                    </Button>
                    <div>
                      <CardTitle className={`text-lg ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        {habit.name}
                      </CardTitle>
                      {habit.goal && (
                        <p className="text-sm text-muted-foreground mt-1">{habit.goal}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      {getFrequencyDisplay(habit)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Target className="w-3 h-3 mr-1" />
                      {progress.completed}/{progress.target} this {habit.target_period.slice(0, -2)}
                    </Badge>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteHabit(habit.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{Math.round(progress.percentage)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{streak.current}</div>
                  <div className="text-xs text-muted-foreground">Current Streak</div>
                  <div className="text-xs text-muted-foreground">Best: {streak.longest}</div>
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
