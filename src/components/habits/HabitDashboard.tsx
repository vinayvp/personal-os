import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Circle,
  Trash2,
  Target,
  Edit2,
  Plus,
  Minus,
  Flame,
  Search,
  Trophy,
  Check,
  Clock,
} from 'lucide-react';
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';
import type { Habit, HabitCompletion } from '../HabitTracker';

export const parseCustomDays = (customDays: any): number[] => {
  if (!customDays) return [];
  if (Array.isArray(customDays)) return customDays.map(Number).filter((n) => !isNaN(n));
  if (typeof customDays === 'string') {
    try {
      const parsed = JSON.parse(customDays);
      if (Array.isArray(parsed)) return parsed.map(Number).filter((n) => !isNaN(n));
    } catch {
      return customDays
        .replace(/[{}[\]]/g, '')
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n));
    }
  }
  return [];
};

const ICON_MAP: Record<string, string> = {
  dumbbell: 'fitness_center',
  fitness: 'fitness_center',
  fitness_center: 'fitness_center',
  book: 'menu_book',
  bookopen: 'menu_book',
  menu_book: 'menu_book',
  reading: 'menu_book',
  laptop: 'laptop',
  droplet: 'local_drink',
  water: 'local_drink',
  local_drink: 'local_drink',
  run: 'directions_run',
  directions_run: 'directions_run',
  meditation: 'self_improvement',
  self_improvement: 'self_improvement',
  sleep: 'bedtime',
  bedtime: 'bedtime',
  food: 'restaurant',
  restaurant: 'restaurant',
  work: 'work',
  study: 'school',
  school: 'school',
  music: 'music_note',
  music_note: 'music_note',
  brush: 'brush',
  spa: 'spa',
  phone: 'phone',
  home: 'home',
  health: 'favorite',
  favorite: 'favorite',
  attach_money: 'attach_money',
  savings: 'savings',
  account_balance: 'account_balance',
  trending_up: 'trending_up',
};

const renderHabitIcon = (habit: Habit) => {
  if (
    !habit.icon ||
    ['radio_button_checked', 'radio_button_unchecked', 'circle', 'default', 'target'].includes(
      habit.icon.toLowerCase()
    )
  ) {
    return (
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold bg-muted/60 text-muted-foreground border border-border/60">
        {habit.name?.slice(0, 1).toUpperCase() || 'H'}
      </div>
    );
  }

  const cleanIcon = habit.icon.toLowerCase();
  const iconName = ICON_MAP[cleanIcon] || habit.icon;

  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-muted/60 text-muted-foreground border border-border/60">
      <span className="material-icons text-base" aria-hidden="true">
        {iconName}
      </span>
    </div>
  );
};

interface HabitDashboardProps {
  habits: Habit[];
  completions: HabitCompletion[];
  onToggleCompletion: (habitId: string, date: string, forceAdd?: boolean) => void;
  onDeleteHabit: (habitId: string) => void;
  onEditHabit: (habit: Habit) => void;
}

type FilterType = 'all' | 'daily' | 'milestones' | 'completed' | 'pending';

const HabitDashboard = ({
  habits,
  completions,
  onToggleCompletion,
  onDeleteHabit,
  onEditHabit,
}: HabitDashboardProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const today = format(new Date(), 'yyyy-MM-dd');

  // Generate the last 7 days for quick mini-heatmaps
  const last7Days = useMemo(() => {
    const days: { date: Date; dateStr: string; dayLabel: string; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      days.push({
        date: d,
        dateStr: format(d, 'yyyy-MM-dd'),
        dayLabel: format(d, 'EEEEE'),
        isToday: i === 0,
      });
    }
    return days;
  }, []);

  const isHabitCompletedOnDate = (habitId: string, dateStr: string) => {
    return completions.some((c) => c.habit_id === habitId && c.completion_date === dateStr);
  };

  const calculateStreak = (habitId: string) => {
    const habitCompletions = completions
      .filter((c) => c.habit_id === habitId)
      .map((c) => new Date(c.completion_date))
      .sort((a, b) => b.getTime() - a.getTime());

    if (habitCompletions.length === 0) return { current: 0, longest: 0 };

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    let streakBroken = false;

    for (let i = 0; i < Math.max(60, habitCompletions.length + 30); i++) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const isCompleted = habitCompletions.some(
        (d) => format(d, 'yyyy-MM-dd') === dateStr
      );

      if (isCompleted) {
        if (!streakBroken) currentStreak++;
        tempStreak++;
      } else {
        if (i > 0 && !streakBroken) streakBroken = true;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        tempStreak = 0;
      }

      checkDate.setDate(checkDate.getDate() - 1);
    }

    if (tempStreak > longestStreak) longestStreak = tempStreak;

    return { current: currentStreak, longest: longestStreak };
  };

  const calculateProgress = (habit: Habit) => {
    const targetCount = habit.target_count || 1;
    const targetPeriod = habit.target_period || 'weekly';

    if (targetPeriod === 'total' || habit.frequency_type === 'none') {
      const totalCompletions = completions.filter((c) => c.habit_id === habit.id).length;
      return {
        completed: totalCompletions,
        target: targetCount,
        percentage: Math.min((totalCompletions / targetCount) * 100, 100),
      };
    }

    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    switch (targetPeriod) {
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

    const completionsInPeriod = completions.filter((c) => {
      if (c.habit_id !== habit.id) return false;
      const completionDate = new Date(c.completion_date);
      return completionDate >= periodStart && completionDate <= periodEnd;
    }).length;

    return {
      completed: completionsInPeriod,
      target: targetCount,
      percentage: Math.min((completionsInPeriod / targetCount) * 100, 100),
    };
  };

  const getFrequencyDisplay = (habit: Habit) => {
    if (habit.frequency_type === 'none') return 'Milestone Goal';
    if (habit.frequency_type === 'daily') return 'Daily Routine';
    if (habit.frequency_type === 'weekly') return 'Weekly';
    if (habit.frequency_type === 'custom') {
      const days = parseCustomDays(habit.custom_days);
      if (days.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days.map((day) => dayNames[day] || `Day ${day}`).join(', ');
      }
      return 'Custom Days';
    }
    return 'Custom';
  };

  const dailyHabits = useMemo(
    () => habits.filter((h) => h.frequency_type !== 'none'),
    [habits]
  );
  const milestoneHabits = useMemo(
    () => habits.filter((h) => h.frequency_type === 'none'),
    [habits]
  );

  const completedTodayCount = useMemo(() => {
    return dailyHabits.filter((h) => isHabitCompletedOnDate(h.id, today)).length;
  }, [dailyHabits, completions, today]);

  const todayPercentage = dailyHabits.length > 0
    ? Math.round((completedTodayCount / dailyHabits.length) * 100)
    : 0;

  const filteredHabits = useMemo(() => {
    return habits.filter((habit) => {
      const isCompletedToday = isHabitCompletedOnDate(habit.id, today);
      const isMilestone = habit.frequency_type === 'none';

      if (activeFilter === 'daily' && isMilestone) return false;
      if (activeFilter === 'milestones' && !isMilestone) return false;
      if (activeFilter === 'completed' && !isCompletedToday) return false;
      if (activeFilter === 'pending' && (isCompletedToday || isMilestone)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (habit.name || '').toLowerCase().includes(q);
        const goalMatch = (habit.goal || '').toLowerCase().includes(q);
        return nameMatch || goalMatch;
      }

      return true;
    });
  }, [habits, activeFilter, searchQuery, completions, today]);

  if (habits.length === 0) {
    return (
      <Card className="border-dashed bg-card/40">
        <CardContent className="pt-12 pb-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <Target className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">No habits yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Create daily routines or milestone courses to track your personal consistency and progress.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* ========================================================= */}
      {/* 1. Daily Overview Banner (Clean & Muted)                  */}
      {/* ========================================================= */}
      <div className="rounded-2xl bg-card border border-border/80 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Circular Progress Ring */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted/30 stroke-current"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-primary stroke-current transition-all duration-700 ease-out"
                  strokeDasharray={`${todayPercentage}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xs sm:text-sm font-bold font-mono tracking-tight text-foreground">
                  {todayPercentage}%
                </span>
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Today's Progress
                </span>
                {todayPercentage === 100 && dailyHabits.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] font-medium py-0">
                    All Done
                  </Badge>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                {completedTodayCount} of {dailyHabits.length} routines completed today
              </h2>
              <p className="text-xs text-muted-foreground">
                {todayPercentage === 100
                  ? 'All scheduled routines for today have been checked off.'
                  : `${dailyHabits.length - completedTodayCount} daily ${
                      dailyHabits.length - completedTodayCount === 1 ? 'habit' : 'habits'
                    } remaining.`}
              </p>
            </div>
          </div>

          {/* Quick Metrics Chips */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <div className="text-xs">
                <span className="font-semibold text-foreground">{dailyHabits.length}</span>
                <span className="text-muted-foreground ml-1">Routines</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60">
              <Trophy className="w-3.5 h-3.5 text-muted-foreground" />
              <div className="text-xs">
                <span className="font-semibold text-foreground">{milestoneHabits.length}</span>
                <span className="text-muted-foreground ml-1">Milestones</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. Filter Tabs & Search Bar (Neutral Tone)                */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Button
            type="button"
            variant={activeFilter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('all')}
            className="h-8 text-xs font-medium rounded-lg"
          >
            All ({habits.length})
          </Button>
          <Button
            type="button"
            variant={activeFilter === 'daily' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('daily')}
            className="h-8 text-xs font-medium rounded-lg"
          >
            Routines ({dailyHabits.length})
          </Button>
          <Button
            type="button"
            variant={activeFilter === 'milestones' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('milestones')}
            className="h-8 text-xs font-medium rounded-lg"
          >
            Milestones ({milestoneHabits.length})
          </Button>
          <Button
            type="button"
            variant={activeFilter === 'pending' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('pending')}
            className="h-8 text-xs font-medium rounded-lg"
          >
            Pending ({dailyHabits.length - completedTodayCount})
          </Button>
          <Button
            type="button"
            variant={activeFilter === 'completed' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('completed')}
            className="h-8 text-xs font-medium rounded-lg"
          >
            Completed ({completedTodayCount})
          </Button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search habits or goals..."
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. Habit Cards Grid (Clean, Muted, No Colored Borders)    */}
      {/* ========================================================= */}
      {filteredHabits.length === 0 ? (
        <Card className="border-dashed bg-muted/10">
          <CardContent className="py-12 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              No habits match your active filter or search query.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveFilter('all');
                setSearchQuery('');
              }}
              className="text-xs h-7"
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredHabits.map((habit) => {
            const isCompletedToday = isHabitCompletedOnDate(habit.id, today);
            const streak = calculateStreak(habit.id);
            const progress = calculateProgress(habit);
            const isMilestone = habit.frequency_type === 'none';
            const canAddMore = isMilestone && progress.completed < progress.target;
            const canMinus = isMilestone && progress.completed > 0;
            const isMilestoneFinished = isMilestone && progress.completed >= progress.target;

            return (
              <Card
                key={habit.id}
                className={`rounded-xl border transition-all duration-150 group ${
                  isCompletedToday
                    ? 'border-border/60 bg-card/60 shadow-none'
                    : 'border-border/80 bg-card hover:border-border hover:shadow-sm'
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Top Header: Icon, Name, Subtle Dot & Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      {renderHabitIcon(habit)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Tasteful small indicator dot for habit color */}
                          {habit.color && (
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: habit.color }}
                              title="Habit category color"
                            />
                          )}
                          <h4
                            className={`font-semibold text-sm sm:text-base leading-snug truncate max-w-full ${
                              isCompletedToday && !isMilestone
                                ? 'line-through text-muted-foreground'
                                : 'text-foreground'
                            }`}
                          >
                            {habit.name || 'Untitled Habit'}
                          </h4>
                        </div>
                        {habit.goal && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {habit.goal}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Edit & Delete hover controls */}
                    <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditHabit(habit)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Edit habit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteHabit(habit.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete habit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Body: Milestone Stepper vs Regular Daily 7-day Strip */}
                  {isMilestone ? (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="outline" className="text-[10px] font-medium py-0 px-2 bg-muted/30">
                          Milestone Target
                        </Badge>
                        <span className="font-mono font-medium text-xs text-foreground">
                          {progress.completed} / {progress.target} ({Math.round(progress.percentage)}%)
                        </span>
                      </div>

                      {/* Milestone Status / Progress Bar */}
                      <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${progress.percentage}%`,
                            backgroundColor: habit.color || 'hsl(var(--primary))',
                          }}
                        />
                      </div>

                      {/* Stepper Buttons & Completion status */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[11px] text-muted-foreground">
                          {isMilestoneFinished ? (
                            <span className="text-foreground font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3" style={{ color: habit.color || 'hsl(var(--primary))' }} /> Target Complete
                            </span>
                          ) : (
                            <span>{progress.target - progress.completed} remaining</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/50">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
                            onClick={() => onToggleCompletion(habit.id, today, false)}
                            disabled={!canMinus}
                            title="Decrease completion"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span
                            className="px-2 font-mono text-xs font-semibold"
                            style={{ color: habit.color || 'inherit' }}
                          >
                            {progress.completed}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
                            onClick={() => onToggleCompletion(habit.id, today, true)}
                            disabled={!canAddMore}
                            title="Increase completion"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 pt-1">
                      {/* Interactive 7-Day Mini Timeline */}
                      <div className="flex items-center justify-between gap-1 p-2 rounded-xl bg-muted/30 border border-border/40">
                        <div className="flex items-center gap-1 sm:gap-2">
                          {last7Days.map((day) => {
                            const completedOnDay = isHabitCompletedOnDate(habit.id, day.dateStr);

                            return (
                              <button
                                key={day.dateStr}
                                type="button"
                                onClick={() => onToggleCompletion(habit.id, day.dateStr)}
                                className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition-all text-[10px] ${
                                  day.isToday ? 'ring-1 ring-border bg-card' : 'hover:bg-muted/60'
                                }`}
                                title={`${format(day.date, 'MMM d')}: ${
                                  completedOnDay ? 'Completed (click to toggle)' : 'Incomplete (click to toggle)'
                                }`}
                              >
                                <span className="text-[9px] text-muted-foreground font-mono">
                                  {day.dayLabel}
                                </span>
                                <div
                                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-transform active:scale-90 ${
                                    completedOnDay
                                      ? 'text-white'
                                      : 'border border-border/70 bg-background/50'
                                  }`}
                                  style={
                                    completedOnDay
                                      ? { backgroundColor: habit.color || 'hsl(var(--primary))' }
                                      : undefined
                                  }
                                >
                                  {completedOnDay && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Check-in Toggle Button */}
                        <div className="pl-1 border-l border-border/50">
                          <Button
                            type="button"
                            size="sm"
                            variant={isCompletedToday ? 'secondary' : 'default'}
                            onClick={() => onToggleCompletion(habit.id, today)}
                            className="h-8 px-2.5 sm:px-3 text-xs font-semibold gap-1.5 transition-all shadow-none"
                          >
                            {isCompletedToday ? (
                              <>
                                <Check
                                  className="w-3.5 h-3.5"
                                  style={{ color: habit.color || 'hsl(var(--primary))' }}
                                  strokeWidth={2.5}
                                />
                                <span>Done</span>
                              </>
                            ) : (
                              <>
                                <Circle className="w-3.5 h-3.5" />
                                <span>Check in</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Routine Status / Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>
                            {habit.frequency_type === 'daily'
                              ? 'Consistency rate'
                              : `${progress.completed}/${progress.target} ${
                                  habit.target_period === 'weekly' ? 'this week' : habit.target_period
                                }`}
                          </span>
                          <span className="font-mono font-medium text-foreground">
                            {Math.round(progress.percentage)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${progress.percentage}%`,
                              backgroundColor: habit.color || 'hsl(var(--primary))',
                            }}
                          />
                        </div>
                      </div>

                      {/* Footer: Streak & Period Target */}
                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <div className="flex items-center gap-2">
                          {streak.current > 0 ? (
                            <div className="flex items-center gap-1 text-foreground font-medium text-xs">
                              <Flame
                                className="w-3.5 h-3.5"
                                style={{ color: habit.color || 'hsl(var(--primary))' }}
                              />
                              <span>{streak.current}d streak</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">
                              Best: {streak.longest}d
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                            <Target className="w-2.5 h-2.5 mr-1" />
                            {progress.completed}/{progress.target}{' '}
                            {habit.target_period === 'weekly' ? 'this week' : habit.target_period}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HabitDashboard;
