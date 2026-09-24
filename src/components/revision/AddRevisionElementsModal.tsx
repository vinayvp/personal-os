import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Bold, Italic, Code, List, ListOrdered, Terminal, Eye, Edit3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/appClient';
import { toast } from 'sonner';
import RevisionMarkdown from './RevisionMarkdown';

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
  const [previewMap, setPreviewMap] = useState<Record<number, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

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

  const removeEntry = (index: number) => {
    if (entries.length <= 1) return;
    setEntries((prev) => prev.filter((_, i) => i !== index));
    setPreviewMap((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  const togglePreview = (index: number) => {
    setPreviewMap((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const applyFormat = (index: number, prefix: string, suffix = '', defaultText = '') => {
    const textarea = textareaRefs.current[index];
    const currentVal = entries[index]?.description || '';
    if (!textarea) {
      updateEntry(index, 'description', currentVal ? `${currentVal}\n${prefix}${defaultText}${suffix}` : `${prefix}${defaultText}${suffix}`);
      return;
    }

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selectedText = currentVal.substring(start, end);
    const replacement = selectedText ? `${prefix}${selectedText}${suffix}` : `${prefix}${defaultText}${suffix}`;

    const updated = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    updateEntry(index, 'description', updated);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectedText
        ? start + replacement.length
        : start + prefix.length + defaultText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return;
    const validEntries = entries.filter((entry) => entry.name.trim());
    if (validEntries.length === 0) return;

    setIsSubmitting(true);
    try {
      const payload = validEntries.map((entry) => ({
        category_id: categoryId,
        name: entry.name.trim(),
        description: entry.description.trim() || null,
      }));

      let { error } = await supabase.from('revision_element').insert(payload);
      if (error) {
        const fallback = await (supabase as any).from('revision_elements').insert(payload);
        if (fallback.error) throw error;
      }
      setEntries([{ name: '', description: '' }]);
      setPreviewMap({});
      toast.success(`Added ${validEntries.length} item${validEntries.length > 1 ? 's' : ''}`);
      onSuccess();
    } catch (error: any) {
      console.error('Failed to add revision items:', error);
      toast.error(error.message || 'Failed to add items');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Add Items{categoryName ? ` to ${categoryName}` : ''}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col flex-1 overflow-hidden">
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            {entries.map((entry, index) => {
              const isPreview = !!previewMap[index];
              return (
                <div key={index} className="space-y-3 rounded-lg border border-border p-3.5 bg-card/60">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor={`element-name-${index}`} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Item #{index + 1} Name
                    </Label>
                    {entries.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEntry(index)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        title="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <Input
                    id={`element-name-${index}`}
                    value={entry.name}
                    onChange={(e) => updateEntry(index, 'name', e.target.value)}
                    placeholder="e.g. Binary Search Tree"
                    className="font-medium"
                  />

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`element-description-${index}`} className="text-xs text-muted-foreground">
                        Description / Notes (Markdown)
                      </Label>
                      <Button
                        type="button"
                        variant={isPreview ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => togglePreview(index)}
                        className="h-6 px-2 text-xs gap-1"
                      >
                        {isPreview ? (
                          <>
                            <Edit3 className="h-3 w-3" /> Edit
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" /> Preview
                          </>
                        )}
                      </Button>
                    </div>

                    {!isPreview ? (
                      <div className="space-y-1">
                        {/* Compact Formatting Bar */}
                        <div className="flex items-center gap-0.5 p-1 bg-muted/40 border rounded-t-md text-muted-foreground">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:text-foreground"
                            onClick={() => applyFormat(index, '**', '**', 'bold')}
                            title="Bold (**text**)"
                          >
                            <Bold className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:text-foreground"
                            onClick={() => applyFormat(index, '*', '*', 'italic')}
                            title="Italic (*text*)"
                          >
                            <Italic className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:text-foreground"
                            onClick={() => applyFormat(index, '`', '`', 'code')}
                            title="Inline Code (`code`)"
                          >
                            <Code className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:text-foreground"
                            onClick={() => applyFormat(index, '```\n', '\n```', 'code')}
                            title="Code Block (```)"
                          >
                            <Terminal className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:text-foreground"
                            onClick={() => applyFormat(index, '- ', '', 'list item')}
                            title="Bullet List (- item)"
                          >
                            <List className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:text-foreground"
                            onClick={() => applyFormat(index, '1. ', '', 'first item')}
                            title="Numbered List (1. item)"
                          >
                            <ListOrdered className="h-3 w-3" />
                          </Button>
                        </div>

                        <Textarea
                          ref={(el) => (textareaRefs.current[index] = el)}
                          id={`element-description-${index}`}
                          value={entry.description}
                          onChange={(e) => updateEntry(index, 'description', e.target.value)}
                          placeholder="Add revision notes, bullet points, or code snippets..."
                          rows={3}
                          className="font-mono text-sm resize-y rounded-t-none border-t-0"
                        />
                      </div>
                    ) : (
                      <div className="min-h-[85px] p-3 rounded-md border bg-background/50 overflow-y-auto max-h-[220px]">
                        {entry.description.trim() ? (
                          <RevisionMarkdown content={entry.description} />
                        ) : (
                          <p className="text-xs text-muted-foreground italic text-center py-4">
                            No notes entered yet.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addEntryBelow(index)}
                      className="gap-1 text-xs text-primary"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add another item below
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t shrink-0">
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
