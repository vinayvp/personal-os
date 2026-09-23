import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Repeat, Trash2, Loader2, FolderPlus, Pencil, List } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RevisionCategory, RevisionElement } from './revision/types';
import CreateRevisionCategoryModal from './revision/CreateRevisionCategoryModal';
import EditRevisionCategoryModal from './revision/EditRevisionCategoryModal';
import AddRevisionElementsModal from './revision/AddRevisionElementsModal';
import ManageRevisionItemsModal from './revision/ManageRevisionItemsModal';
import RevisionFocusView from './revision/RevisionFocusView';
import PageLoader from '@/components/common/PageLoader';
import RefreshButton from '@/components/common/RefreshButton';

const RevisionApp = () => {
  const [categories, setCategories] = useState<RevisionCategory[]>([]);
  const [elements, setElements] = useState<RevisionElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<RevisionCategory | null>(null);
  const [managingCategory, setManagingCategory] = useState<RevisionCategory | null>(null);
  const [addItemsFor, setAddItemsFor] = useState<RevisionCategory | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      let [catRes, elRes] = await Promise.all([
        supabase.from('revision_category').select('*').order('created_at'),
        supabase.from('revision_element').select('*'),
      ]);

      if (catRes.error) {
        catRes = await (supabase as any).from('revision_categories').select('*').order('created_at');
      }
      if (elRes.error) {
        elRes = await (supabase as any).from('revision_elements').select('*');
      }

      setCategories((catRes.data || []) as RevisionCategory[]);
      setElements((elRes.data || []) as RevisionElement[]);
    } catch (error: any) {
      console.warn('Failed to load revision items:', error);
      setCategories([]);
      setElements([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteCategory = async (id: string) => {
    try {
      const { error } = await supabase.from('revision_category').delete().eq('id', id);
      if (error) throw error;
      toast.success('Category deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete category');
    }
  };

  if (activeCategoryId) {
    return (
      <div 
        className="h-[calc(100vh-4.25rem)] max-w-3xl mx-auto p-4 md:p-6 flex flex-col"
        style={{ height: 'calc(100dvh - 4.25rem)' }}
      >
        <RevisionFocusView
          categoryId={activeCategoryId}
          onBack={() => {
            setActiveCategoryId(null);
            fetchData();
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Repeat className="h-5 w-5 text-primary" />
          <h2 className="text-lg md:text-xl font-bold text-foreground">Revision</h2>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={fetchData} />
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <FolderPlus className="h-4 w-4 mr-2" /> New Category
          </Button>
        </div>
      </div>

      {isLoading ? (
        <PageLoader fullScreen={false} />
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No revision categories yet. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const els = elements.filter((e) => e.category_id === cat.id);
            const total = els.length;
            const minCount = total ? Math.min(...els.map((e) => e.count)) : 0;
            const remaining = els.filter((e) => e.count === minCount).length;
            const progress = total ? ((total - remaining) / total) * 100 : 0;
            return (
              <Card key={cat.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </CardTitle>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditingCategory(cat)}
                        title="Edit Category"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteCategory(cat.id)}
                        title="Delete Category"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 flex flex-col">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Round {cat.count + 1}</Badge>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => setManagingCategory(cat)}
                      title="Click to manage items"
                    >
                      {total} items
                    </Badge>
                    <Badge variant="outline">{remaining} left</Badge>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                  <div className="flex gap-2 mt-auto pt-1">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => setActiveCategoryId(cat.id)}
                      disabled={total === 0}
                    >
                      Revise
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setManagingCategory(cat)}
                      title="Manage topics / items"
                      className="px-2.5"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddItemsFor(cat)}
                      title="Add topics"
                      className="px-2.5"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateRevisionCategoryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
          fetchData();
        }}
      />
      <EditRevisionCategoryModal
        category={editingCategory}
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        onSuccess={() => {
          setEditingCategory(null);
          fetchData();
        }}
      />
      <AddRevisionElementsModal
        isOpen={!!addItemsFor}
        onClose={() => setAddItemsFor(null)}
        onSuccess={() => {
          setAddItemsFor(null);
          fetchData();
        }}
        categoryId={addItemsFor?.id ?? null}
        categoryName={addItemsFor?.name}
      />
      <ManageRevisionItemsModal
        category={managingCategory}
        isOpen={!!managingCategory}
        onClose={() => setManagingCategory(null)}
        onItemsUpdated={fetchData}
        onAddNewItems={() => {
          const target = managingCategory;
          setManagingCategory(null);
          setAddItemsFor(target);
        }}
      />
    </div>
  );
};

export default RevisionApp;