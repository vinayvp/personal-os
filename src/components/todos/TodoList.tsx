import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Trash2,
  Calendar,
  Search,
  Filter,
  CheckSquare,
  Edit2,
  Sparkles,
  X,
  AlertCircle,
  Clock,
  Tag as TagIcon,
  ArrowUpDown,
  CheckCircle2,
  ListFilter,
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast, isBefore, startOfDay } from 'date-fns';
import { Todo } from '../TodoApp';

interface TodoListProps {
  todos: Todo[];
  onToggleComplete: (todoId: string) => void;
  onDeleteTodo: (todoId: string) => void;
  onEditTodo: (todo: Todo) => void;
  hideCompleted?: boolean;
}

type QuickFilter = 'all' | 'pending' | 'completed' | 'overdue' | 'high';
type SortOption = 'due_date' | 'priority' | 'created_at' | 'title';

const TodoList = ({
  todos,
  onToggleComplete,
  onDeleteTodo,
  onEditTodo,
  hideCompleted = false,
}: TodoListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('due_date');

  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [exitingId, setExitingId] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = useMemo(() => {
    return Array.from(new Set(todos.flatMap((todo) => todo.tags || []))).filter(Boolean);
  }, [todos]);

  const isTodoOverdue = (dueDateString?: string, completed?: boolean) => {
    if (!dueDateString || completed) return false;
    const now = startOfDay(new Date());
    const due = startOfDay(new Date(dueDateString));
    return isBefore(due, now);
  };

  // Filter and sort todos
  const filteredTodos = useMemo(() => {
    return todos
      .filter((todo) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (todo.title || '').toLowerCase().includes(q);
          const matchDesc = (todo.description || '').toLowerCase().includes(q);
          const matchTags = (todo.tags || []).some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchTags) return false;
        }

        // Quick Filter
        const overdue = isTodoOverdue(todo.due_date, todo.completed);
        if (quickFilter === 'pending' && todo.completed) return false;
        if (quickFilter === 'completed' && !todo.completed) return false;
        if (quickFilter === 'overdue' && !overdue) return false;
        if (quickFilter === 'high' && todo.priority !== 'high') return false;

        // Priority filter dropdown
        if (filterPriority !== 'all' && todo.priority !== filterPriority) return false;

        // Tag filter dropdown
        if (filterTag !== 'all' && !(todo.tags || []).includes(filterTag)) return false;

        // Hide completed toggle
        if (hideCompleted && todo.completed) return false;

        return true;
      })
      .sort((a, b) => {
        // Completed items always sort towards bottom if mixed
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        if (sortBy === 'due_date') {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }

        if (sortBy === 'priority') {
          const weight = { high: 3, medium: 2, low: 1 };
          return (weight[b.priority] || 0) - (weight[a.priority] || 0);
        }

        if (sortBy === 'created_at') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }

        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }

        return 0;
      });
  }, [todos, searchQuery, quickFilter, filterPriority, filterTag, sortBy, hideCompleted]);

  const handleCompleteWithReward = (todoId: string, willBeCompleted: boolean) => {
    if (willBeCompleted) {
      setCelebratingId(todoId);
      setJustCompletedId(todoId);
      setTimeout(() => setCelebratingId(null), 600);
      setTimeout(() => setJustCompletedId(null), 1400);

      if (hideCompleted) {
        setTimeout(() => setExitingId(todoId), 500);
        setTimeout(() => {
          onToggleComplete(todoId);
          setExitingId(null);
        }, 900);
        return;
      }
    }
    onToggleComplete(todoId);
  };

  const getPriorityBadge = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border bg-rose-500/10 text-rose-400 border-rose-500/20">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border bg-amber-500/10 text-amber-400 border-amber-500/20">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            Low
          </span>
        );
      default:
        return null;
    }
  };

  const renderDueDateBadge = (dueDateStr?: string, completed?: boolean) => {
    if (!dueDateStr) return null;

    try {
      const date = new Date(dueDateStr);
      const overdue = isTodoOverdue(dueDateStr, completed);
      const dueToday = isToday(date);
      const dueTomorrow = isTomorrow(date);

      if (overdue) {
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
            <AlertCircle className="w-3 h-3" />
            <span>Overdue ({format(date, 'MMM d')})</span>
          </span>
        );
      }

      if (dueToday) {
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
            <Clock className="w-3 h-3" />
            <span>Due Today</span>
          </span>
        );
      }

      if (dueTomorrow) {
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-foreground/80 bg-muted/50 border border-border/60 px-2 py-0.5 rounded-md">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <span>Due Tomorrow</span>
          </span>
        );
      }

      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/40 border border-border/50 px-2 py-0.5 rounded-md">
          <Calendar className="w-3 h-3" />
          <span>Due {format(date, 'MMM d, yyyy')}</span>
        </span>
      );
    } catch {
      return (
        <span className="text-[11px] text-muted-foreground">Due {dueDateStr}</span>
      );
    }
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    quickFilter !== 'all' ||
    filterPriority !== 'all' ||
    filterTag !== 'all';

  const resetAllFilters = () => {
    setSearchQuery('');
    setQuickFilter('all');
    setFilterPriority('all');
    setFilterTag('all');
  };

  const overdueCount = useMemo(
    () => todos.filter((t) => isTodoOverdue(t.due_date, t.completed)).length,
    [todos]
  );
  const pendingCount = useMemo(() => todos.filter((t) => !t.completed).length, [todos]);
  const highPriorityCount = useMemo(
    () => todos.filter((t) => t.priority === 'high' && !t.completed).length,
    [todos]
  );

  return (
    <div className="space-y-4">
      {/* Search, Filter Bar & Controls */}
      <div className="space-y-3">
        {/* Top Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search tasks, descriptions, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2">
            {/* Priority Filter */}
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-auto min-w-[120px] h-9 text-xs">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger className="w-auto min-w-[110px] h-9 text-xs">
                  <SelectValue placeholder="Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags ({allTags.length})</SelectItem>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      #{tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-auto min-w-[130px] h-9 text-xs" title="Sort order">
                <ArrowUpDown className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due_date">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="created_at">Newest First</SelectItem>
                <SelectItem value="title">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Filter Segmented Buttons */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <Button
              type="button"
              variant={quickFilter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setQuickFilter('all')}
              className="h-7 text-xs font-medium rounded-lg"
            >
              All ({todos.length})
            </Button>
            <Button
              type="button"
              variant={quickFilter === 'pending' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setQuickFilter('pending')}
              className="h-7 text-xs font-medium rounded-lg"
            >
              Pending ({pendingCount})
            </Button>
            <Button
              type="button"
              variant={quickFilter === 'completed' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setQuickFilter('completed')}
              className="h-7 text-xs font-medium rounded-lg"
            >
              Done ({todos.length - pendingCount})
            </Button>
            {overdueCount > 0 && (
              <Button
                type="button"
                variant={quickFilter === 'overdue' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setQuickFilter('overdue')}
                className="h-7 text-xs font-medium rounded-lg text-rose-400 hover:text-rose-300"
              >
                Overdue ({overdueCount})
              </Button>
            )}
            {highPriorityCount > 0 && (
              <Button
                type="button"
                variant={quickFilter === 'high' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setQuickFilter('high')}
                className="h-7 text-xs font-medium rounded-lg"
              >
                High Priority ({highPriorityCount})
              </Button>
            )}
          </div>

          {/* Filter Status Reset */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
              <span>
                Showing {filteredTodos.length} of {todos.length}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetAllFilters}
                className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
              >
                Reset
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Todo Items List */}
      {filteredTodos.length === 0 ? (
        <Card className="border-dashed bg-card/40">
          <CardContent className="py-14 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                {hasActiveFilters ? 'No matching tasks found' : 'No tasks on your list'}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                {hasActiveFilters
                  ? 'Try clearing your search query or adjusting priority and tag filters.'
                  : 'Add your first task above to start tracking your daily progress and priorities.'}
              </p>
            </div>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetAllFilters}
                className="text-xs h-8"
              >
                Clear all filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filteredTodos.map((todo) => {
            const isCompleted = todo.completed;

            return (
              <Card
                key={todo.id}
                className={`rounded-xl border transition-all duration-200 group ${
                  isCompleted
                    ? 'border-border/50 bg-card/50 opacity-70'
                    : 'border-border/80 bg-card hover:border-border hover:shadow-sm'
                } ${exitingId === todo.id ? 'animate-slide-out-right' : ''}`}
                style={
                  exitingId === todo.id
                    ? { animationFillMode: 'forwards', opacity: 0 }
                    : undefined
                }
              >
                <CardContent className="p-3.5 sm:p-4">
                  <div className="flex items-start gap-3">
                    {/* Checkbox with reward celebration effect */}
                    <div className="relative mt-0.5 shrink-0">
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={() =>
                          handleCompleteWithReward(todo.id, !isCompleted)
                        }
                        className={`relative z-10 w-4 h-4 rounded-sm transition-transform ${
                          celebratingId === todo.id ? 'animate-check-pop' : ''
                        }`}
                        title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                      />
                      {celebratingId === todo.id && (
                        <span className="absolute inset-0 rounded-full border-2 border-primary animate-ring-burst pointer-events-none" />
                      )}
                      {justCompletedId === todo.id && (
                        <Sparkles className="absolute -top-3 -right-3 w-4 h-4 text-amber-400 animate-star-bounce pointer-events-none" />
                      )}
                    </div>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4
                            className={`text-sm sm:text-base font-semibold leading-snug break-words ${
                              isCompleted
                                ? 'line-through text-muted-foreground'
                                : 'text-foreground'
                            }`}
                          >
                            {todo.title}
                          </h4>
                          {todo.description && (
                            <p
                              className={`text-xs sm:text-sm mt-1 whitespace-pre-line leading-relaxed ${
                                isCompleted
                                  ? 'line-through text-muted-foreground/70'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {todo.description}
                            </p>
                          )}
                        </div>

                        {/* Top Right Badges & Controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {getPriorityBadge(todo.priority)}

                          {/* Action Buttons */}
                          <div className="flex items-center opacity-70 group-hover:opacity-100 transition-opacity ml-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEditTodo(todo)}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Edit task"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDeleteTodo(todo.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Footer Row: Due Date, Tags, Created Info */}
                      <div className="flex items-center gap-2 flex-wrap mt-2.5 pt-1 border-t border-border/40 text-xs">
                        {renderDueDateBadge(todo.due_date, isCompleted)}

                        {/* Tags */}
                        {todo.tags && todo.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {todo.tags.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => setFilterTag(tag)}
                                className="inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground border border-border/50 hover:bg-muted hover:text-foreground transition-colors"
                                title={`Filter by #${tag}`}
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                        )}

                        <span className="text-[10px] text-muted-foreground/60 ml-auto font-mono">
                          {format(new Date(todo.created_at), 'MMM d')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TodoList;
