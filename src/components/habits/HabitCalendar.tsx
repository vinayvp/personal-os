
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle } from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import type { Habit, HabitCompletion } from '../HabitTracker';

interface HabitCalendarProps {
  habits: Habit[];
  completions: HabitCompletion[];
  onToggleCompletion: (habitId: string, date: string) => void;
}

const HabitCalendar = ({ habits, completions, onToggleCompletion }: HabitCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHabit, setSelectedHabit] = useState<string>('all');

  const getCompletionsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return completions.filter(c => c.completion_date === dateStr);
  };

  const isHabitCompletedOnDate = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return completions.some(c => c.habit_id === habitId && c.completion_date === dateStr);
  };

  const getHabitsForDate = (date: Date) => {
    if (selectedHabit === 'all') {
      return habits;
    }
    return habits.filter(h => h.id === selectedHabit);
  };

  const getDayClassName = (date: Date) => {
    const dayCompletions = getCompletionsForDate(date);
    const relevantHabits = getHabitsForDate(date);
    
    if (relevantHabits.length === 0) return '';
    
    const completedCount = dayCompletions.filter(c => 
      relevantHabits.some(h => h.id === c.habit_id)
    ).length;

    if (completedCount === 0) return '';
    if (completedCount === relevantHabits.length) return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const selectedDateCompletions = getCompletionsForDate(selectedDate);
  const selectedDateHabits = getHabitsForDate(selectedDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Calendar View</CardTitle>
            <Select value={selectedHabit} onValueChange={setSelectedHabit}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Habits</SelectItem>
                {habits.map(habit => (
                  <SelectItem key={habit.id} value={habit.id}>
                    {habit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            modifiers={{
              completed: (date) => getDayClassName(date) === 'bg-green-100 text-green-800',
              partial: (date) => getDayClassName(date) === 'bg-yellow-100 text-yellow-800'
            }}
            modifiersClassNames={{
              completed: 'bg-green-100 text-green-800',
              partial: 'bg-yellow-100 text-yellow-800'
            }}
            className="rounded-md border"
          />
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
              <span>All habits completed</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
              <span>Some habits completed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{format(selectedDate, 'MMMM d, yyyy')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedDateHabits.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No habits to display for this date
              </p>
            ) : (
              selectedDateHabits.map(habit => {
                const isCompleted = isHabitCompletedOnDate(habit.id, selectedDate);
                const dateStr = format(selectedDate, 'yyyy-MM-dd');

                return (
                  <div 
                    key={habit.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => onToggleCompletion(habit.id, dateStr)}
                        className="flex-shrink-0"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <h4 className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {habit.name}
                        </h4>
                        {habit.goal && (
                          <p className="text-sm text-muted-foreground">{habit.goal}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {habit.target_count}x {habit.target_period.slice(0, -2)}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HabitCalendar;
