import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RevisionElement } from './types';
import MarkdownToolbar from './MarkdownToolbar';
import RevisionMarkdown from './RevisionMarkdown';

interface Props {
  element: RevisionElement | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: RevisionElement) => void;
}

const EditRevisionElementModal: React.FC<Props> = ({ element, isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (element) {
      setName(element.name || '');
      setDescription(element.description || '');
      setActiveTab('edit');
    }
  }, [element]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!element || !name.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const updatedPayload = {
        name: name.trim(),
        description: description.trim() || null,
      };

      const { data, error } = await supabase
        .from('revision_element')
        .update(updatedPayload)
        .eq('id', element.id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Item updated successfully');
      onSuccess(data as RevisionElement);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update item');
    } finally {
      setIsSaving(false);
    }
  };

  if (!element) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Revision Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-element-name">Item Name</Label>
            <Input
              id="edit-element-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dijkstra's Algorithm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-element-description">Description / Notes (Markdown)</Label>
            </div>

            <MarkdownToolbar
              textareaRef={textareaRef}
              value={description}
              onChange={setDescription}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {activeTab === 'edit' ? (
              <Textarea
                ref={textareaRef}
                id="edit-element-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write notes with markdown...&#10;&#10;- Point 1&#10;- Point 2&#10;&#10;`const code = true;`"
                rows={7}
                className="font-mono text-sm leading-relaxed resize-y min-h-[160px]"
              />
            ) : (
              <div className="min-h-[160px] p-3 rounded-md border bg-background/50 overflow-y-auto max-h-[320px]">
                {description.trim() ? (
                  <RevisionMarkdown content={description} />
                ) : (
                  <p className="text-xs text-muted-foreground italic py-8 text-center">
                    No description content to preview. Switch to Edit to write some notes.
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !name.trim()} className="gap-1.5">
              {isSaving ? (
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

export default EditRevisionElementModal;

