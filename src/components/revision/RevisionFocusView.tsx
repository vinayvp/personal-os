import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Check, SkipForward, RotateCcw, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RevisionCategory, RevisionElement } from './types';
import AddRevisionElementsModal from './AddRevisionElementsModal';

interface Props {
  categoryId: string;
  onBack: () => void;
}

const RevisionFocusView = ({ categoryId, onBack }: Props) => {
  const [category, setCategory] = useState<RevisionCategory | null>(null);
  const [elements, setElements] = useState<RevisionElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const pickRandom = (els: RevisionElement[], excludeId: string | null) => {
    if (els.length === 0) return null;
    const minCount = Math.min(...els.map((e) => e.count));
    const pool = els.filter((e) => e.count === minCount);
    const filtered = pool.filter((e) => e.id !== excludeId);
    const eligible = filtered.length > 0 ? filtered : pool;
    return eligible[Math.floor(Math.random() * eligible.length)];
  };

  const load = useCallback(async () => {
    try {
      const [catRes, elRes] = await Promise.all([
        supabase.from('revision_category').select('*').eq('id', categoryId).single(),
        supabase.from('revision_element').select('*').eq('category_id', categoryId).order('created_at'),
      ]);
      if (catRes.error) throw catRes.error;
      if (elRes.error) throw elRes.error;

      const cat = catRes.data as RevisionCategory;
      const els = (elRes.data || []) as RevisionElement[];
      setElements(els);

      const currValid = cat.curr_element_id && els.some((e) => e.id === cat.curr_element_id);
      if (!currValid && els.length > 0) {
        const next = pickRandom(els, null);
        if (next) {
          await supabase.from('revision_category').update({ curr_element_id: next.id }).eq('id', categoryId);
          setCategory({ ...cat, curr_element_id: next.id });
          return;
        }
      }
      setCategory(cat);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load revision data');
    } finally {
      setIsLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    load();
  }, [load]);

  const currentElement = elements.find((e) => e.id === category?.curr_element_id) || null;
  const minCount = elements.length ? Math.min(...elements.map((e) => e.count)) : 0;
  const remaining = elements.filter((e) => e.count === minCount).length;
  const total = elements.length;
  const done = total - remaining;
  const progress = total ? (done / total) * 100 : 0;

  const handleDone = async () => {
    if (!currentElement || !category || isBusy) return;
    setIsBusy(true);
    try {
      const newCount = currentElement.count + 1;
      const { error } = await supabase
        .from('revision_element')
        .update({ count: newCount })
        .eq('id', currentElement.id);
      if (error) throw error;

      const updated = elements.map((e) => (e.id === currentElement.id ? { ...e, count: newCount } : e));
      const newMin = Math.min(...updated.map((e) => e.count));
      const next = pickRandom(updated, currentElement.id);

      const patch: Partial<RevisionCategory> = { curr_element_id: next?.id ?? null };
      if (newMin > category.count) patch.count = newMin;

      const { error: catError } = await supabase
        .from('revision_category')
        .update(patch)
        .eq('id', category.id);
      if (catError) throw catError;

      setElements(updated);
      setCategory({ ...category, ...patch } as RevisionCategory);
      if (newMin > category.count) toast.success(`Round ${newMin} complete!`);
      else toast.success('Marked as done');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSkip = async () => {
    if (!category || isBusy || elements.length === 0) return;
    setIsBusy(true);
    try {
      const next = pickRandom(elements, category.curr_element_id);
      if (!next) return;
      const { error } = await supabase
        .from('revision_category')
        .update({ curr_element_id: next.id })
        .eq('id', category.id);
      if (error) throw error;
      setCategory({ ...category, curr_element_id: next.id });
    } catch (error: any) {
      toast.error(error.message || 'Failed to skip');
    } finally {
      setIsBusy(false);
    }
  };

  const handleReset = async () => {
    if (!category || isBusy) return;
    setIsBusy(true);
    try {
      const { error } = await supabase
        .from('revision_element')
        .update({ count: 0 })
        .eq('category_id', category.id);
      if (error) throw error;
      const { error: catError } = await supabase
        .from('revision_category')
        .update({ count: 0, curr_element_id: null })
        .eq('id', category.id);
      if (catError) throw catError;
      toast.success('Round counters reset');
      setIsLoading(true);
      await load();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset');
    } finally {
      setIsBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Categories
        </Button>
        {category && (
          <Badge
            variant="outline"
            style={{ borderColor: category.color, color: category.color }}
          >
            {category.name}
          </Badge>
        )}
        <Badge variant="secondary">Round {(category?.count ?? 0) + 1}</Badge>
        <Badge variant="outline">
          {done} / {total} done — {remaining} left
        </Badge>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Items
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset} disabled={isBusy}>
            <RotateCcw className="h-4 w-4 mr-1" /> Reset
          </Button>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <Card className="min-h-[220px] flex items-center justify-center overflow-hidden">
        <CardContent className="w-full p-6 text-center">
          <AnimatePresence mode="wait">
            {currentElement ? (
              <motion.div
                key={currentElement.id}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.97 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="space-y-3"
              >
                <h2 className="text-2xl md:text-4xl font-semibold text-foreground break-words">
                  {currentElement.name}
                </h2>
                {currentElement.description && (
                  <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto whitespace-pre-wrap">
                    {currentElement.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Completed {currentElement.count} time{currentElement.count === 1 ? '' : 's'}
                </p>
              </motion.div>
            ) : (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-muted-foreground"
              >
                No items yet — add some to start revising.
              </motion.p>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={handleDone} disabled={!currentElement || isBusy}>
          <Check className="h-4 w-4 mr-2" /> Mark as Done
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleSkip}
          disabled={!currentElement || isBusy || elements.length < 2}
        >
          <SkipForward className="h-4 w-4 mr-2" /> Skip / Next
        </Button>
      </div>

      <AddRevisionElementsModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => {
          setIsAddOpen(false);
          load();
        }}
        categoryId={categoryId}
        categoryName={category?.name}
      />
    </div>
  );
};

export default RevisionFocusView;