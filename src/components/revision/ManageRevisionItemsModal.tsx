import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/appClient';
import { toast } from 'sonner';
import { RevisionCategory, RevisionElement } from './types';
import EditRevisionElementModal from './EditRevisionElementModal';

interface Props {
  category: RevisionCategory | null;
  isOpen: boolean;
  onClose: () => void;
  onItemsUpdated: () => void;
  onAddNewItems?: () => void;
}

const ManageRevisionItemsModal: React.FC<Props> = ({
  category,
  isOpen,
  onClose,
  onItemsUpdated,
  onAddNewItems,
}) => {
  const [elements, setElements] = useState<RevisionElement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingElement, setEditingElement] = useState<RevisionElement | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCategoryElements = useCallback(async () => {
    if (!category) return;
    setIsLoading(true);
    try {
      let { data, error } = await supabase
        .from('revision_element')
        .select('*')
        .eq('category_id', category.id)
        .order('created_at', { ascending: true });

      if (error) {
        const fallback = await (supabase as any)
          .from('revision_elements')
          .select('*')
          .eq('category_id', category.id)
          .order('created_at', { ascending: true });
        data = fallback.data;
      }

      const normalized: RevisionElement[] = ((data || []) as any[]).map((e) => ({
        id: e.id,
        category_id: e.category_id,
        name: e.name || e.title || 'Untitled Item',
        description: e.description || e.content || null,
        count: e.count ?? e.review_count ?? 0,
        created_at: e.created_at || new Date().toISOString(),
      }));

      setElements(normalized);
    } catch (err: any) {
      console.warn('Failed to fetch items for category:', err);
      toast.error('Failed to load category items');
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    if (isOpen && category) {
      setSearchQuery('');
      fetchCategoryElements();
    }
  }, [isOpen, category, fetchCategoryElements]);

  const filteredElements = useMemo(() => {
    if (!searchQuery.trim()) return elements;
    const q = searchQuery.toLowerCase();
    return elements.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q))
    );
  }, [elements, searchQuery]);

  const handleDeleteItem = async (elementId: string, itemName: string) => {
    if (deletingId) return;
    setDeletingId(elementId);
    try {
      let { error } = await supabase
        .from('revision_element')
        .delete()
        .eq('id', elementId);

      if (error) {
        const fallback = await (supabase as any)
          .from('revision_elements')
          .delete()
          .eq('id', elementId);
        if (fallback.error) throw fallback.error;
      }

      setElements((prev) => prev.filter((e) => e.id !== elementId));
      toast.success(`Deleted "${itemName}"`);
      onItemsUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete item');
    } finally {
      setDeletingId(null);
    }
  };

  const handleItemUpdated = (updated: RevisionElement) => {
    setElements((prev) =>
      prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e))
    );
    onItemsUpdated();
  };

  if (!category) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-border/60">
            <div className="flex items-center justify-between gap-3 pr-6">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <div>
                  <DialogTitle className="text-lg font-bold">
                    Manage Items: {category.name}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {elements.length} topic{elements.length === 1 ? '' : 's'} registered in this category
                  </p>
                </div>
              </div>
              {onAddNewItems && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 shrink-0"
                  onClick={() => {
                    onClose();
                    onAddNewItems();
                  }}
                >
                  <Plus className="w-4 h-4" /> Add Topics
                </Button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative mt-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics or keywords in notes..."
                className="pl-9 h-9 text-sm"
              />
            </div>
          </DialogHeader>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2.5 divide-y divide-border/40">
            {isLoading ? (
              <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-sm">Loading topics...</span>
              </div>
            ) : filteredElements.length === 0 ? (
              <div className="py-14 text-center text-muted-foreground space-y-3">
                <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground/60" />
                <p className="text-sm">
                  {searchQuery ? 'No topics match your search criteria.' : 'No topics in this category yet.'}
                </p>
                {onAddNewItems && !searchQuery && (
                  <Button
                    size="sm"
                    onClick={() => {
                      onClose();
                      onAddNewItems();
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Your First Topic
                  </Button>
                )}
              </div>
            ) : (
              filteredElements.map((item) => {
                const isDeleting = deletingId === item.id;
                return (
                  <div
                    key={item.id}
                    className="pt-2.5 first:pt-0 flex items-start justify-between gap-3 group rounded-md p-2 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground break-words">
                          {item.name}
                        </span>
                        <Badge variant="secondary" className="text-[11px] px-1.5 py-0 h-5 font-mono">
                          Rev: {item.count}
                        </Badge>
                        {item.description ? (
                          <Badge
                            variant="outline"
                            className="text-[11px] px-1.5 py-0 h-5 gap-1 text-muted-foreground border-border/80"
                          >
                            <FileText className="w-3 h-3 text-primary" /> Notes
                          </Badge>
                        ) : null}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {item.description.replace(/[#*`_~[\]]/g, '')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditingElement(item)}
                        title="Edit topic details & notes"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        disabled={isDeleting}
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        title="Delete topic"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-destructive" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="p-4 border-t border-border/60 bg-muted/20 flex flex-row items-center justify-between sm:justify-between">
            <span className="text-xs text-muted-foreground">
              Showing {filteredElements.length} of {elements.length} item{elements.length === 1 ? '' : 's'}
            </span>
            <Button size="sm" variant="outline" onClick={onClose}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Modal nested */}
      <EditRevisionElementModal
        element={editingElement}
        isOpen={!!editingElement}
        onClose={() => setEditingElement(null)}
        onSuccess={(updated) => {
          handleItemUpdated(updated);
          setEditingElement(null);
        }}
      />
    </>
  );
};

export default ManageRevisionItemsModal;

