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
  const [namesValue, setNamesValue] = useState('');
  const [descriptionsValue, setDescriptionsValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return;
    const names = namesValue
      .split('\n')
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;

    const descriptions = descriptionsValue.split('\n').map((d) => d.trim() || null);

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('revision_element')
        .insert(
          names.map((name, i) => ({
            category_id: categoryId,
            name,
            description: descriptions[i] ?? null,
          }))
        );
      if (error) throw error;
      setNamesValue('');
      setDescriptionsValue('');
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
              value={namesValue}
              onChange={(e) => setNamesValue(e.target.value)}
              placeholder={'Binary Search\nTwo Pointers\nSliding Window'}
              rows={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="revision-descriptions">Description per line (optional, matches each item above)</Label>
            <Textarea
              id="revision-descriptions"
              value={descriptionsValue}
              onChange={(e) => setDescriptionsValue(e.target.value)}
              placeholder={'Algorithm to find a target in a sorted array\nTwo indices moving toward each other\nWindow that slides over arrays or strings'}
              rows={6}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !namesValue.trim()}>
              {isSubmitting ? 'Adding...' : 'Add Items'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRevisionElementsModal;