import React, { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Circle, Calendar as CalendarIcon, Check } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isToday } from 'date-fns';
import type { Habit, HabitCompletion } from '../HabitTracker';

interface HabitCalendarProps {
  habits: Habit[];
  completions: HabitCompletion[];
  onToggleCompletion: (habitId: string, date: string, forceAdd?: boolean) => void;
}

const HabitCalendar: React.FC<HabitCalendarProps> = ({
  habits,
  completions,
  onToggleCompletion,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHabit, setSelectedHabit] = useState<string>('all');

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  // Month stats for current viewed month
  const monthCompletionsCount = useMemo(() => {
    const mStart = startOfMonth(selectedDate);
    const mEnd = endOfMonth(selectedDate);
    return completions.filter((c) => {
      const d = new Date(c.completion_date);
      return d >= mStart && d <= mEnd;
    }).length;
  }, [completions, selectedDate]);

  const getCompletionsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return completions.filter((c) => c.completion_date === dateStr);
  };

  const isHabitCompletedOnDate = (habitId: string, dateStr: string) => {
    return completions.some((c) => c.habit_id === habitId && c.completion_date === dateStr);
  };

  const relevantHabits = useMemo(() => {
    if (selectedHabit === 'all') return habits;
    return habits.filter((h) => h.id === selectedHabit);
  }, [habits, selectedHabit]);

  const selectedDateCompletions = useMemo(() => {
    return relevantHabits.filter((h) => isHabitCompletedOnDate(h.id, selectedDateStr));
  }, [relevantHabits, selectedDateStr, completions]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* ========================================================= */}
      {/* Left: Interactive Calendar View (7 cols)                  */}
      {/* ========================================================= */}
      <Card className="lg:col-span-7 border-border/80 shadow-sm bg-card">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                Calendar Consistency Grid
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Browse check-ins across months and inspect daily history
              </p>
            </div>

            {/* Filter by habit */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={selectedHabit} onValueChange={setSelectedHabit}>
                <SelectTrigger className="w-full sm:w-[190px] h-8 text-xs">
                  <SelectValue placeholder="All Habits" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Habits ({habits.length})</SelectItem>
                  {habits.map((habit) => (
                    <SelectItem key={habit.id} value={habit.id}>
                      {habit.name || 'Untitled'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 flex flex-col items-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            modifiers={{
              allCompleted: (date) => {
                const dayCompletions = getCompletionsForDate(date);
                if (relevantHabits.length === 0) return false;
                const completedCount = dayCompletions.filter((c) =>
                  relevantHabits.some((h) => h.id === c.habit_id)
                ).length;
                return completedCount > 0 && completedCount >= relevantHabits.length;
              },
              partiallyCompleted: (date) => {
                const dayCompletions = getCompletionsForDate(date);
                if (relevantHabits.length === 0) return false;
                const completedCount = dayCompletions.filter((c) =>
                  relevantHabits.some((h) => h.id === c.habit_id)
                ).length;
                return completedCount > 0 && completedCount < relevantHabits.length;
              },
            }}
            modifiersClassNames={{
              allCompleted:
                'bg-emerald-500/25 text-emerald-400 font-semibold border border-emerald-500/40 rounded-md',
              partiallyCompleted:
                'bg-amber-500/20 text-amber-300 font-medium border border-amber-500/35 rounded-md',
            }}
            className="rounded-xl border border-border/70 p-3 bg-card shadow-inner w-full max-w-sm"
          />

          {/* Legend and Month Stat */}
          <div className="w-full max-w-sm mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30 border border-emerald-500/50" />
                <span className="text-[11px] text-foreground/80">All finished</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-amber-500/25 border border-amber-500/40" />
                <span className="text-[11px] text-foreground/80">Partially finished</span>
              </div>
            </div>

            <Badge variant="outline" className="text-[11px] font-mono py-0 px-2 bg-muted/30">
              {monthCompletionsCount} logs in {format(selectedDate, 'MMM yyyy')}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================= */}
      {/* Right: Selected Date Log Details (5 cols)                 */}
      {/* ========================================================= */}
      <Card className="lg:col-span-5 border-border/80 shadow-sm bg-card flex flex-col">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-foreground">
                  {format(selectedDate, 'EEEE, MMMM d')}
                </CardTitle>
                {isToday(selectedDate) && (
                  <Badge variant="secondary" className="text-[10px] font-semibold py-0 px-1.5">
                    Today
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedDateCompletions.length} of {relevantHabits.length} habits completed on this date
              </p>
            </div>

            <div className="text-right">
              <span className="font-mono text-sm font-semibold text-foreground">
                {relevantHabits.length > 0
                  ? Math.round((selectedDateCompletions.length / relevantHabits.length) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 flex-1 overflow-y-auto max-h-[460px] space-y-2.5">
          {relevantHabits.length === 0 ? (
            <p className="text-muted-foreground text-center py-10 text-xs">
              No habits configured to display.
            </p>
          ) : (
            relevantHabits.map((habit) => {
              const isCompleted = isHabitCompletedOnDate(habit.id, selectedDateStr);
              const isMilestone = habit.frequency_type === 'none';

              return (
                <div
                  key={habit.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isCompleted
                      ? 'border-border/60 bg-card/50'
                      : 'border-border/80 bg-card hover:border-border'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleCompletion(habit.id, selectedDateStr)}
                      className="shrink-0 transition-transform active:scale-90"
                      title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                    >
                      {isCompleted ? (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm"
                          style={{ backgroundColor: habit.color || '#10b981' }}
                        >
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {habit.color && (
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: habit.color }}
                          />
                        )}
                        <h4
                          className={`text-xs sm:text-sm font-semibold truncate ${
                            isCompleted ? 'text-foreground' : 'text-foreground/80'
                          }`}
                        >
                          {habit.name || 'Untitled'}
                        </h4>
                      </div>
                      {habit.goal && (
                        <p className="text-[11px] text-muted-foreground truncate">{habit.goal}</p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 text-right">
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-muted-foreground">
                      {isMilestone ? 'Goal' : habit.frequency_type}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HabitCalendar;
