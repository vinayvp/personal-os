import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryId: string | null;
  categoryName?: string;
}

const AddRevisionElementsModal = ({ isOpen, onClose, onSuccess, categoryId, categoryName }: Props) => {
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return;
    const names = value
      .split('\n')
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('revision_element')
        .insert(names.map((name) => ({ category_id: categoryId, name })));
      if (error) throw error;
      setValue('');
      toast.success(`Added ${names.length} item${names.length > 1 ? 's' : ''}`);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add items');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Items{categoryName ? ` to ${categoryName}` : ''}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="revision-elements">One item per line</Label>
            <Textarea
              id="revision-elements"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={'Binary Search\nTwo Pointers\nSliding Window'}
              rows={8}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !value.trim()}>
              {isSubmitting ? 'Adding...' : 'Add Items'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRevisionElementsModal;