import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { JournalEntry } from '../JournalApp';

interface JournalStatsProps {
  entries: JournalEntry[];
}

const JournalStats = ({ entries }: JournalStatsProps) => {
  // Calculate streak
  const calculateStreak = () => {
    if (entries.length === 0) return { current: 0, longest: 0 };

    const sortedDates = entries
      .map(entry => new Date(entry.date))
      .sort((a, b) => b.getTime() - a.getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if there's an entry today or yesterday to start the streak
    const latestDate = sortedDates[0];
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();
    const latestStr = latestDate.toDateString();

    if (latestStr === todayStr || latestStr === yesterdayStr) {
      currentStreak = 1;
      
      // Calculate current streak
      for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = sortedDates[i];
        const previousDate = sortedDates[i - 1];
        const diffTime = previousDate.getTime() - currentDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = sortedDates[i];
      const previousDate = sortedDates[i - 1];
      const diffTime = previousDate.getTime() - currentDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return { current: currentStreak, longest: longestStreak };
  };

  // Words per month data
  const getWordsPerMonth = () => {
    const monthlyData: { [key: string]: number } = {};
    
    entries.forEach(entry => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (entry.word_count || 0);
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, words]) => ({
        month,
        words,
        displayMonth: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }));
  };

  // Mood distribution
  const getMoodData = () => {
    const moodCounts: { [key: string]: number } = {};
    
    entries.forEach(entry => {
      if (entry.mood) {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      }
    });

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];
    
    return Object.entries(moodCounts).map(([mood, count], index) => ({
      mood,
      count,
      fill: colors[index % colors.length]
    }));
  };

  // Writing frequency (entries per month)
  const getFrequencyData = () => {
    const monthlyEntries: { [key: string]: number } = {};
    
    entries.forEach(entry => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      monthlyEntries[monthKey] = (monthlyEntries[monthKey] || 0) + 1;
    });

    return Object.entries(monthlyEntries)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month,
        entries: count,
        displayMonth: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }));
  };

  const streak = calculateStreak();
  const wordsPerMonth = getWordsPerMonth();
  const moodData = getMoodData();
  const frequencyData = getFrequencyData();
  const totalWords = entries.reduce((sum, entry) => sum + (entry.word_count || 0), 0);
  const averageWords = entries.length > 0 ? Math.round(totalWords / entries.length) : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{streak.current}</div>
            <p className="text-xs text-muted-foreground">days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Longest Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{streak.longest}</div>
            <p className="text-xs text-muted-foreground">days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Words</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">avg: {averageWords} per entry</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Words per Month */}
        <Card>
          <CardHeader>
            <CardTitle>Words Written Per Month</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={wordsPerMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayMonth" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="words" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Entries per Month */}
        <Card>
          <CardHeader>
            <CardTitle>Journal Entries Per Month</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={frequencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayMonth" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="entries" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Mood Distribution */}
        {moodData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Mood Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={moodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ mood, count }) => `${mood} (${count})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {moodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {entries.slice(0, 5).map(entry => (
                <div key={entry.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {entry.mood && <span className="text-lg">{entry.mood}</span>}
                    <span className="text-sm">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {entry.word_count} words
                  </span>
                </div>
              ))}
              {entries.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No entries yet. Start journaling to see your statistics!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JournalStats;