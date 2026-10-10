import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Target,
  Flame,
  Layers,
  Calendar,
  Tag as TagIcon,
  Zap,
  TrendingUp,
  Check,
} from 'lucide-react';
import {
  format,
  isToday,
  isTomorrow,
  isBefore,
  startOfDay,
  addDays,
  subDays,
  eachDayOfInterval,
} from 'date-fns';
import { Todo } from '../TodoApp';

interface TodoStatsProps {
  todos: Todo[];
}

const TodoStats: React.FC<TodoStatsProps> = ({ todos }) => {
  const totalTodos = todos.length;
  const completedTodos = useMemo(() => todos.filter((t) => t.completed).length, [todos]);
  const pendingTodos = totalTodos - completedTodos;
  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  // Overdue count
  const overdueTodos = useMemo(() => {
    const today = startOfDay(new Date());
    return todos.filter((t) => {
      if (!t.due_date || t.completed) return false;
      return isBefore(startOfDay(new Date(t.due_date)), today);
    });
  }, [todos]);

  // Due today count
  const dueTodayTodos = useMemo(() => {
    return todos.filter((t) => {
      if (!t.due_date || t.completed) return false;
      return isToday(new Date(t.due_date));
    });
  }, [todos]);

  // Due this week (next 7 days)
  const dueThisWeekTodos = useMemo(() => {
    const today = startOfDay(new Date());
    const weekFromNow = addDays(today, 7);
    return todos.filter((t) => {
      if (!t.due_date || t.completed) return false;
      const due = startOfDay(new Date(t.due_date));
      return due >= today && due <= weekFromNow;
    });
  }, [todos]);

  // Priority breakdown with execution rates
  const priorityBreakdown = useMemo(() => {
    const priorities: Array<{
      key: 'high' | 'medium' | 'low';
      label: string;
      colorClass: string;
      barColor: string;
    }> = [
      { key: 'high', label: 'High Priority', colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20', barColor: '#f43f5e' },
      { key: 'medium', label: 'Medium Priority', colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20', barColor: '#f59e0b' },
      { key: 'low', label: 'Low Priority', colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', barColor: '#10b981' },
    ];

    return priorities.map(({ key, label, colorClass, barColor }) => {
      const match = todos.filter((t) => t.priority === key);
      const done = match.filter((t) => t.completed).length;
      const total = match.length;
      const pending = total - done;
      const rate = total > 0 ? Math.round((done / total) * 100) : 0;

      return {
        key,
        label,
        colorClass,
        barColor,
        total,
        done,
        pending,
        rate,
      };
    });
  }, [todos]);

  // Due date horizon buckets for pending tasks
  const horizonData = useMemo(() => {
    const today = startOfDay(new Date());
    const in7Days = addDays(today, 7);

    let overdue = 0;
    let todayCount = 0;
    let next7Days = 0;
    let later = 0;
    let noDate = 0;

    todos.forEach((t) => {
      if (t.completed) return;
      if (!t.due_date) {
        noDate++;
        return;
      }
      const due = startOfDay(new Date(t.due_date));
      if (isBefore(due, today)) {
        overdue++;
      } else if (isToday(new Date(t.due_date))) {
        todayCount++;
      } else if (due <= in7Days) {
        next7Days++;
      } else {
        later++;
      }
    });

    return [
      { category: 'Overdue', count: overdue, color: '#f43f5e' },
      { category: 'Today', count: todayCount, color: '#f59e0b' },
      { category: 'Next 7 Days', count: next7Days, color: 'hsl(var(--primary))' },
      { category: 'Upcoming', count: later, color: 'hsl(var(--primary))' },
      { category: 'No Due Date', count: noDate, color: 'hsl(var(--muted-foreground))' },
    ];
  }, [todos]);

  // Tag Performance Breakdown
  const tagStats = useMemo(() => {
    const map = new Map<string, { total: number; completed: number }>();

    todos.forEach((t) => {
      (t.tags || []).forEach((tag) => {
        const clean = tag.trim();
        if (!clean) return;
        const curr = map.get(clean) || { total: 0, completed: 0 };
        curr.total += 1;
        if (t.completed) curr.completed += 1;
        map.set(clean, curr);
      });
    });

    return Array.from(map.entries())
      .map(([name, stat]) => ({
        name,
        total: stat.total,
        completed: stat.completed,
        pending: stat.total - stat.completed,
        rate: Math.round((stat.completed / stat.total) * 100),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // top 8 tags
  }, [todos]);

  // Recent 14-day creation vs completion trends
  const recentDaysData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 13),
      end: new Date(),
    });

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const createdCount = todos.filter((t) => {
        try {
          return format(new Date(t.created_at), 'yyyy-MM-dd') === dateStr;
        } catch {
          return false;
        }
      }).length;

      const completedCount = todos.filter((t) => {
        if (!t.completed) return false;
        try {
          return format(new Date(t.updated_at || t.created_at), 'yyyy-MM-dd') === dateStr;
        } catch {
          return false;
        }
      }).length;

      return {
        label: format(day, 'MMM d'),
        created: createdCount,
        completed: completedCount,
      };
    });
  }, [todos]);

  if (totalTodos === 0) {
    return (
      <Card className="border-dashed bg-card/40">
        <CardContent className="py-14 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <Target className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">
              No statistics available yet
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              Create your tasks to visualize execution rates, deadline horizons, and priority distributions.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* ========================================================= */}
      {/* 1. Key Performance Metrics Banner                         */}
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
                  strokeDasharray={`${completionRate}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xs sm:text-sm font-bold font-mono tracking-tight text-foreground">
                  {completionRate}%
                </span>
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Overall Completion
                </span>
                {completionRate === 100 && (
                  <Badge variant="secondary" className="text-[10px] font-medium py-0">
                    All Done
                  </Badge>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                {completedTodos} of {totalTodos} tasks completed
              </h2>
              <p className="text-xs text-muted-foreground">
                {pendingTodos === 0
                  ? 'All tasks checked off. Great job!'
                  : `${pendingTodos} ${pendingTodos === 1 ? 'task' : 'tasks'} currently in progress.`}
              </p>
            </div>
          </div>

          {/* Quick Metrics Chips */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <div className="text-xs">
                <span className="font-semibold text-foreground">{pendingTodos}</span>
                <span className="text-muted-foreground ml-1">Active</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <div className="text-xs">
                <span className="font-semibold text-foreground">
                  {priorityBreakdown.find((p) => p.key === 'high')?.pending || 0}
                </span>
                <span className="text-muted-foreground ml-1">High Priority</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60">
              {overdueTodos.length > 0 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <div className="text-xs">
                    <span className="font-semibold text-rose-400">{overdueTodos.length}</span>
                    <span className="text-muted-foreground ml-1">Overdue</span>
                  </div>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <div className="text-xs">
                    <span className="font-semibold text-foreground">On Track</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. Priority Execution Matrix & Due Date Horizon           */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Priority Matrix */}
        <Card className="border-border/80 shadow-sm bg-card">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-muted-foreground" />
              Priority Execution Health
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Completion efficiency broken down by task impact level
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 pt-3 space-y-3.5">
            {priorityBreakdown.map((item) => (
              <div key={item.key} className="space-y-1.5 p-2.5 rounded-xl bg-muted/20 border border-border/40">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${item.colorClass}`}>
                      {item.label}
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      {item.done}/{item.total} completed
                    </span>
                  </div>
                  <span className="font-mono font-medium text-foreground text-xs">
                    {item.rate}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${item.rate}%`,
                      backgroundColor: item.barColor,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Due Date Horizon */}
        <Card className="border-border/80 shadow-sm bg-card">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Pending Task Workload Horizon
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Distribution of pending deadlines over time
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 pt-3">
            <div className="space-y-2.5">
              {horizonData.map((bucket) => {
                const percentage =
                  pendingTodos > 0 ? Math.round((bucket.count / pendingTodos) * 100) : 0;

                return (
                  <div key={bucket.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground/90 font-medium">{bucket.category}</span>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="font-semibold text-foreground">{bucket.count}</span>
                        <span className="text-muted-foreground text-[11px]">({percentage}%)</span>
                      </div>
                    </div>

                    <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: bucket.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================= */}
      {/* 3. Tags & Project Distribution (if tags exist)            */}
      {/* ========================================================= */}
      {tagStats.length > 0 && (
        <Card className="border-border/80 shadow-sm bg-card">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <TagIcon className="w-4 h-4 text-muted-foreground" />
              Project & Tag Distribution
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Volume and completion rates across your primary categories
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {tagStats.map((tag) => (
                <div
                  key={tag.name}
                  className="p-3 rounded-xl bg-muted/20 border border-border/40 space-y-2 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono font-semibold text-xs text-foreground truncate">
                      #{tag.name}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5">
                      {tag.rate}%
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{tag.completed} done</span>
                    <span>{tag.pending} active</span>
                  </div>

                  <div className="w-full bg-muted/60 rounded-full h-1 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300 bg-primary"
                      style={{ width: `${tag.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================= */}
      {/* 4. 14-Day Activity Rhythm Chart                           */}
      {/* ========================================================= */}
      <Card className="border-border/80 shadow-sm bg-card">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            14-Day Task Creation vs Completion Rhythm
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Compare daily task additions against completed check-ins
          </p>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 pt-3">
          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recentDaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border) / 0.5)' }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border) / 0.5)' }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg bg-popover/95 border border-border p-2.5 shadow-md text-xs space-y-1">
                          <p className="font-semibold text-foreground">{label}</p>
                          <div className="flex items-center justify-between gap-3 text-muted-foreground">
                            <span>Created:</span>
                            <span className="font-mono font-semibold text-foreground">
                              {payload[0]?.value}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-emerald-400">
                            <span>Completed:</span>
                            <span className="font-mono font-semibold text-emerald-400">
                              {payload[1]?.value}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="created"
                  name="Created"
                  fill="hsl(var(--muted-foreground) / 0.35)"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="completed"
                  name="Completed"
                  fill="hsl(var(--primary))"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground mt-3 pt-2 border-t border-border/40">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/35" />
              <span>Created Tasks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
              <span>Completed Tasks</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TodoStats;
