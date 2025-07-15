
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { CheckCircle, Clock, AlertTriangle, Target } from 'lucide-react';
import { Todo } from '../TodoApp';

interface TodoStatsProps {
  todos: Todo[];
}

const TodoStats = ({ todos }: TodoStatsProps) => {
  const totalTodos = todos.length;
  const completedTodos = todos.filter(t => t.completed).length;
  const pendingTodos = totalTodos - completedTodos;
  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  // Priority breakdown
  const priorityData = [
    {
      name: 'High',
      value: todos.filter(t => t.priority === 'high').length,
      color: '#ef4444'
    },
    {
      name: 'Medium', 
      value: todos.filter(t => t.priority === 'medium').length,
      color: '#f59e0b'
    },
    {
      name: 'Low',
      value: todos.filter(t => t.priority === 'low').length,
      color: '#10b981'
    }
  ];

  // Status breakdown
  const statusData = [
    {
      name: 'Completed',
      value: completedTodos,
      color: '#10b981'
    },
    {
      name: 'Pending',
      value: pendingTodos,
      color: '#f59e0b'
    }
  ];

  // Overdue todos
  const overdueTodos = todos.filter(todo => {
    if (!todo.due_date || todo.completed) return false;
    return new Date(todo.due_date) < new Date();
  }).length;

  const chartConfig = {
    value: {
      label: 'Count',
    },
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Todos</p>
                <p className="text-2xl font-bold text-foreground">{totalTodos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">{completedTodos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{pendingTodos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-foreground">{overdueTodos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{completionRate}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {completedTodos} of {totalTodos} todos completed
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TodoStats;
