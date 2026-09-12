import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Calculator,
  Plus,
  Trash2,
  Target,
  Sparkles,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AtsPlatform, getAtsPlatforms } from '@/integrations/supabase/jobClient';

export interface AtsSourceEntry {
  id: string;
  platform_id?: string | null;
  source: string;
  score: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (averageScore: number, sources?: AtsSourceEntry[]) => void;
  initialScore?: number | null;
  savedSources?: AtsSourceEntry[];
}

const COMMON_SUGGESTIONS = [
  'ChatGPT',
  'Jobscan',
  'Resume Worded',
  'Teal',
  'Cultivated Culture',
  'SkillSyncer',
  'Careerflow',
];

const DEFAULT_SOURCES: AtsSourceEntry[] = [
  { id: 'src_1', source: 'ChatGPT', score: '' },
  { id: 'src_2', source: 'Jobscan', score: '' },
];

export const AtsCalculatorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onApply,
  initialScore,
  savedSources,
}) => {
  const { toast } = useToast();
  const [platforms, setPlatforms] = useState<AtsPlatform[]>([]);
  const [sources, setSources] = useState<AtsSourceEntry[]>(DEFAULT_SOURCES);

  useEffect(() => {
    if (isOpen) {
      getAtsPlatforms().then((data) => {
        if (data && data.length > 0) setPlatforms(data);
      });

      if (savedSources && savedSources.length > 0) {
        setSources(savedSources);
      } else if (initialScore != null && initialScore > 0) {
        setSources([
          { id: 'src_1', source: 'ChatGPT', score: String(initialScore) },
          { id: 'src_2', source: 'Jobscan', score: '' },
        ]);
      } else {
        setSources(DEFAULT_SOURCES);
      }
    }
  }, [isOpen, savedSources, initialScore]);

  const handleAddSource = (name = '', platformId?: string) => {
    const matched = platforms.find((p) => p.name.toLowerCase() === name.toLowerCase());
    const newEntry: AtsSourceEntry = {
      id: `src_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      platform_id: platformId || matched?.id || null,
      source: name,
      score: '',
    };
    setSources((prev) => [...prev, newEntry]);
  };

  const handleRemoveSource = (id: string) => {
    setSources((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      return filtered.length > 0
        ? filtered
        : [{ id: `src_${Date.now()}`, source: '', score: '' }];
    });
  };

  const handleUpdateSource = (id: string, field: 'source' | 'score', value: string) => {
    setSources((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (field === 'score') {
          // Keep only numeric characters within 0 - 100
          if (value === '') return { ...item, score: '' };
          const num = Number(value);
          if (isNaN(num)) return item;
          const clamped = Math.min(100, Math.max(0, num));
          return { ...item, score: String(clamped) };
        }
        const matched = platforms.find((p) => p.name.toLowerCase() === value.trim().toLowerCase());
        return { ...item, source: value, platform_id: matched?.id || item.platform_id || null };
      })
    );
  };

  const handleReset = () => {
    setSources(DEFAULT_SOURCES);
  };

  // Valid entries for calculation: rows where score is a valid number 0-100
  const validScores = sources
    .map((s) => ({
      ...s,
      numScore: s.score.trim() !== '' ? Number(s.score) : NaN,
    }))
    .filter((s) => !isNaN(s.numScore) && s.numScore >= 0 && s.numScore <= 100);

  const averageScore =
    validScores.length > 0
      ? Math.round(
          validScores.reduce((acc, curr) => acc + curr.numScore, 0) / validScores.length
        )
      : null;

  const handleApply = () => {
    if (averageScore == null) {
      toast({
        variant: 'destructive',
        title: 'No Valid Scores',
        description: 'Please enter at least one ATS match score (0-100%).',
      });
      return;
    }

    // Resolve platform_ids if available
    const resolvedSources = sources
      .filter((s) => s.score.trim() !== '' && !isNaN(Number(s.score)))
      .map((s) => {
        if (!s.platform_id && s.source.trim()) {
          const matched = platforms.find((p) => p.name.toLowerCase() === s.source.trim().toLowerCase());
          if (matched) return { ...s, platform_id: matched.id };
        }
        return s;
      });

    onApply(averageScore, resolvedSources);
    toast({
      title: 'ATS Score Averaged',
      description: `Applied ${averageScore}% across ${validScores.length} source${
        validScores.length === 1 ? '' : 's'
      }.`,
    });
    onClose();
  };

  // Remaining suggestions that aren't already added
  const suggestionList = platforms.length > 0
    ? platforms.map((p) => p.name)
    : COMMON_SUGGESTIONS;

  const availableSuggestions = suggestionList.filter(
    (name) => !sources.some((s) => s.source.toLowerCase() === name.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-5 sm:p-6">
        <DialogHeader className="text-left pb-3 border-b border-border/60 space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-1.5">
                ATS Score Calculator
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Average ATS match scores from multiple scanners and tools.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Live Average Calculation Preview Card */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              averageScore != null
                ? averageScore >= 80
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : averageScore >= 60
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-rose-500/10 border-rose-500/30'
                : 'bg-muted/30 border-border/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-primary" />
                Calculated Average
              </span>

              {averageScore != null && (
                <span className="text-[11px] font-medium text-muted-foreground">
                  {validScores.length} source{validScores.length === 1 ? '' : 's'} counted
                </span>
              )}
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-3">
              <div>
                {averageScore != null ? (
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-3xl font-black font-mono tracking-tight ${
                        averageScore >= 80
                          ? 'text-emerald-400'
                          : averageScore >= 60
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {averageScore}%
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        averageScore >= 80
                          ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                          : averageScore >= 60
                          ? 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                          : 'border-rose-500/40 text-rose-400 bg-rose-500/10'
                      }`}
                    >
                      {averageScore >= 80
                        ? 'Strong Match'
                        : averageScore >= 60
                        ? 'Good Match'
                        : 'Needs Review'}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">
                    Enter scores below to compute average
                  </span>
                )}
              </div>

              {averageScore != null && validScores.length > 1 && (
                <span className="text-[11px] font-mono text-muted-foreground text-right truncate max-w-[180px]">
                  ({validScores.map((s) => s.numScore).join(' + ')}) / {validScores.length}
                </span>
              )}
            </div>
          </div>

          {/* Quick Suggestions Chips */}
          {availableSuggestions.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                Quick-add popular scanners:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {availableSuggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleAddSource(name)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-muted/60 hover:bg-primary/15 hover:text-primary border border-border/50 transition-colors text-foreground/80 font-medium"
                  >
                    + {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sources and Scores List */}
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
              <span>Source / Tool Name</span>
              <span>Match Score (%)</span>
            </div>

            {sources.map((entry, index) => (
              <div key={entry.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="e.g. ChatGPT, Jobscan..."
                    value={entry.source}
                    onChange={(e) => handleUpdateSource(entry.id, 'source', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="w-24 relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="85"
                    value={entry.score}
                    onChange={(e) => handleUpdateSource(entry.id, 'score', e.target.value)}
                    className="h-8 text-xs font-mono pr-6"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    %
                  </span>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleRemoveSource(entry.id)}
                  title="Remove source"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => handleAddSource('')}
            >
              <Plus className="w-3 h-3" />
              Add Another Source
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground"
              onClick={handleReset}
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-border/60 flex items-center justify-between sm:justify-between w-full gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            disabled={averageScore == null}
            className="gap-1.5 text-xs font-semibold"
          >
            <Check className="w-3.5 h-3.5" />
            {averageScore != null
              ? `Apply Average (${averageScore}%)`
              : 'Apply Score'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AtsCalculatorModal;

