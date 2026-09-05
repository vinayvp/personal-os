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
import { BookmarkPlus, Link2, Sparkles, Loader2 } from 'lucide-react';
import { FOUND_IN_OPTIONS, NewSavedJobLink, SavedJobLink } from './types';
import { createSavedJobLink, detectJobSourceFromUrl } from '@/integrations/supabase/jobClient';
import { useToast } from '@/hooks/use-toast';

interface AddSavedLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLink: SavedJobLink) => void;
  initialUrl?: string;
}

const AddSavedLinkModal: React.FC<AddSavedLinkModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialUrl,
}) => {
  const { toast } = useToast();

  const [url, setUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [roleName, setRoleName] = useState('');
  const [location, setLocation] = useState('');
  const [source, setSource] = useState('LinkedIn');
  const [deadline, setDeadline] = useState('');
  const [salaryNote, setSalaryNote] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Auto-detect source when URL changes
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (newUrl.trim()) {
      const detected = detectJobSourceFromUrl(newUrl);
      if (detected) {
        setSource(detected);
      }
    }
  };

  useEffect(() => {
    if (isOpen && initialUrl) {
      handleUrlChange(initialUrl);
    }
  }, [isOpen, initialUrl]);

  const resetForm = () => {
    setUrl('');
    setCompanyName('');
    setRoleName('');
    setLocation('');
    setSource('LinkedIn');
    setDeadline('');
    setSalaryNote('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const payload: NewSavedJobLink = {
        url: finalUrl,
        company_name: companyName.trim() || null,
        role_name: roleName.trim() || null,
        location: location.trim() || null,
        source: source.trim() || null,
        deadline: deadline.trim() || null,
        salary_note: salaryNote.trim() || null,
        notes: notes.trim() || null,
        status: 'saved',
      };

      const created = await createSavedJobLink(payload);
      toast({
        title: 'Job link saved!',
        description: 'Added to your "Apply Later" list.',
      });

      onSuccess(created);
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Failed to save job link:', err);
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: err?.message || 'Could not save job link.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookmarkPlus className="w-5 h-5 text-primary" />
            Save Job Link to Apply Later
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* URL Input with auto-detect */}
          <div className="space-y-1.5">
            <Label htmlFor="job-link-url" className="text-sm font-semibold flex items-center justify-between">
              <span>Job Posting URL <span className="text-rose-400">*</span></span>
              <span className="text-[11px] text-muted-foreground font-normal flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Auto-detects source
              </span>
            </Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="job-link-url"
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://linkedin.com/jobs/view/... or indeed.com/..."
                className="pl-9 font-mono text-sm"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Company & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="job-link-company" className="text-sm">Company Name</Label>
              <Input
                id="job-link-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Stripe, Google"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-link-role" className="text-sm">Role Title</Label>
              <Input
                id="job-link-role"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer"
              />
            </div>
          </div>

          {/* Location & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="job-link-location" className="text-sm">Location</Label>
              <Input
                id="job-link-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Remote, London, Dubai"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-link-source" className="text-sm">Found On</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger id="job-link-source">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {FOUND_IN_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Salary Note & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="job-link-salary" className="text-sm">Salary Info (optional)</Label>
              <Input
                id="job-link-salary"
                value={salaryNote}
                onChange={(e) => setSalaryNote(e.target.value)}
                placeholder="e.g. €70k - €90k or $140k"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-link-deadline" className="text-sm">Deadline / Target Date</Label>
              <Input
                id="job-link-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          {/* Quick Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="job-link-notes" className="text-sm">Quick Notes & Keywords</Label>
            <Textarea
              id="job-link-notes"
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
                  <BookmarkPlus className="w-4 h-4" />
                  Save to Apply Later
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSavedLinkModal;

