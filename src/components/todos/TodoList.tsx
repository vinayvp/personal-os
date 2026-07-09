
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Calendar, Search, Filter, CheckSquare, Edit, Star, Sparkles } from 'lucide-react';
import { Todo } from '../TodoApp';

interface TodoListProps {
  todos: Todo[];
  onToggleComplete: (todoId: string) => void;
  onDeleteTodo: (todoId: string) => void;
  onEditTodo: (todo: Todo) => void;
  hideCompleted?: boolean;
}

const TodoList = ({ todos, onToggleComplete, onDeleteTodo, onEditTodo, hideCompleted = false }: TodoListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [exitingId, setExitingId] = useState<string | null>(null);

  // Get all unique tags from todos
  const allTags = Array.from(new Set(todos.flatMap(todo => todo.tags || [])));

  const filteredTodos = todos.filter(todo => {
    const matchesSearch = searchQuery === '' || 
      todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      todo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (todo.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority = filterPriority === 'all' || todo.priority === filterPriority;
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'completed' && todo.completed) ||
      (filterStatus === 'pending' && !todo.completed);

    const matchesTag = filterTag === 'all' || (todo.tags || []).includes(filterTag);

    const notHidden = !hideCompleted || !todo.completed;

    return matchesSearch && matchesPriority && matchesStatus && matchesTag && notHidden;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDateString?: string) => {
    if (!dueDateString) return false;
    return new Date(dueDateString) < new Date() && !todos.find(t => t.due_date === dueDateString)?.completed;
  };

  const handleCompleteWithReward = (todoId: string, completed: boolean) => {
    if (completed) {
      setCelebratingId(todoId);
      setJustCompletedId(todoId);
      setTimeout(() => setCelebratingId(null), 600);
      setTimeout(() => setJustCompletedId(null), 1400);
      if (hideCompleted) {
        setTimeout(() => setExitingId(todoId), 600);
        setTimeout(() => {
          onToggleComplete(todoId);
          setExitingId(null);
        }, 1000);
        return;
      }
    }
    onToggleComplete(todoId);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search todos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {allTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Todo List */}
      {filteredTodos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No todos found
            </h3>
            <p className="text-muted-foreground">
              {searchQuery || filterPriority !== 'all' || filterStatus !== 'all' || filterTag !== 'all'
                ? 'Try adjusting your filters or search query.'
                : 'Create your first todo to get started.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTodos.map(todo => (
            <Card 
              key={todo.id} 
              className={`transition-all duration-300 ${
                todo.completed ? 'opacity-60' : ''
              } ${exitingId === todo.id ? 'animate-slide-out-right' : ''}`}
              style={exitingId === todo.id ? { animationFillMode: 'forwards', opacity: 0 } : undefined}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="relative mt-1">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => handleCompleteWithReward(todo.id, !todo.completed)}
                      className={`relative z-10 ${celebratingId === todo.id ? 'animate-check-pop' : ''}`}
                    />
                    {celebratingId === todo.id && (
                      <span className="absolute inset-0 rounded-full border-2 border-primary animate-ring-burst pointer-events-none" />
                    )}
                    {justCompletedId === todo.id && (
                      <Sparkles className="absolute -top-3 -right-3 w-4 h-4 text-yellow-500 animate-star-bounce pointer-events-none" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className={`font-medium ${todo.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {todo.title}
                        </h3>
                        {todo.description && (
                          <p className={`text-sm mt-1 ${todo.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                            {todo.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className={getPriorityColor(todo.priority)}>
                          {todo.priority}
                        </Badge>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditTodo(todo)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteTodo(todo.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Created {formatDate(todo.created_at)}</span>
                      {todo.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span className={isOverdue(todo.due_date) ? 'text-red-600 font-medium' : ''}>
                            Due {formatDate(todo.due_date)}
                            {isOverdue(todo.due_date) && ' (Overdue)'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {todo.tags && todo.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {todo.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodoList;
