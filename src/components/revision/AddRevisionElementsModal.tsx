import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ElementEntry {
  name: string;
  description: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryId: string | null;
  categoryName?: string;
}

const AddRevisionElementsModal = ({ isOpen, onClose, onSuccess, categoryId, categoryName }: Props) => {
  const [entries, setEntries] = useState<ElementEntry[]>([{ name: '', description: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateEntry = (index: number, field: keyof ElementEntry, value: string) => {
    setEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)));
  };

  const addEntryBelow = (index: number) => {
    setEntries((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, { name: '', description: '' });
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return;
    const validEntries = entries.filter((entry) => entry.name.trim());
    if (validEntries.length === 0) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('revision_element').insert(
        validEntries.map((entry) => ({
          category_id: categoryId,
          name: entry.name.trim(),
          description: entry.description.trim() || null,
        }))
      );
      if (error) throw error;
      setEntries([{ name: '', description: '' }]);
      toast.success(`Added ${validEntries.length} item${validEntries.length > 1 ? 's' : ''}`);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add items');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Items{categoryName ? ` to ${categoryName}` : ''}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {entries.map((entry, index) => (
              <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                <div className="space-y-1">
                  <Label htmlFor={`element-name-${index}`}>Item name</Label>
                  <Input
                    id={`element-name-${index}`}
                    value={entry.name}
                    onChange={(e) => updateEntry(index, 'name', e.target.value)}
                    placeholder="e.g. Binary Search"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`element-description-${index}`}>Description</Label>
                  <Textarea
                    id={`element-description-${index}`}
                    value={entry.description}
                    onChange={(e) => updateEntry(index, 'description', e.target.value)}
                    placeholder="Optional description"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addEntryBelow(index)}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add another below
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !entries.some((e) => e.name.trim())}>
              {isSubmitting ? 'Adding...' : 'Add Items'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRevisionElementsModal;
