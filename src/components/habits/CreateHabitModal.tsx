
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import type { Habit } from '../HabitTracker';

interface CreateHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateHabit: (habit: Omit<Habit, 'id' | 'created_at' | 'updated_at'>) => void;
}

const CreateHabitModal = ({ isOpen, onClose, onCreateHabit }: CreateHabitModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    goal: '',
    frequency_type: 'daily' as 'daily' | 'weekly' | 'custom' | 'none',
    target_count: 1,
    target_period: 'weekly' as 'weekly' | 'monthly' | 'yearly' | 'total',
    custom_days: [] as number[],
    icon: 'radio_button_checked',
    color: '#3B82F6',
    end_date: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const dayNames = [
    { label: 'Sunday', value: 0 },
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 }
  ];

  const commonIcons = [
    { name: 'radio_button_checked', label: 'Default' },
    { name: 'fitness_center', label: 'Fitness' },
    { name: 'local_drink', label: 'Drink' },
    { name: 'menu_book', label: 'Reading' },
    { name: 'directions_run', label: 'Running' },
    { name: 'self_improvement', label: 'Meditation' },
    { name: 'bedtime', label: 'Sleep' },
    { name: 'restaurant', label: 'Eating' },
    { name: 'work', label: 'Work' },
    { name: 'school', label: 'Study' },
    { name: 'music_note', label: 'Music' },
    { name: 'brush', label: 'Creative' },
    { name: 'spa', label: 'Wellness' },
    { name: 'phone', label: 'Communication' },
    { name: 'home', label: 'Home' },
    { name: 'favorite', label: 'Health' },
    { name: 'attach_money', label: 'Money' },
    { name: 'savings', label: 'Savings' },
    { name: 'account_balance', label: 'Finance' },
    { name: 'trending_up', label: 'Investment' }
  ];

  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Habit name is required';
    }

    if (formData.target_count < 1) {
      newErrors.target_count = 'Target count must be at least 1';
    }

    if (formData.frequency_type === 'custom' && formData.custom_days.length === 0) {
      newErrors.custom_days = 'Please select at least one day';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const habitData = {
      name: formData.name.trim(),
      goal: formData.goal.trim() || undefined,
      frequency_type: formData.frequency_type,
      target_count: formData.target_count,
      target_period: formData.target_period,
      custom_days: formData.frequency_type === 'custom' ? formData.custom_days : undefined,
      icon: formData.icon,
      color: formData.color,
      end_date: formData.end_date || undefined
    };

    onCreateHabit(habitData);
    handleReset();
  };

  const handleReset = () => {
    setFormData({
      name: '',
      goal: '',
      frequency_type: 'daily',
      target_count: 1,
      target_period: 'weekly',
      custom_days: [],
      icon: 'radio_button_checked',
      color: '#3B82F6',
      end_date: ''
    });
    setErrors({});
    onClose();
  };

  const showTargetPeriod = formData.frequency_type !== 'none';

  const handleCustomDayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      custom_days: prev.custom_days.includes(day)
        ? prev.custom_days.filter(d => d !== day)
        : [...prev.custom_days, day].sort()
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Habit</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Habit Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Drink 8 glasses of water"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Goal (Optional)</Label>
            <Textarea
              id="goal"
              value={formData.goal}
              onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
              placeholder="Describe why this habit is important to you..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-sm" style={{ color: formData.color }}>
                      {formData.icon}
                    </span>
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {commonIcons.map((icon) => (
                    <SelectItem key={icon.name} value={icon.name}>
                      <div className="flex items-center gap-2">
                        <span className="material-icons text-sm">{icon.name}</span>
                        <span>{icon.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-6 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color ? 'border-gray-400' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-full h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select
              value={formData.frequency_type}
              onValueChange={(value: 'daily' | 'weekly' | 'custom' | 'none') => 
                setFormData(prev => ({ 
                  ...prev, 
                  frequency_type: value, 
                  custom_days: [],
                  target_period: value === 'none' ? 'total' : prev.target_period === 'total' ? 'weekly' : prev.target_period
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="custom">Custom Days</SelectItem>
                <SelectItem value="none">No Frequency (Total Count Only)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.frequency_type === 'custom' && (
            <div className="space-y-2">
              <Label>Select Days</Label>
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    {dayNames.map((day) => (
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
                </CardContent>
              </Card>
              {errors.custom_days && (
                <p className="text-sm text-destructive">{errors.custom_days}</p>
              )}
            </div>
          )}

          <div className={formData.frequency_type === 'none' ? '' : 'grid grid-cols-2 gap-4'}>
            <div className="space-y-2">
              <Label htmlFor="target_count">
                {formData.frequency_type === 'none' ? 'Total Target Count' : 'Target Count'}
              </Label>
              <Input
                id="target_count"
                type="number"
                min="1"
                value={formData.target_count}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  target_count: Math.max(1, parseInt(e.target.value) || 1)
                }))}
                className={errors.target_count ? 'border-destructive' : ''}
              />
              {errors.target_count && (
                <p className="text-sm text-destructive">{errors.target_count}</p>
              )}
              {formData.frequency_type === 'none' && (
                <p className="text-xs text-muted-foreground">
                  Track progress toward a total goal (e.g., complete 30 lessons)
                </p>
              )}
            </div>

            {formData.frequency_type !== 'none' && (
              <div className="space-y-2">
                <Label>Per</Label>
                <Select
                  value={formData.target_period}
                  onValueChange={(value: 'weekly' | 'monthly' | 'yearly') => 
                    setFormData(prev => ({ ...prev, target_period: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Week</SelectItem>
                    <SelectItem value="monthly">Month</SelectItem>
                    <SelectItem value="yearly">Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">End Date (Optional)</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Habit will stop showing after this date
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleReset}>
              Cancel
            </Button>
            <Button type="submit">
              Create Habit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateHabitModal;
