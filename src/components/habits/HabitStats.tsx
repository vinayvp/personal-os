import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  format,
  subDays,
  subWeeks,
  eachDayOfInterval,
  eachWeekOfInterval,
  parseISO,
  getDay,
} from 'date-fns';
import {
  TrendingUp,
  Target,
  Award,
  Calendar,
  Flame,
  CheckCircle2,
  Clock,
  Zap,
  BarChart2,
  Layers,
} from 'lucide-react';
import type { Habit, HabitCompletion } from '../HabitTracker';

interface HabitStatsProps {
  habits: Habit[];
  completions: HabitCompletion[];
}

type TimeframeOption = '14d' | '30d' | '12w';
type SortOption = 'streak' | 'completions' | 'name';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HabitStats: React.FC<HabitStatsProps> = ({ habits, completions }) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('30d');
  const [habitSort, setHabitSort] = useState<SortOption>('streak');

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const dailyHabits = useMemo(
    () => habits.filter((h) => h.frequency_type !== 'none'),
    [habits]
  );
  const milestoneHabits = useMemo(
    () => habits.filter((h) => h.frequency_type === 'none'),
    [habits]
  );

  const totalCompletions = completions.length;

  const routinesTodayCompleted = useMemo(() => {
    return dailyHabits.filter((h) =>
      completions.some((c) => c.habit_id === h.id && c.completion_date === todayStr)
    ).length;
  }, [dailyHabits, completions, todayStr]);

  const last30DaysList = useMemo(() => {
    return eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });
  }, []);

  const prev30DaysList = useMemo(() => {
    return eachDayOfInterval({
      start: subDays(new Date(), 59),
      end: subDays(new Date(), 30),
    });
  }, []);

  const actual30DaysCount = useMemo(() => {
    const datesSet = new Set(last30DaysList.map((d) => format(d, 'yyyy-MM-dd')));
    return completions.filter((c) => datesSet.has(c.completion_date)).length;
  }, [completions, last30DaysList]);

  const prev30DaysCount = useMemo(() => {
    const datesSet = new Set(prev30DaysList.map((d) => format(d, 'yyyy-MM-dd')));
    return completions.filter((c) => datesSet.has(c.completion_date)).length;
  }, [completions, prev30DaysList]);

  const habitStreaks = useMemo(() => {
    return habits.map((habit) => {
      const habitCompletions = completions
        .filter((c) => c.habit_id === habit.id)
        .map((c) => new Date(c.completion_date))
        .sort((a, b) => b.getTime() - a.getTime());

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);
      let streakBroken = false;

      for (let i = 0; i < 365; i++) {
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

      const c30 = completions.filter((c) => {
        if (c.habit_id !== habit.id) return false;
        const d = new Date(c.completion_date);
        return d >= subDays(new Date(), 30);
      }).length;

      return {
        habit,
        current: currentStreak,
        longest: longestStreak,
        total: habitCompletions.length,
        completionsLast30Days: c30,
        rate30Days: Math.min(Math.round((c30 / 30) * 100), 100),
      };
    });
  }, [habits, completions]);

  const activeStreaksCount = habitStreaks.filter((h) => h.current > 0).length;
  const bestActiveStreak = Math.max(...habitStreaks.map((h) => h.current), 0);
  const bestAllTimeStreak = Math.max(...habitStreaks.map((h) => h.longest), 0);

  const dailyAverageVelocity = (actual30DaysCount / 30).toFixed(1);

  const trendData = useMemo(() => {
    if (timeframe === '14d') {
      const days = eachDayOfInterval({
        start: subDays(new Date(), 13),
        end: new Date(),
      });
      return days.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const count = completions.filter((c) => c.completion_date === dateStr).length;
        return {
          label: format(day, 'MMM d'),
          fullDate: format(day, 'EEEE, MMM d'),
          completions: count,
        };
      });
    }

    if (timeframe === '30d') {
      const days = eachDayOfInterval({
        start: subDays(new Date(), 29),
        end: new Date(),
      });
      return days.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const count = completions.filter((c) => c.completion_date === dateStr).length;
        return {
          label: format(day, 'MMM d'),
          fullDate: format(day, 'EEEE, MMM d'),
          completions: count,
        };
      });
    }

    const weeks = eachWeekOfInterval({
      start: subWeeks(new Date(), 11),
      end: new Date(),
    });
    return weeks.map((weekStart) => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const count = completions.filter((c) => {
        const d = new Date(c.completion_date);
        return d >= weekStart && d <= weekEnd;
      }).length;
      return {
        label: format(weekStart, 'MMM d'),
        fullDate: `Week of ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`,
        completions: count,
      };
    });
  }, [timeframe, completions]);

  const dayOfWeekData = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    completions.forEach((c) => {
      try {
        const d = parseISO(c.completion_date);
        const dayIdx = getDay(d);
        counts[dayIdx] += 1;
      } catch {
        // ignore invalid dates
      }
    });

    const maxCount = Math.max(...counts, 1);

    return counts.map((count, index) => ({
      day: DAY_SHORT[index],
      fullName: DAY_NAMES[index],
      count,
      percentage: Math.round((count / maxCount) * 100),
    }));
  }, [completions]);

  const bestDay = useMemo(() => {
    let max = -1;
    let best = dayOfWeekData[0];
    dayOfWeekData.forEach((d) => {
      if (d.count > max) {
        max = d.count;
        best = d;
      }
    });
    return best;
  }, [dayOfWeekData]);

  const sortedHabitStreaks = useMemo(() => {
    const copy = [...habitStreaks];
    if (habitSort === 'streak') {
      return copy.sort((a, b) => b.current - a.current || b.longest - a.longest);
    }
    if (habitSort === 'completions') {
      return copy.sort((a, b) => b.total - a.total);
    }
    return copy.sort((a, b) => (a.habit.name || '').localeCompare(b.habit.name || ''));
  }, [habitStreaks, habitSort]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border/80 px-3 py-2 rounded-lg shadow-md text-xs space-y-1">
          <p className="font-semibold text-foreground">{data.fullDate || data.label}</p>
          <p className="text-muted-foreground font-mono font-medium flex items-center gap-1.5">
            <span>{payload[0].value} check-ins</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* 1. Vital Metrics (Top 4 Clean & Neutral Cards)            */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1 */}
        <Card className="border border-border/80 bg-card shadow-sm">
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Today's Check-ins
              </span>
              <div className="w-8 h-8 rounded-lg bg-muted/60 text-muted-foreground flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground flex items-baseline gap-2">
                <span>{routinesTodayCompleted}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  / {dailyHabits.length} routines
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {dailyHabits.length > 0
                  ? `${Math.round((routinesTodayCompleted / dailyHabits.length) * 100)}% completed today`
                  : 'No routines scheduled'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2 */}
        <Card className="border border-border/80 bg-card shadow-sm">
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                30-Day Activity
              </span>
              <div className="w-8 h-8 rounded-lg bg-muted/60 text-muted-foreground flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground flex items-baseline gap-2">
                <span>{actual30DaysCount}</span>
                <span className="text-sm font-normal text-muted-foreground">check-ins</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {actual30DaysCount >= prev30DaysCount
                  ? `+${actual30DaysCount - prev30DaysCount} check-ins vs prior 30d`
                  : `${actual30DaysCount - prev30DaysCount} check-ins vs prior 30d`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3 */}
        <Card className="border border-border/80 bg-card shadow-sm">
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Current Streaks
              </span>
              <div className="w-8 h-8 rounded-lg bg-muted/60 text-muted-foreground flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground flex items-baseline gap-2">
                <span>{bestActiveStreak}</span>
                <span className="text-sm font-normal text-muted-foreground">days max</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeStreaksCount} active habits with current streak
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4 */}
        <Card className="border border-border/80 bg-card shadow-sm">
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                All-Time Logged
              </span>
              <div className="w-8 h-8 rounded-lg bg-muted/60 text-muted-foreground flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground flex items-baseline gap-2">
                <span>{totalCompletions}</span>
                <span className="text-sm font-normal text-muted-foreground">total</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pacing: ~{dailyAverageVelocity} check-ins / day (last 30d)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================= */}
      {/* 2. Interactive Momentum Trend Chart                       */}
      {/* ========================================================= */}
      <Card className="border-border/80 shadow-sm bg-card">
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/50">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-muted-foreground" />
              Check-in Momentum Trend
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daily volume of habit completions over time
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-lg border border-border/60">
            <Button
              type="button"
              variant={timeframe === '14d' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTimeframe('14d')}
              className="h-7 text-xs px-2.5 font-medium"
            >
              14 Days
            </Button>
            <Button
              type="button"
              variant={timeframe === '30d' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTimeframe('30d')}
              className="h-7 text-xs px-2.5 font-medium"
            >
              30 Days
            </Button>
            <Button
              type="button"
              variant={timeframe === '12w' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTimeframe('12w')}
              className="h-7 text-xs px-2.5 font-medium"
            >
              12 Weeks
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-4">
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="completionsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="completions"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#completionsGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================= */}
      {/* 3. Productivity Rhythm by Day of the Week                 */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 border-border/80 shadow-sm bg-card">
          <CardHeader className="p-4 sm:p-5 pb-2 border-b border-border/50">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Productivity by Day of the Week
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Total check-ins aggregated across days of the week
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-4">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeekData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-popover border border-border px-3 py-1.5 rounded-lg shadow-md text-xs">
                            <span className="font-semibold text-foreground">{d.fullName}</span>
                            <span className="text-muted-foreground font-mono ml-2">
                              {d.count} check-ins
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm bg-card flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-muted-foreground" />
              Rhythm Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Peak Activity Day
              </span>
              <p className="text-sm font-bold text-foreground">
                {bestDay.fullName} ({bestDay.count} check-ins)
              </p>
              <p className="text-xs text-muted-foreground">
                Your highest completion volume happens on {bestDay.fullName}s.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Longest All-Time Streak</span>
                <span className="font-mono font-bold text-foreground">{bestAllTimeStreak} days</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Active Daily Routines</span>
                <span className="font-mono font-bold text-foreground">{dailyHabits.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Milestone Goals</span>
                <span className="font-mono font-bold text-foreground">{milestoneHabits.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================= */}
      {/* 4. Habit-by-Habit Performance Matrix (Clean & Neutral)    */}
      {/* ========================================================= */}
      <Card className="border-border/80 shadow-sm bg-card">
        <CardHeader className="p-4 sm:p-5 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/50">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-muted-foreground" />
              Habit Performance & Streaks
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Individual habit consistency and active streak health
            </p>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-center">
            <span className="text-xs text-muted-foreground mr-1">Sort by:</span>
            <Button
              type="button"
              variant={habitSort === 'streak' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setHabitSort('streak')}
              className="h-7 text-xs px-2"
            >
              Streak
            </Button>
            <Button
              type="button"
              variant={habitSort === 'completions' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setHabitSort('completions')}
              className="h-7 text-xs px-2"
            >
              Completions
            </Button>
            <Button
              type="button"
              variant={habitSort === 'name' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setHabitSort('name')}
              className="h-7 text-xs px-2"
            >
              Name
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 pt-3">
          <div className="divide-y divide-border/50">
            {sortedHabitStreaks.map(({ habit, current, longest, total, rate30Days }) => {
              const isMilestone = habit.frequency_type === 'none';

              return (
                <div
                  key={habit.id}
                  className="py-3 sm:py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-muted/20 px-2 rounded-lg transition-colors"
                >
                  {/* Habit name & subtle color dot */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {habit.color ? (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: habit.color }}
                      />
                    ) : (
                      <span className="w-2 h-2 rounded-full shrink-0 bg-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {habit.name || 'Untitled'}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1.5 font-normal text-muted-foreground"
                        >
                          {isMilestone ? 'Milestone' : 'Routine'}
                        </Badge>
                      </div>
                      {habit.goal && (
                        <p className="text-xs text-muted-foreground truncate max-w-md">
                          {habit.goal}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Numbers & Progress */}
                  <div className="flex items-center gap-5 self-end sm:self-center shrink-0 text-xs">
                    <div className="text-right min-w-[70px]">
                      <div className="flex items-center justify-end gap-1 font-semibold text-foreground">
                        {current > 0 ? (
                          <>
                            <Flame className="w-3.5 h-3.5 text-primary" />
                            <span>{current}d</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground font-normal">0d</span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">Best: {longest}d</span>
                    </div>

                    <div className="text-right min-w-[75px]">
                      <div className="font-mono font-semibold text-foreground">
                        {total}
                      </div>
                      <span className="text-[10px] text-muted-foreground">all-time</span>
                    </div>

                    <div className="w-24 sm:w-28 space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">30d Rate</span>
                        <span className="font-mono font-medium text-foreground">{rate30Days}%</span>
                      </div>
                      <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${rate30Days}%`,
                            backgroundColor: habit.color || 'hsl(var(--primary))',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HabitStats;
