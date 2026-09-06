import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Globe, MapPin, Link2, Sparkles, Loader2, X, Plus } from 'lucide-react';
import { JobPlatform, NewJobPlatform } from './types';
import { createJobPlatform, updateJobPlatform } from '@/integrations/supabase/jobClient';
import { useToast } from '@/hooks/use-toast';

interface PlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (platform: JobPlatform) => void;
  editingPlatform?: JobPlatform | null;
}

const POPULAR_COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'European Union',
  'Germany',
  'Canada',
  'Singapore',
  'United Arab Emirates',
  'Australia',
  'Remote / Global',
];

export const PlatformModal: React.FC<PlatformModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPlatform,
}) => {
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [scope, setScope] = useState<'global' | 'specific'>('global');
  const [countries, setCountries] = useState<string[]>([]);
  const [customCountryInput, setCustomCountryInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingPlatform) {
        setName(editingPlatform.name || '');
        setUrl(editingPlatform.url || '');
        setScope(editingPlatform.scope || 'global');
        setCountries(editingPlatform.countries || []);
        setNotes(editingPlatform.notes || '');
      } else {
        setName('');
        setUrl('');
        setScope('global');
        setCountries([]);
        setNotes('');
      }
      setCustomCountryInput('');
    }
  }, [isOpen, editingPlatform]);

  const handleToggleCountry = (country: string) => {
    if (countries.includes(country)) {
      setCountries(countries.filter((c) => c !== country));
    } else {
      setCountries([...countries, country]);
    }
  };

  const handleAddCustomCountry = () => {
    const trimmed = customCountryInput.trim();
    if (!trimmed) return;
    if (!countries.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCountries([...countries, trimmed]);
    }
    setCustomCountryInput('');
  };

  const handleRemoveCountry = (countryToRemove: string) => {
    setCountries(countries.filter((c) => c !== countryToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Platform name required',
        description: 'Please enter a name for the job platform.',
      });
      return;
    }

    if (!url.trim()) {
      toast({
        variant: 'destructive',
        title: 'Platform URL required',
        description: 'Please provide the URL to the job portal.',
      });
      return;
    }

    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    setIsSaving(true);
    try {
      if (editingPlatform) {
        const updated = await updateJobPlatform(editingPlatform.id, {
          name: name.trim(),
          url: finalUrl,
          scope,
          countries: scope === 'specific' && countries.length > 0 ? countries : null,
          notes: notes.trim() || null,
        });

        toast({
          title: 'Platform updated',
          description: `${updated.name} has been updated.`,
        });
        onSave(updated);
      } else {
        const payload: NewJobPlatform = {
          name: name.trim(),
          url: finalUrl,
          scope,
          countries: scope === 'specific' && countries.length > 0 ? countries : null,
          notes: notes.trim() || null,
        };

        const created = await createJobPlatform(payload);
        toast({
          title: 'Platform added',
          description: `${created.name} added to your platform directory.`,
        });
        onSave(created);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to save platform:', err);
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: err?.message || 'Could not save job platform.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5 text-primary" />
            {editingPlatform ? 'Edit Job Platform' : 'Add Job Platform'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Platform Name */}
          <div className="space-y-1.5">
            <Label htmlFor="platform-name" className="text-xs font-semibold">
              Platform Name <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="platform-name"
              placeholder="e.g. LinkedIn, Wellfound, Naukri"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-9 text-sm"
            />
          </div>

          {/* Platform Website URL */}
          <div className="space-y-1.5">
            <Label htmlFor="platform-url" className="text-xs font-semibold">
              Website / Jobs Link <span className="text-rose-400">*</span>
            </Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="platform-url"
                type="text"
                placeholder="https://www.linkedin.com/jobs"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="pl-9 h-9 text-sm font-mono text-xs"
              />
            </div>
          </div>

          {/* Scope Selector: Global vs Country-Specific */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Geographic Scope</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope('global')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  scope === 'global'
                    ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/30'
                    : 'border-border bg-card/60 hover:bg-muted/60 text-muted-foreground'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>General (All Countries)</span>
              </button>
              <button
                type="button"
                onClick={() => setScope('specific')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  scope === 'specific'
                    ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/30'
                    : 'border-border bg-card/60 hover:bg-muted/60 text-muted-foreground'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Specific Countries</span>
              </button>
            </div>
          </div>

          {/* Country Selection (Only if specific) */}
          {scope === 'specific' && (
            <div className="space-y-2.5 p-3 rounded-xl bg-muted/20 border border-border/70">
              <Label className="text-xs font-medium text-foreground flex items-center justify-between">
                <span>Applicable Countries / Regions</span>
                <span className="text-[11px] text-muted-foreground">
                  {countries.length} selected
                </span>
              </Label>

              {/* Selected country tags */}
              {countries.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto py-1">
                  {countries.map((c) => (
                    <Badge
                      key={c}
                      variant="secondary"
                      className="gap-1 pl-2 pr-1.5 py-0.5 text-xs bg-primary/15 text-primary border border-primary/20"
                    >
                      <span>{c}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCountry(c)}
                        className="hover:text-foreground rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add custom country */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type country name..."
                  value={customCountryInput}
                  onChange={(e) => setCustomCountryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomCountry();
                    }
                  }}
                  className="h-8 text-xs flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCustomCountry}
                  disabled={!customCountryInput.trim()}
                  className="h-8 px-2.5 text-xs gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </Button>
              </div>

              {/* Quick suggestions */}
              <div>
                <span className="text-[11px] text-muted-foreground block mb-1.5">
                  Quick suggestions:
                </span>
                <div className="flex flex-wrap gap-1">
                  {POPULAR_COUNTRIES.map((c) => {
                    const isSelected = countries.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleToggleCountry(c)}
                        className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors ${
                          isSelected
                            ? 'bg-primary/20 text-primary border-primary/40 font-medium'
                            : 'bg-background hover:bg-muted text-muted-foreground border-border/70'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Notes / Tips */}
          <div className="space-y-1.5">
            <Label htmlFor="platform-notes" className="text-xs font-semibold">
              Notes & Tips <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="platform-notes"
              placeholder="e.g. Best for US remote startups, check postings every Tuesday, filter by Series B..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="text-xs h-9 gap-1.5">
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : editingPlatform ? (
                'Save Changes'
              ) : (
                'Add Platform'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
