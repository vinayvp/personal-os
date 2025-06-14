import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachWeekOfInterval, eachMonthOfInterval, getWeek, getMonth, getYear, eachDayOfInterval, subDays } from 'date-fns';
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
  console.log('StatisticsView rendered with records:', records);

  const dailyData = useMemo(() => {
    console.log('Computing daily data...');
    try {
      const days = new Map<string, { gym: number; nonut: number; day: string }>();
      
      records.forEach(record => {
        const date = new Date(record.date);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date found:', record.date);
          return;
        }
        
        const dayKey = format(date, 'yyyy-MM-dd');
        const dayLabel = format(date, 'MMM d');
        
        if (!days.has(dayKey)) {
          days.set(dayKey, { gym: 0, nonut: 0, day: dayLabel });
        }
        
        const dayData = days.get(dayKey)!;
        if (record.gym_day) dayData.gym++;
        if (record.relief_day) dayData.nonut++;
      });
      
      const result = Array.from(days.values())
        .sort((a, b) => a.day.localeCompare(b.day))
        .slice(-30); // Last 30 days
      console.log('Daily data computed:', result);
      return result;
    } catch (error) {
      console.error('Error computing daily data:', error);
      return [];
    }
  }, [records]);

  const weeklyData = useMemo(() => {
    console.log('Computing weekly data...');
    try {
      const weeks = new Map<string, { gym: number; nonut: number; week: string }>();
      
      records.forEach(record => {
        const date = new Date(record.date);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date found:', record.date);
          return;
        }
        
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
      
      const result = Array.from(weeks.values()).sort((a, b) => a.week.localeCompare(b.week));
      console.log('Weekly data computed:', result);
      return result;
    } catch (error) {
      console.error('Error computing weekly data:', error);
      return [];
    }
  }, [records]);

  const monthlyData = useMemo(() => {
    console.log('Computing monthly data...');
    try {
      const months = new Map<string, { gym: number; nonut: number; month: string }>();
      
      records.forEach(record => {
        const date = new Date(record.date);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date found:', record.date);
          return;
        }
        
        const monthKey = format(date, 'yyyy-MM');
        const monthLabel = format(date, 'MMM yyyy');
        
        if (!months.has(monthKey)) {
          months.set(monthKey, { gym: 0, nonut: 0, month: monthLabel });
        }
        
        const monthData = months.get(monthKey)!;
        if (record.gym_day) monthData.gym++;
        if (record.relief_day) monthData.nonut++;
      });
      
      const result = Array.from(months.values()).sort((a, b) => a.month.localeCompare(b.month));
      console.log('Monthly data computed:', result);
      return result;
    } catch (error) {
      console.error('Error computing monthly data:', error);
      return [];
    }
  }, [records]);

  const yearlyData = useMemo(() => {
    console.log('Computing yearly data...');
    try {
      const years = new Map<number, { gym: number; nonut: number; year: string }>();
      
      records.forEach(record => {
        const date = new Date(record.date);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date found:', record.date);
          return;
        }
        
        const year = getYear(date);
        
        if (!years.has(year)) {
          years.set(year, { gym: 0, nonut: 0, year: year.toString() });
        }
        
        const yearData = years.get(year)!;
        if (record.gym_day) yearData.gym++;
        if (record.relief_day) yearData.nonut++;
      });
      
      const result = Array.from(years.values()).sort((a, b) => parseInt(a.year) - parseInt(b.year));
      console.log('Yearly data computed:', result);
      return result;
    } catch (error) {
      console.error('Error computing yearly data:', error);
      return [];
    }
  }, [records]);

  const overallStats = useMemo(() => {
    console.log('Computing overall stats...');
    try {
      const totalGym = records.filter(r => r.gym_day).length;
      const totalNoNut = records.filter(r => r.relief_day).length;
      const totalBoth = records.filter(r => r.gym_day && r.relief_day).length;
      const totalRest = records.filter(r => !r.gym_day && !r.relief_day).length;
      
      const result = [
        { 
          name: 'Gym Only', 
          value: totalGym - totalBoth, 
          color: '#4f46e5',
          icon: '💪'
        },
        { 
          name: 'NoNut Only', 
          value: totalNoNut - totalBoth, 
          color: '#dc2626',
          icon: '❤️'
        },
        { 
          name: 'Both Activities', 
          value: totalBoth, 
          color: '#059669',
          icon: '🏆'
        },
        { 
          name: 'Rest Days', 
          value: totalRest, 
          color: '#6b7280',
          icon: '😴'
        }
      ].filter(item => item.value > 0);
      
      console.log('Overall stats computed:', result);
      return result;
    } catch (error) {
      console.error('Error computing overall stats:', error);
      return [];
    }
  }, [records]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{data.icon}</span>
            <span className="font-medium text-foreground">{data.name}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <div>{data.value} days</div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
    if (value === 0) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="600"
      >
        {value}
      </text>
    );
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload?.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-foreground flex items-center gap-1 font-medium">
              <span>{entry.payload?.icon}</span>
              {entry.value} ({entry.payload?.value} days)
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderBarChart = (data: any[], dataKey: string) => {
    if (!data || data.length === 0) {
      return (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      );
    }

    return (
      <div className="w-full h-[300px]">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={dataKey} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="gym" fill="var(--color-gym)" name="Gym Days" />
              <Bar dataKey="nonut" fill="var(--color-nonut)" name="NoNut Days" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    );
  };

  const renderLineChart = (data: any[], dataKey: string) => {
    if (!data || data.length === 0) {
      return (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      );
    }

    return (
      <div className="w-full h-[300px]">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={dataKey} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="gym" stroke="var(--color-gym)" name="Gym Days" strokeWidth={2} />
              <Line type="monotone" dataKey="nonut" stroke="var(--color-nonut)" name="NoNut Days" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    );
  };

  // Safety check for records
  if (!records || !Array.isArray(records)) {
    console.warn('Invalid records data:', records);
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground">No tracking data available</p>
        </div>
      </div>
    );
  }

  console.log('Rendering StatisticsView component');

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
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Activity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overallStats.length > 0 ? (
              <div className="h-[400px] flex flex-col">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie
                        data={overallStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={CustomLabel}
                        outerRadius={100}
                        innerRadius={40}
                        fill="#8884d8"
                        dataKey="value"
                        stroke="none"
                      >
                        {overallStats.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <CustomLegend payload={overallStats} />
                
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Days:</span>
                      <span className="ml-2 font-medium">{records.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Most Active:</span>
                      <span className="ml-2 font-medium">
                        {overallStats.length > 0 
                          ? overallStats.reduce((prev, current) => 
                              prev.value > current.value ? prev : current
                            ).name
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                No activity data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trends Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="daily" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
              </TabsList>
              
              <TabsContent value="daily">
                {renderLineChart(dailyData, 'day')}
              </TabsContent>
              
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
          <Tabs defaultValue="daily" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="daily">Daily Comparison</TabsTrigger>
              <TabsTrigger value="weekly">Weekly Comparison</TabsTrigger>
              <TabsTrigger value="monthly">Monthly Comparison</TabsTrigger>
              <TabsTrigger value="yearly">Yearly Comparison</TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily">
              {renderBarChart(dailyData, 'day')}
            </TabsContent>
            
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
