import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { Habit } from '../HabitTracker';

interface EditHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditHabit: (habitId: string, habitData: Omit<Habit, 'id' | 'created_at' | 'updated_at'>) => void;
  habit: Habit | null;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const COMMON_ICONS = [
  'radio_button_checked',
  'fitness_center',
  'book',
  'water_drop',
  'bedtime',
  'directions_run',
  'self_improvement',
  'restaurant',
  'work',
  'school'
];

const COMMON_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
];

const EditHabitModal = ({ isOpen, onClose, onEditHabit, habit }: EditHabitModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    goal: '',
    frequency_type: 'daily' as 'daily' | 'weekly' | 'custom',
    target_count: 1,
    target_period: 'weekly' as 'weekly' | 'monthly' | 'yearly',
    custom_days: [] as number[],
    icon: 'radio_button_checked',
    color: '#3B82F6'
  });

  useEffect(() => {
    if (habit) {
      setFormData({
        name: habit.name,
        goal: habit.goal || '',
        frequency_type: habit.frequency_type,
        target_count: habit.target_count,
        target_period: habit.target_period,
        custom_days: habit.custom_days || [],
        icon: habit.icon || 'radio_button_checked',
        color: habit.color || '#3B82F6'
      });
    }
  }, [habit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habit) return;
    
    const habitData = {
      ...formData,
      goal: formData.goal || undefined,
      custom_days: formData.frequency_type === 'custom' ? formData.custom_days : undefined,
    };
    
    onEditHabit(habit.id, habitData);
  };

  const handleCustomDayToggle = (dayValue: number) => {
    setFormData(prev => ({
      ...prev,
      custom_days: prev.custom_days.includes(dayValue)
        ? prev.custom_days.filter(d => d !== dayValue)
        : [...prev.custom_days, dayValue].sort()
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Habit</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Habit Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Drink 8 glasses of water"
              required
            />
          </div>

          <div>
            <Label htmlFor="goal">Goal (optional)</Label>
            <Textarea
              id="goal"
              value={formData.goal}
              onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
              placeholder="Describe what you want to achieve..."
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Icon</Label>
              <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_ICONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      <div className="flex items-center gap-2">
                        <span className="material-icons text-sm">{icon}</span>
                        <span className="capitalize">{icon.replace(/_/g, ' ')}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Color</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {COMMON_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color ? 'border-foreground' : 'border-muted'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label>Frequency</Label>
            <Select value={formData.frequency_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, frequency_type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="custom">Custom Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.frequency_type === 'custom' && (
            <div>
              <Label>Select Days</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={formData.custom_days.includes(day.value)}
                      onCheckedChange={() => handleCustomDayToggle(day.value)}
                    />
                    <Label htmlFor={`day-${day.value}`} className="text-sm">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="target_count">Target Count</Label>
              <Input
                id="target_count"
                type="number"
                min="1"
                value={formData.target_count}
                onChange={(e) => setFormData(prev => ({ ...prev, target_count: parseInt(e.target.value) || 1 }))}
              />
            </div>

            <div>
              <Label>Target Period</Label>
              <Select value={formData.target_period} onValueChange={(value: any) => setFormData(prev => ({ ...prev, target_period: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Update Habit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditHabitModal;