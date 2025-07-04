
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format, startOfWeek, eachDayOfInterval, subWeeks, startOfMonth, eachWeekOfInterval, subMonths } from 'date-fns';
import { TrendingUp, Target, Award, Calendar } from 'lucide-react';
import type { Habit, HabitCompletion } from '../HabitTracker';

interface HabitStatsProps {
  habits: Habit[];
  completions: HabitCompletion[];
}

const HabitStats = ({ habits, completions }: HabitStatsProps) => {
  // Calculate overall stats
  const totalHabits = habits.length;
  const totalCompletions = completions.length;
  const completionsToday = completions.filter(c => c.completion_date === format(new Date(), 'yyyy-MM-dd')).length;
  
  // Calculate completion rate for last 30 days
  const last30Days = eachDayOfInterval({
    start: subWeeks(new Date(), 4),
    end: new Date()
  });
  
  const possibleCompletions = last30Days.length * totalHabits;
  const actualCompletions = completions.filter(c => {
    const date = new Date(c.completion_date);
    return last30Days.some(d => format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
  }).length;
  
  const completionRate = possibleCompletions > 0 ? Math.round((actualCompletions / possibleCompletions) * 100) : 0;

  // Weekly completion data for chart
  const weeklyData = eachWeekOfInterval({
    start: subWeeks(new Date(), 7),
    end: new Date()
  }).map(weekStart => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekCompletions = completions.filter(c => {
      const date = new Date(c.completion_date);
      return date >= weekStart && date <= weekEnd;
    }).length;

    return {
      week: format(weekStart, 'MMM dd'),
      completions: weekCompletions
    };
  });

  // Daily completion data for the last 14 days
  const dailyData = eachDayOfInterval({
    start: subWeeks(new Date(), 2),
    end: new Date()
  }).map(day => {
    const dayCompletions = completions.filter(c => 
      c.completion_date === format(day, 'yyyy-MM-dd')
    ).length;

    return {
      day: format(day, 'MMM dd'),
      completions: dayCompletions
    };
  });

  // Habit completion distribution
  const habitCompletionData = habits.map(habit => {
    const habitCompletions = completions.filter(c => c.habit_id === habit.id).length;
    return {
      name: habit.name.length > 20 ? habit.name.substring(0, 20) + '...' : habit.name,
      completions: habitCompletions
    };
  }).sort((a, b) => b.completions - a.completions);

  // Best performing habits (top 5)
  const topHabits = habitCompletionData.slice(0, 5);

  // Calculate streaks for each habit
  const habitStreaks = habits.map(habit => {
    const habitCompletions = completions
      .filter(c => c.habit_id === habit.id)
      .map(c => new Date(c.completion_date))
      .sort((a, b) => b.getTime() - a.getTime());

    let longestStreak = 0;
    let currentStreak = 0;
    
    if (habitCompletions.length > 0) {
      let tempStreak = 0;
      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);

      for (let i = 0; i < 365; i++) {
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        const isCompleted = habitCompletions.some(d => 
          format(d, 'yyyy-MM-dd') === dateStr
        );

        if (isCompleted) {
          tempStreak++;
          if (i === 0 || (currentStreak === 0 && i < 7)) currentStreak = tempStreak;
        } else {
          if (tempStreak > longestStreak) longestStreak = tempStreak;
          tempStreak = 0;
        }

        checkDate.setDate(checkDate.getDate() - 1);
      }

      if (tempStreak > longestStreak) longestStreak = tempStreak;
    }

    return {
      name: habit.name,
      current: currentStreak,
      longest: longestStreak
    };
  });

  const bestStreak = Math.max(...habitStreaks.map(h => h.longest), 0);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Habits</p>
                <p className="text-2xl font-bold">{totalHabits}</p>
              </div>
              <Target className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Completions</p>
                <p className="text-2xl font-bold">{completionsToday}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{completionRate}%</p>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Best Streak</p>
                <p className="text-2xl font-bold">{bestStreak}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
              <Award className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Completions (Last 2 Weeks)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="completions" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Completions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completions" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Habit Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Habits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topHabits} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="completions" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Habit Streaks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {habitStreaks.slice(0, 5).map((habit, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <span className="font-medium truncate flex-1">{habit.name}</span>
                  <div className="flex gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-primary">{habit.current}</div>
                      <div className="text-muted-foreground">Current</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-yellow-500">{habit.longest}</div>
                      <div className="text-muted-foreground">Best</div>
                    </div>
                  </div>
                </div>
              ))}
              {habitStreaks.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No streak data available yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HabitStats;
