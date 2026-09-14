import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RevisionCategory } from './types';

interface Props {
  category: RevisionCategory | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated?: RevisionCategory) => void;
}

const predefinedColors = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280',
];

const EditRevisionCategoryModal: React.FC<Props> = ({
  category,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setColor(category.color || '#3B82F6');
    }
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const updatePayload = {
        name: name.trim(),
        color,
      };

      let { data, error } = await supabase
        .from('revision_category')
        .update(updatePayload)
        .eq('id', category.id)
        .select()
        .single();

      if (error) {
        const fallback = await (supabase as any)
          .from('revision_categories')
          .update(updatePayload)
          .eq('id', category.id)
          .select()
          .single();
        if (fallback.error) throw fallback.error;
        data = fallback.data;
      }

      toast.success('Category updated successfully');
      onSuccess(data as RevisionCategory);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update category');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!category) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            Edit Category
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label htmlFor="edit-revision-category-name">Category Name</Label>
            <Input
              id="edit-revision-category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. System Design"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Theme Color</Label>
            <div className="grid grid-cols-5 gap-2.5">
              {predefinedColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Select color ${c}`}
                  className={`w-10 h-10 rounded-lg border-2 transition-all flex items-center justify-center ${
                    color === c ? 'border-foreground scale-110 shadow-sm ring-2 ring-primary/20' : 'border-border/60 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                >
                  {color === c && (
                    <span className="w-2 h-2 rounded-full bg-white shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()} className="gap-1.5">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditRevisionCategoryModal;

