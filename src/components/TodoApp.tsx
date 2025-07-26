
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CheckSquare, Plus, List, Eye, EyeOff } from 'lucide-react';
import TodoList from './todos/TodoList';
import TodoStats from './todos/TodoStats';
import CreateTodoModal from './todos/CreateTodoModal';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  updated_at: string;
}

const TodoApp = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
        .update({ completed: !todo.completed })
        .eq('id', todoId);

      if (error) throw error;
      
      setTodos(prev => prev.map(t => 
        t.id === todoId ? { ...t, completed: !t.completed } : t
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your todos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Todo App</h1>
            <p className="text-muted-foreground">Organize your tasks and get things done</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setHideCompleted(!hideCompleted)}
              className="flex items-center gap-2"
            >
              {hideCompleted ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {hideCompleted ? 'Show' : 'Hide'} Completed
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Todo
            </Button>
          </div>
        </div>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Todo List</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Statistics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <TodoList
              todos={todos}
              onToggleComplete={handleToggleComplete}
              onDeleteTodo={handleDeleteTodo}
              hideCompleted={hideCompleted}
            />
          </TabsContent>

          <TabsContent value="stats">
            <TodoStats todos={todos} />
          </TabsContent>
        </Tabs>

        <CreateTodoModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateTodo={handleCreateTodo}
        />
      </div>
    </div>
  );
};

export default TodoApp;
