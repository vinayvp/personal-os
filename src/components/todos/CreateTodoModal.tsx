import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Calendar as CalendarIcon, Tag as TagIcon, CheckSquare } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Todo } from '../TodoApp';

interface CreateTodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTodo: (todoData: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) => void;
}

const CreateTodoModal: React.FC<CreateTodoModalProps> = ({ isOpen, onClose, onCreateTodo }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    due_date: '',
    completed: false,
  });

  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    onCreateTodo({
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      priority: formData.priority,
      due_date: formData.due_date || undefined,
      completed: false,
      tags: tags.length > 0 ? tags : undefined,
    });

    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
      completed: false,
    });
    setTags([]);
    setNewTag('');
    onClose();
  };

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
    setFormData((prev) => ({ ...prev, due_date: format(target, 'yyyy-MM-dd') }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border/80 shadow-lg">
        <DialogHeader className="pb-1">
          <div className="flex items-center gap-2 text-foreground">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-bold">Create New Task</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Add a task with deadline, priority level, and category tags
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold text-foreground">
              Task Title <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="What needs to be done?"
              required
              autoFocus
              className="text-sm h-9"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-foreground">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Add extra context, notes, or subtasks..."
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
                onClick={() => setFormData((prev) => ({ ...prev, priority: 'low' }))}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                  formData.priority === 'low'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm'
                    : 'bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted'
                }`}
              >
                Low
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, priority: 'medium' }))}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                  formData.priority === 'medium'
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-sm'
                    : 'bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted'
                }`}
              >
                Medium
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, priority: 'high' }))}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                  formData.priority === 'high'
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
              <Label htmlFor="due_date" className="text-xs font-semibold text-foreground">
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
                {formData.due_date && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, due_date: '' }))}
                    className="text-[10px] text-rose-400 hover:text-rose-300 px-1 py-0.5"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData((prev) => ({ ...prev, due_date: e.target.value }))}
              className="text-xs sm:text-sm h-9"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="tags" className="text-xs font-semibold text-foreground">
              Tags & Categories
            </Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="e.g. Work, Personal, Feature (press Enter)..."
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
              onClick={handleClose}
              className="flex-1 text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 text-xs h-9 font-semibold shadow-sm"
            >
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTodoModal;
