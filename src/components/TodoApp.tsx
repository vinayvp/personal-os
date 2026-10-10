import React, { useState, useEffect, useMemo } from 'react';
import PageLoader from '@/components/common/PageLoader';
import RefreshButton from '@/components/common/RefreshButton';
import { supabase } from '@/integrations/supabase/appClient';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  CheckSquare,
  Plus,
  ListTodo,
  BarChart3,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import TodoList from './todos/TodoList';
import TodoStats from './todos/TodoStats';
import CreateTodoModal from './todos/CreateTodoModal';
import EditTodoModal from './todos/EditTodoModal';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

const TodoApp = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [hideCompleted, setHideCompleted] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('todos' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos((data || []) as any);
    } catch (error) {
      console.error('Error fetching todos:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load todos.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTodo = async (todoData: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('todos' as any)
        .insert(todoData)
        .select()
        .single();

      if (error) throw error;
      
      setTodos(prev => [data as any, ...prev]);
      setIsCreateModalOpen(false);
      
      toast({
        title: "Success",
        description: "Todo created successfully!",
      });
    } catch (error) {
      console.error('Error creating todo:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create todo.",
      });
    }
  };

  const handleToggleComplete = async (todoId: string) => {
    try {
      const todo = todos.find(t => t.id === todoId);
      if (!todo) return;

      const { error } = await supabase
        .from('todos' as any)
        .update({ completed: !todo.completed, updated_at: new Date().toISOString() })
        .eq('id', todoId);

      if (error) throw error;
      
      setTodos(prev => prev.map(t => 
        t.id === todoId ? { ...t, completed: !t.completed, updated_at: new Date().toISOString() } : t
      ));
    } catch (error) {
      console.error('Error toggling todo:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update todo.",
      });
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    try {
      const { error } = await supabase
        .from('todos' as any)
        .delete()
        .eq('id', todoId);

      if (error) throw error;
      
      setTodos(prev => prev.filter(t => t.id !== todoId));
      
      toast({
        title: "Success",
        description: "Todo deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete todo.",
      });
    }
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
  };

  const handleTodoUpdated = () => {
    fetchTodos();
    setEditingTodo(null);
  };

  const pendingCount = useMemo(() => todos.filter(t => !t.completed).length, [todos]);
  const completedCount = useMemo(() => todos.filter(t => t.completed).length, [todos]);
  const overdueCount = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return todos.filter(t => {
      if (!t.due_date || t.completed) return false;
      const d = new Date(t.due_date);
      d.setHours(0, 0, 0, 0);
      return d < now;
    }).length;
  }, [todos]);

  if (isLoading) {
    return <PageLoader message="Loading your todos..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="app-container py-4 sm:py-6">
        {/* App Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6 pb-3 border-b border-border/60">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <CheckSquare className="w-4 h-4" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground truncate">
                Todo & Tasks
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Organize priorities, manage deadlines, and build daily momentum
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <RefreshButton onRefresh={fetchTodos} />
            <Button
              variant={hideCompleted ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setHideCompleted(!hideCompleted)}
              className="gap-1.5 text-xs h-8 font-medium shadow-none"
              title={hideCompleted ? 'Show completed tasks' : 'Hide completed tasks'}
            >
              {hideCompleted ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{hideCompleted ? 'Show' : 'Hide'} Completed</span>
            </Button>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              size="sm"
              className="gap-1.5 text-xs h-8 font-semibold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="list" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-9 md:h-10 border border-border/60">
            <TabsTrigger
              value="list"
              className="flex items-center gap-2 text-xs sm:text-sm px-2 md:px-3 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Tasks</span>
              <span className="text-[10px] ml-0.5 px-1.5 py-0.2 rounded-full bg-muted-foreground/15 text-muted-foreground font-mono">
                {pendingCount}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="flex items-center gap-2 text-xs sm:text-sm px-2 md:px-3 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics & Insights</span>
              {overdueCount > 0 && (
                <span className="text-[10px] ml-0.5 px-1.5 py-0.2 rounded-full bg-rose-500/15 text-rose-400 font-mono">
                  {overdueCount} overdue
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <TodoList
              todos={todos}
              onToggleComplete={handleToggleComplete}
              onDeleteTodo={handleDeleteTodo}
              onEditTodo={handleEditTodo}
              hideCompleted={hideCompleted}
            />
          </TabsContent>

          <TabsContent value="stats">
            <TodoStats todos={todos} />
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <CreateTodoModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateTodo={handleCreateTodo}
        />

        <EditTodoModal
          todo={editingTodo}
          onTodoUpdated={handleTodoUpdated}
          onClose={() => setEditingTodo(null)}
        />
      </div>
    </div>
  );
};

export default TodoApp;
