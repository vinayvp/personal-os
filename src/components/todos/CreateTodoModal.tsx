
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Todo } from '../TodoApp';

interface CreateTodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTodo: (todoData: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) => void;
}

const CreateTodoModal = ({ isOpen, onClose, onCreateTodo }: CreateTodoModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    due_date: '',
    completed: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    onCreateTodo({
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      priority: formData.priority,
      due_date: formData.due_date || undefined,
      completed: false
    });

    // Reset form
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
      completed: false
    });
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
      completed: false
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Todo</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter todo title..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter todo description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => 
              setFormData(prev => ({ ...prev, priority: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create Todo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTodoModal;
