import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/appClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Edit2, X } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Todo } from '../TodoApp';

interface EditTodoModalProps {
  todo: Todo | null;
  onTodoUpdated: () => void;
  onClose: () => void;
}

const EditTodoModal: React.FC<EditTodoModalProps> = ({ todo, onTodoUpdated, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDateStr, setDueDateStr] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (todo) {
      setTitle(todo.title || '');
      setDescription(todo.description || '');
      setPriority((todo.priority as 'low' | 'medium' | 'high') || 'medium');
      setDueDateStr(
        todo.due_date ? format(new Date(todo.due_date), 'yyyy-MM-dd') : ''
      );
      setTags(todo.tags || []);
    }
  }, [todo]);

  const addTag = () => {
    const clean = newTag.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags((prev) => [...prev, clean]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const setPresetDate = (daysFromNow: number) => {
    const target = addDays(new Date(), daysFromNow);
    setDueDateStr(format(target, 'yyyy-MM-dd'));
  };

  const handleUpdateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todo) return;

    if (!title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a title for your task.',
      });
      return;
    }

    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('todos' as any)
        .update({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          due_date: dueDateStr ? dueDateStr : null,
          tags: tags.length > 0 ? tags : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', todo.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task updated successfully!',
      });

      onClose();
      onTodoUpdated();
    } catch (error) {
      console.error('Error updating todo:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update task. Please try again.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={!!todo} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border/80 shadow-lg">
        <DialogHeader className="pb-1">
          <div className="flex items-center gap-2 text-foreground">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Edit2 className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-bold">Edit Task</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Update task details, deadline, and priority status
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdateTodo} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-title" className="text-xs font-semibold text-foreground">
              Task Title <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
              className="text-sm h-9"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-description" className="text-xs font-semibold text-foreground">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional notes or context..."
              rows={2}
              className="text-xs sm:text-sm resize-none"
            />
          </div>

          {/* Priority Segmented Control */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Priority</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('low')}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                  priority === 'low'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm'
                    : 'bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted'
                }`}
              >
                Low
              </button>
              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                  priority === 'medium'
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-sm'
                    : 'bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted'
                }`}
              >
                Medium
              </button>
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                  priority === 'high'
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-sm'
                    : 'bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted'
                }`}
              >
                High
              </button>
            </div>
          </div>

          {/* Due Date with Quick Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-due_date" className="text-xs font-semibold text-foreground">
                Due Date
              </Label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPresetDate(0)}
                  className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded bg-muted/40 border border-border/50"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDate(1)}
                  className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded bg-muted/40 border border-border/50"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDate(7)}
                  className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded bg-muted/40 border border-border/50"
                >
                  +7d
                </button>
                {dueDateStr && (
                  <button
                    type="button"
                    onClick={() => setDueDateStr('')}
                    className="text-[10px] text-rose-400 hover:text-rose-300 px-1 py-0.5"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <Input
              id="edit-due_date"
              type="date"
              value={dueDateStr}
              onChange={(e) => setDueDateStr(e.target.value)}
              className="text-xs sm:text-sm h-9"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-tags" className="text-xs font-semibold text-foreground">
              Tags & Categories
            </Label>
            <div className="flex gap-2">
              <Input
                id="edit-tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add a tag..."
                className="text-xs h-9 flex-1"
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm" className="h-9 px-3 text-xs">
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[11px] font-mono py-0.5 pl-2 pr-1.5 gap-1 bg-muted/60 text-muted-foreground border border-border/60"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-foreground rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex gap-2 pt-3 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 text-xs h-9"
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              className="flex-1 text-xs h-9 font-semibold shadow-sm"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTodoModal;