
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachWeekOfInterval, eachMonthOfInterval, getWeek, getMonth, getYear } from 'date-fns';
import { Dumbbell, Heart, TrendingUp, Calendar } from 'lucide-react';

interface DayRecord {
  id: string;
  date: string;
  gym_day: boolean;
  relief_day: boolean;
}

interface StatisticsViewProps {
  records: DayRecord[];
}

const chartConfig = {
  gym: {
    label: "Gym Days",
    color: "hsl(var(--primary))",
  },
  nonut: {
    label: "NoNut Days",
    color: "hsl(var(--destructive))",
  },
};

const StatisticsView = ({ records }: StatisticsViewProps) => {
  const weeklyData = useMemo(() => {
    const weeks = new Map<string, { gym: number; nonut: number; week: string }>();
    
    records.forEach(record => {
      const date = new Date(record.date);
      const weekStart = startOfWeek(date);
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      const weekLabel = format(weekStart, 'MMM d');
      
      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, { gym: 0, nonut: 0, week: weekLabel });
      }
      
      const weekData = weeks.get(weekKey)!;
      if (record.gym_day) weekData.gym++;
      if (record.relief_day) weekData.nonut++;
    });
    
    return Array.from(weeks.values()).sort((a, b) => a.week.localeCompare(b.week));
  }, [records]);

  const monthlyData = useMemo(() => {
    const months = new Map<string, { gym: number; nonut: number; month: string }>();
    
    records.forEach(record => {
      const date = new Date(record.date);
      const monthKey = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMM yyyy');
      
      if (!months.has(monthKey)) {
        months.set(monthKey, { gym: 0, nonut: 0, month: monthLabel });
      }
      
      const monthData = months.get(monthKey)!;
      if (record.gym_day) monthData.gym++;
      if (record.relief_day) monthData.nonut++;
    });
    
    return Array.from(months.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [records]);

  const yearlyData = useMemo(() => {
    const years = new Map<number, { gym: number; nonut: number; year: string }>();
    
    records.forEach(record => {
      const date = new Date(record.date);
      const year = getYear(date);
      
      if (!years.has(year)) {
        years.set(year, { gym: 0, nonut: 0, year: year.toString() });
      }
      
      const yearData = years.get(year)!;
      if (record.gym_day) yearData.gym++;
      if (record.relief_day) yearData.nonut++;
    });
    
    return Array.from(years.values()).sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [records]);

  const overallStats = useMemo(() => {
    const totalGym = records.filter(r => r.gym_day).length;
    const totalNoNut = records.filter(r => r.relief_day).length;
    const totalBoth = records.filter(r => r.gym_day && r.relief_day).length;
    const totalRest = records.filter(r => !r.gym_day && !r.relief_day).length;
    
    return [
      { name: 'Gym Only', value: totalGym - totalBoth, color: 'hsl(var(--primary))' },
      { name: 'NoNut Only', value: totalNoNut - totalBoth, color: 'hsl(var(--destructive))' },
      { name: 'Both', value: totalBoth, color: 'hsl(var(--warning))' },
      { name: 'Rest', value: totalRest, color: 'hsl(var(--muted))' }
    ].filter(item => item.value > 0);
  }, [records]);

  const renderBarChart = (data: any[], dataKey: string) => (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={dataKey} />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="gym" fill="var(--color-gym)" name="Gym Days" />
          <Bar dataKey="nonut" fill="var(--color-nonut)" name="NoNut Days" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );

  const renderLineChart = (data: any[], dataKey: string) => (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={dataKey} />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="gym" stroke="var(--color-gym)" name="Gym Days" strokeWidth={2} />
          <Line type="monotone" dataKey="nonut" stroke="var(--color-nonut)" name="NoNut Days" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{records.filter(r => r.gym_day).length}</div>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Dumbbell className="w-4 h-4" />
                Total Gym Days
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{records.filter(r => r.relief_day).length}</div>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Heart className="w-4 h-4" />
                Total NoNut Days
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{records.filter(r => r.gym_day && r.relief_day).length}</div>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Both Days
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{records.length}</div>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Calendar className="w-4 h-4" />
                Total Days
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Activity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overallStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {overallStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trends Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="weekly" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
              </TabsList>
              
              <TabsContent value="weekly">
                {renderLineChart(weeklyData.slice(-8), 'week')}
              </TabsContent>
              
              <TabsContent value="monthly">
                {renderLineChart(monthlyData.slice(-6), 'month')}
              </TabsContent>
              
              <TabsContent value="yearly">
                {renderLineChart(yearlyData, 'year')}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="weekly" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="weekly">Weekly Comparison</TabsTrigger>
              <TabsTrigger value="monthly">Monthly Comparison</TabsTrigger>
              <TabsTrigger value="yearly">Yearly Comparison</TabsTrigger>
            </TabsList>
            
            <TabsContent value="weekly">
              {renderBarChart(weeklyData.slice(-12), 'week')}
            </TabsContent>
            
            <TabsContent value="monthly">
              {renderBarChart(monthlyData.slice(-12), 'month')}
            </TabsContent>
            
            <TabsContent value="yearly">
              {renderBarChart(yearlyData, 'year')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsView;
