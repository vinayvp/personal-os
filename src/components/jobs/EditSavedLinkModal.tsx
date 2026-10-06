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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pencil,
  Link2,
  Sparkles,
  Loader2,
  Clock,
  CheckCircle2,
  Archive,
} from 'lucide-react';
import { SavedJobLink, JobPlatform } from './types';
import { updateSavedJobLink, findPlatformByUrl } from '@/integrations/supabase/jobClient';
import { useToast } from '@/hooks/use-toast';

interface EditSavedLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: SavedJobLink) => void;
  link: SavedJobLink | null;
  platforms?: JobPlatform[];
  onOpenAddPlatform?: () => void;
}

const EditSavedLinkModal: React.FC<EditSavedLinkModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  link,
  platforms = [],
  onOpenAddPlatform,
}) => {
  const { toast } = useToast();

  const [url, setUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [roleName, setRoleName] = useState('');
  const [location, setLocation] = useState('');
  const [selectedPlatformId, setSelectedPlatformId] = useState('');
  const [isCustomSource, setIsCustomSource] = useState(false);
  const [customSource, setCustomSource] = useState('');
  const [deadline, setDeadline] = useState('');
  const [salaryNote, setSalaryNote] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'saved' | 'applied' | 'archived'>('saved');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && link) {
      setUrl(link.url || '');
      setCompanyName(link.company_name || '');
      setRoleName(link.role_name || '');
      setLocation(link.location || '');
      setDeadline(link.deadline || '');
      setSalaryNote(link.salary_note || '');
      setNotes(link.notes || '');
      setStatus(link.status || 'saved');

      // Check if source matches an existing platform
      let matchedPlatform = link.platform_id
        ? platforms.find((p) => p.id === link.platform_id)
        : null;

      if (!matchedPlatform && link.source) {
        matchedPlatform = platforms.find(
          (p) => p.name.toLowerCase() === link.source?.toLowerCase()
        ) || null;
      }

      if (matchedPlatform) {
        setSelectedPlatformId(matchedPlatform.id);
        setIsCustomSource(false);
        setCustomSource('');
      } else if (link.source) {
        setSelectedPlatformId('');
        setIsCustomSource(true);
        setCustomSource(link.source);
      } else {
        setSelectedPlatformId('');
        setIsCustomSource(false);
        setCustomSource('');
      }
    }
  }, [isOpen, link, platforms]);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (newUrl.trim() && platforms.length > 0 && !isCustomSource) {
      const matched = findPlatformByUrl(newUrl, platforms);
      if (matched) {
        setSelectedPlatformId(matched.id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link) return;

    if (!url.trim()) {
      toast({
        variant: 'destructive',
        title: 'URL required',
        description: 'Please enter a valid job posting link.',
      });
      return;
    }

    setIsSaving(true);
    try {
      let finalUrl = url.trim();
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`;
      }

      let finalPlatformId: string | null = null;
      let finalSource: string | null = null;

      if (isCustomSource) {
        finalSource = customSource.trim() || null;
      } else if (selectedPlatformId) {
        const matched = platforms.find((p) => p.id === selectedPlatformId);
        if (matched) {
          finalPlatformId = matched.id;
          finalSource = matched.name;
        }
      }

      const updates: Partial<SavedJobLink> = {
        url: finalUrl,
        company_name: companyName.trim() || null,
        role_name: roleName.trim() || null,
        location: location.trim() || null,
        platform_id: finalPlatformId,
        source: finalSource,
        deadline: deadline.trim() || null,
        salary_note: salaryNote.trim() || null,
        notes: notes.trim() || null,
        status,
      };

      const updated = await updateSavedJobLink(link.id, updates);
      toast({
        title: 'Job link updated!',
        description: 'Changes have been saved successfully.',
      });

      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error('Failed to update job link:', err);
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: err?.message || 'Could not update job link.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            Edit Saved Job Link
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* URL Input with auto-detect */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-job-link-url" className="text-sm font-semibold flex items-center justify-between">
              <span>Job Posting URL <span className="text-rose-400">*</span></span>
              <span className="text-[11px] text-muted-foreground font-normal flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Auto-detects source
              </span>
            </Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="edit-job-link-url"
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://linkedin.com/jobs/view/... or indeed.com/..."
                className="pl-9 font-mono text-sm"
                required
              />
            </div>
          </div>

          {/* Company & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-job-link-company" className="text-sm">Company Name</Label>
              <Input
                id="edit-job-link-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Stripe, Google"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-job-link-role" className="text-sm">Role Title</Label>
              <Input
                id="edit-job-link-role"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer"
              />
            </div>
          </div>

          {/* Location & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-job-link-location" className="text-sm">Location</Label>
              <Input
                id="edit-job-link-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Remote, London, Dubai"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-job-link-source" className="text-sm">Platform / Found On</Label>
                <div className="flex items-center gap-1.5">
                  {onOpenAddPlatform && (
                    <button
                      type="button"
                      onClick={onOpenAddPlatform}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      + New
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsCustomSource(!isCustomSource)}
                    className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {isCustomSource ? '← Select' : '+ Custom'}
                  </button>
                </div>
              </div>
              {isCustomSource ? (
                <Input
                  id="edit-job-link-source"
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                  placeholder="e.g. Recruiter, Event..."
                  className="h-9 text-xs"
                  autoFocus
                />
              ) : (
                <Select
                  value={selectedPlatformId}
                  onValueChange={(val) => {
                    if (val === '__custom__') {
                      setIsCustomSource(true);
                      setSelectedPlatformId('');
                    } else if (val === '__add_new__') {
                      onOpenAddPlatform?.();
                    } else {
                      setSelectedPlatformId(val);
                    }
                  }}
                >
                  <SelectTrigger id="edit-job-link-source">
                    <SelectValue placeholder={platforms.length > 0 ? "Select platform" : "No platforms in directory"} />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {p.scope === 'specific' && p.countries?.length ? `(${p.countries.join(', ')})` : ''}
                      </SelectItem>
                    ))}
                    {platforms.length === 0 && (
                      <SelectItem value="__add_new__" className="text-primary font-medium">
                        + Add Platform to Directory
                      </SelectItem>
                    )}
                    <SelectItem value="__custom__" className="text-muted-foreground">
                      + Other (Type custom...)
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Status & Salary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-job-link-status" className="text-sm font-semibold">Status</Label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as 'saved' | 'applied' | 'archived')}
              >
                <SelectTrigger id="edit-job-link-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saved">
                    <span className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      To Apply (Pending)
                    </span>
                  </SelectItem>
                  <SelectItem value="applied">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Applied
                    </span>
                  </SelectItem>
                  <SelectItem value="archived">
                    <span className="flex items-center gap-2">
                      <Archive className="w-3.5 h-3.5 text-muted-foreground" />
                      Archived
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-job-link-salary" className="text-sm">Salary Info (optional)</Label>
              <Input
                id="edit-job-link-salary"
                value={salaryNote}
                onChange={(e) => setSalaryNote(e.target.value)}
                placeholder="e.g. €70k - €90k or $140k"
              />
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-job-link-deadline" className="text-sm">Deadline / Target Date</Label>
            <Input
              id="edit-job-link-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          {/* Quick Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-job-link-notes" className="text-sm">Quick Notes & Keywords</Label>
            <Textarea
              id="edit-job-link-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key requirements, recruiter name, why interested, or referral contact..."
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !url.trim()} className="gap-1.5 font-semibold">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4" />
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

export default EditSavedLinkModal;
