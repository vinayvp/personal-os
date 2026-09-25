import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/appClient';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (element) {
      setName(element.name || (element as any).title || '');
      setDescription(element.description || (element as any).content || '');
      setActiveTab('edit');
      setIsExpanded(false);
    }
  }, [element]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!element || !name.trim() || isSaving) return;

    setIsSaving(true);
    try {
      // 1. Try primary schema: table revision_element with standard columns (name, description)
      let updateRes = await supabase
        .from('revision_element')
        .update({
          name: name.trim(),
          description: description.trim() || null,
        })
        .eq('id', element.id)
        .select()
        .single();

      // 2. Fallbacks if needed (e.g. plural table name or alternative schema columns)
      if (updateRes.error) {
        console.warn('Primary revision_element update failed, attempting fallbacks...', updateRes.error);

        // Fallback A: plural table 'revision_elements' with (name, description)
        const pluralRes = await (supabase as any)
          .from('revision_elements')
          .update({
            name: name.trim(),
            description: description.trim() || null,
          })
          .eq('id', element.id)
          .select()
          .single();

        if (!pluralRes.error) {
          updateRes = pluralRes;
        } else {
          // Fallback B: legacy schema with (title, content)
          const legacyRes = await (supabase as any)
            .from('revision_element')
            .update({
              title: name.trim(),
              content: description.trim() || null,
            })
            .eq('id', element.id)
            .select()
            .single();

          if (!legacyRes.error) {
            updateRes = legacyRes;
          } else {
            throw updateRes.error || pluralRes.error || legacyRes.error;
          }
        }
      }

      const data = updateRes.data;
      const normalized: RevisionElement = {
        id: (data as any)?.id || element.id,
        category_id: (data as any)?.category_id || element.category_id,
        name: (data as any)?.name || (data as any)?.title || name.trim(),
        description: (data as any)?.description || (data as any)?.content || (description.trim() || null),
        count: (data as any)?.count ?? (data as any)?.review_count ?? element.count,
        created_at: (data as any)?.created_at || element.created_at,
      };

      toast.success('Item updated successfully');
      onSuccess(normalized);
      onClose();
    } catch (error: any) {
      console.error('Failed to update revision element:', error);
      toast.error(error.message || 'Failed to update item');
    } finally {
      setIsSaving(false);
    }
  };

  if (!element) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "w-[95vw] max-h-[92vh] flex flex-col p-4 sm:p-6 overflow-hidden transition-all duration-200",
          isExpanded 
            ? "sm:max-w-5xl lg:max-w-6xl h-[90vh]" 
            : activeTab === 'preview'
              ? "sm:max-w-3xl md:max-w-4xl"
              : "sm:max-w-2xl md:max-w-3xl"
        )}
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-1 shrink-0">
          <DialogTitle className="text-lg font-bold">Edit Revision Item</DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hidden sm:inline-flex mr-8"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse modal size" : "Expand modal to wide view"}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="space-y-1.5 shrink-0">
            <Label htmlFor="edit-element-name">Item Name</Label>
            <Input
              id="edit-element-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dijkstra's Algorithm"
              required
            />
          </div>

          <div className="space-y-1.5 flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex items-center justify-between shrink-0">
              <Label htmlFor="edit-element-description">Description / Notes (Markdown)</Label>
            </div>

            <div className="shrink-0">
              <MarkdownToolbar
                textareaRef={textareaRef}
                value={description}
                onChange={setDescription}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>

            {activeTab === 'edit' ? (
              <Textarea
                ref={textareaRef}
                id="edit-element-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write notes with markdown...&#10;&#10;- Point 1&#10;- Point 2&#10;&#10;`const code = true;`"
                rows={8}
                className="font-mono text-sm leading-relaxed resize-y flex-1 min-h-[200px] max-h-[60vh]"
              />
            ) : (
              <div className="flex-1 min-h-[200px] max-h-[65vh] p-4 sm:p-5 rounded-md border bg-background/50 overflow-y-auto overflow-x-auto min-w-0 max-w-full break-words">
                {description.trim() ? (
                  <RevisionMarkdown content={description} />
                ) : (
                  <p className="text-xs text-muted-foreground italic py-12 text-center">
                    No description content to preview. Switch to Edit to write some notes.
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 shrink-0 pt-2 border-t border-border/50">
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

