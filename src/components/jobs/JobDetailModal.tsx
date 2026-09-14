import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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
  Building2,
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  Banknote,
  FileText,
  ExternalLink,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Download,
  Eye,
  Loader2,
  Globe,
  Share2,
  ScrollText,
  Target,
  Clock,
  Plus,
  Send,
  MessageSquare,
} from 'lucide-react';
import { JobApplication, STATUS_CONFIG, JobFollowUp, FollowUpType, JobAtsScore } from './types';
import {
  getResumeSignedUrl,
  downloadResume,
  formatSalaryInLakhs,
  normalizeFollowUps,
  normalizeAtsScore,
  getJobAtsScores,
} from '@/integrations/supabase/jobClient';
import { useToast } from '@/hooks/use-toast';

interface Props {
  job: JobApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (job: JobApplication) => void;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<JobApplication>) => Promise<void>;
}

const JobDetailModal: React.FC<Props> = ({ job, isOpen, onClose, onEdit, onDelete, onUpdate }) => {
  const { toast } = useToast();
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [isLoadingCoverLetter, setIsLoadingCoverLetter] = useState(false);
  const [isAddingFollowUp, setIsAddingFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().split('T')[0]);
  const [followUpType, setFollowUpType] = useState<FollowUpType>('Email');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [isSavingFollowUp, setIsSavingFollowUp] = useState(false);
  const [atsBreakdown, setAtsBreakdown] = useState<JobAtsScore[]>([]);

  useEffect(() => {
    if (job) {
      if (job.ats_scores && job.ats_scores.length > 0) {
        setAtsBreakdown(job.ats_scores);
      } else if (job.id) {
        getJobAtsScores(job.id)
          .then((scores) => {
            setAtsBreakdown(scores || []);
          })
          .catch(() => {
            setAtsBreakdown([]);
          });
      } else {
        setAtsBreakdown([]);
      }
    }
  }, [job]);

  if (!job) return null;

  const config = STATUS_CONFIG[job.status] || STATUS_CONFIG.applied;
  const followUpsList = normalizeFollowUps(job.follow_ups);
  const atsScore = normalizeAtsScore(job.ats_score);

  const formattedDate = (() => {
    if (!job.applied_date) return '';
    const d = new Date(job.applied_date);
    return isNaN(d.getTime()) ? job.applied_date : d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  })();

  const formatFollowUpDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const { lakhsText, originalText } = formatSalaryInLakhs(
    job.salary_min_inr,
    job.salary_max_inr,
    job.salary_min,
    job.salary_max,
    job.salary_currency
  );
  const hasSalary = lakhsText !== '—';
  const hasMetrics = hasSalary || Boolean(job.country) || Boolean(job.found_in) || atsScore != null;

  const locationString = [job.city, job.country].filter(Boolean).join(', ');

  const getFollowUpIcon = (type: FollowUpType) => {
    switch (type) {
      case 'Email':
        return <Mail className="w-3.5 h-3.5 text-blue-400" />;
      case 'LinkedIn':
        return <Share2 className="w-3.5 h-3.5 text-sky-400" />;
      case 'Phone Call':
        return <Phone className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Message':
        return <MessageSquare className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-primary" />;
    }
  };

  const handleAddFollowUp = async () => {
    if (!job || !followUpNotes.trim()) return;
    setIsSavingFollowUp(true);
    try {
      const newFollowUp: JobFollowUp = {
        id: crypto.randomUUID ? crypto.randomUUID() : `fu_${Date.now()}`,
        date: followUpDate,
        type: followUpType,
        notes: followUpNotes.trim(),
        status: 'completed',
        created_at: new Date().toISOString(),
      };
      const currentList = normalizeFollowUps(job.follow_ups);
      const updatedList = [newFollowUp, ...currentList];
      await onUpdate?.(job.id, { follow_ups: updatedList });
      setFollowUpNotes('');
      setIsAddingFollowUp(false);
      toast({
        title: 'Follow-up logged',
        description: `Logged ${followUpType} follow-up for ${job.company_name}`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to log follow-up',
        description: err?.message || 'Could not save follow-up',
      });
    } finally {
      setIsSavingFollowUp(false);
    }
  };

  const handleDeleteFollowUp = async (followUpId: string) => {
    if (!job) return;
    try {
      const currentList = normalizeFollowUps(job.follow_ups);
      const updatedList = currentList.filter(f => f.id !== followUpId);
      await onUpdate?.(job.id, { follow_ups: updatedList });
      toast({
        title: 'Follow-up removed',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to remove follow-up',
        description: err?.message || 'Error removing follow-up',
      });
    }
  };

  const handleViewResume = async () => {
    if (!job.resume_storage_path) return;
    setIsLoadingResume(true);
    try {
      const signedUrl = await getResumeSignedUrl(job.resume_storage_path, 900); // 15 mins
      if (signedUrl) {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('Unable to generate secure view link');
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Cannot Open Resume',
        description: err?.message || 'Error opening resume preview',
      });
    } finally {
      setIsLoadingResume(false);
    }
  };

  const handleDownload = async () => {
    if (!job.resume_storage_path) return;
    setIsLoadingResume(true);
    try {
      await downloadResume(job.resume_storage_path, job.resume_filename || 'resume.pdf');
      toast({
        title: 'Downloading resume',
        description: `Saved as ${job.resume_filename || 'resume.pdf'}`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Download failed',
        description: err?.message || 'Could not download resume',
      });
    } finally {
      setIsLoadingResume(false);
    }
  };

  const handleViewCoverLetter = async () => {
    if (!job.cover_letter_storage_path) return;
    setIsLoadingCoverLetter(true);
    try {
      const signedUrl = await getResumeSignedUrl(job.cover_letter_storage_path, 900); // 15 mins
      if (signedUrl) {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('Unable to generate secure view link');
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Cannot Open Cover Letter',
        description: err?.message || 'Error opening cover letter preview',
      });
    } finally {
      setIsLoadingCoverLetter(false);
    }
  };

  const handleDownloadCoverLetter = async () => {
    if (!job.cover_letter_storage_path) return;
    setIsLoadingCoverLetter(true);
    try {
      await downloadResume(job.cover_letter_storage_path, job.cover_letter_filename || 'cover_letter.pdf');
      toast({
        title: 'Downloading cover letter',
        description: `Saved as ${job.cover_letter_filename || 'cover_letter.pdf'}`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Download failed',
        description: err?.message || 'Could not download cover letter',
      });
    } finally {
      setIsLoadingCoverLetter(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-7">
        {/* Header */}
        <DialogHeader className="text-left pb-4 border-b border-border/60 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`text-xs px-2.5 py-1 border ${config.badgeClass}`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${config.dotClass}`} />
                {config.label}
              </Badge>

              {job.job_type && (
                <Badge variant="secondary" className="text-xs px-2.5 py-1 font-medium bg-muted/80 text-foreground/90 border border-border/50">
                  <Briefcase className="w-3 h-3 mr-1.5 text-primary" />
                  {job.job_type}
                </Badge>
              )}
            </div>

            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Applied on {formattedDate}
            </span>
          </div>

          <div>
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {job.role_name}
            </DialogTitle>
            <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-primary pt-0.5">
              <Building2 className="w-4 h-4" />
              <span>{job.company_name}</span>
              {locationString && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground font-normal flex items-center gap-1 text-xs sm:text-sm">
                    <MapPin className="w-3.5 h-3.5" />
                    {locationString}
                  </span>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="space-y-4 pt-2">
          {/* Key Metrics Strip */}
          {hasMetrics && (
            <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border/60 rounded-xl bg-card/60 border border-border/70 overflow-hidden text-xs">
              {hasSalary && (
                <div className="flex-1 p-3.5 space-y-1">
                  <span className="text-muted-foreground text-[11px] font-medium flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Compensation
                  </span>
                  <div>
                    <div className="text-sm sm:text-base font-bold text-emerald-400 font-mono tracking-tight whitespace-nowrap">
                      {lakhsText}
                    </div>
                    {originalText && (
                      <div className="mt-1">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted/70 border border-border/50 text-[10.5px] font-mono text-muted-foreground whitespace-nowrap"
                          title="Original Currency"
                        >
                          {originalText}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {job.country && (
                <div className="flex-1 p-3.5 space-y-1">
                  <span className="text-muted-foreground text-[11px] font-medium flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                    Country
                  </span>
                  <div className="text-sm font-semibold text-foreground flex items-center gap-1.5 pt-0.5">
                    {job.country}
                  </div>
                </div>
              )}

              {job.found_in && (
                <div className="flex-1 p-3.5 space-y-1">
                  <span className="text-muted-foreground text-[11px] font-medium flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    Discovered via
                  </span>
                  <div className="text-sm font-semibold text-foreground pt-0.5 truncate">
                    {job.found_in}
                  </div>
                </div>
              )}

              {atsScore != null && (
                <div className="flex-1 p-3.5 space-y-1.5">
                  <span className="text-muted-foreground text-[11px] font-medium flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-primary shrink-0" />
                    ATS Match Score
                  </span>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span
                      className={`text-sm sm:text-base font-bold font-mono px-2 py-0.5 rounded-md border ${
                        atsScore >= 80
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                          : atsScore >= 60
                          ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                          : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                      }`}
                    >
                      {atsScore}%
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {atsScore >= 80
                        ? 'Strong Match'
                        : atsScore >= 60
                        ? 'Good Match'
                        : 'Needs Review'}
                    </span>
                  </div>
                  {atsBreakdown.length > 0 && (
                    <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                      {atsBreakdown.map((item) => (
                        <span
                          key={item.id || item.platform_name}
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted/60 border border-border/50 text-foreground/80"
                        >
                          <span className="text-muted-foreground">{item.platform_name}:</span>{' '}
                          <span className="font-mono font-bold">{item.score}%</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Documents Section (Tailored Resume & Cover Letter) */}
          {job.resume_storage_path || job.cover_letter_storage_path ? (
            <div className="space-y-3">
              {/* Tailored Resume */}
              {job.resume_storage_path && (
                <div className="p-3.5 sm:p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/15 text-primary shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs uppercase tracking-wider font-semibold text-primary block">
                          Tailored Resume Stored
                        </span>
                        <span className="text-sm font-semibold text-foreground truncate block">
                          {job.resume_filename || 'Custom Tailored Resume'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={handleViewResume}
                        disabled={isLoadingResume}
                      >
                        {isLoadingResume ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                        View
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={handleDownload}
                        disabled={isLoadingResume}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Cover Letter */}
              {job.cover_letter_storage_path && (
                <div className="p-3.5 sm:p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0">
                        <ScrollText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400 block">
                          Cover Letter Stored
                        </span>
                        <span className="text-sm font-semibold text-foreground truncate block">
                          {job.cover_letter_filename || 'Cover Letter'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={handleViewCoverLetter}
                        disabled={isLoadingCoverLetter}
                      >
                        {isLoadingCoverLetter ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                        View
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                        onClick={handleDownloadCoverLetter}
                        disabled={isLoadingCoverLetter}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-dashed border-border/80 text-xs text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>No documents (resume or cover letter) attached for this application yet. You can edit to upload them.</span>
            </div>
          )}

          {/* Application Portal Link */}
          {job.application_link && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/60 text-xs">
              <span className="text-muted-foreground font-medium">Posting / Portal:</span>
              <a
                href={job.application_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1 font-medium truncate max-w-[280px] sm:max-w-[400px]"
              >
                <span>{job.application_link}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          )}

          {/* ChatGPT Thread Link */}
          {job.chatgpt_thread_link && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span>ChatGPT Thread (Tailored Resume):</span>
              </div>
              <a
                href={job.chatgpt_thread_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium truncate max-w-[240px] sm:max-w-[360px]"
              >
                <span>{job.chatgpt_thread_link}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          )}

          {/* Recruiter Contact */}
          {(job.recruiter_email || job.recruiter_phone) && (
            <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Recruiter & Contact Info
              </span>
              <div className="flex items-center gap-4 flex-wrap text-xs">
                {job.recruiter_email && (
                  <a
                    href={`mailto:${job.recruiter_email}`}
                    className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-primary" />
                    <span>{job.recruiter_email}</span>
                  </a>
                )}
                {job.recruiter_phone && (
                  <a
                    href={`tel:${job.recruiter_phone}`}
                    className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    <span>{job.recruiter_phone}</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Job Description */}
          {job.job_description && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Job Description & Requirements
              </span>
              <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {job.job_description}
              </div>
            </div>
          )}

          {/* Follow-up Notes */}
          {/* Follow-ups Timeline & Outreach */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Follow-ups & Outreach Timeline
                {followUpsList.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    {followUpsList.length}
                  </Badge>
                )}
              </span>

              {onUpdate && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setIsAddingFollowUp(!isAddingFollowUp)}
                >
                  <Plus className="w-3 h-3" />
                  {isAddingFollowUp ? 'Cancel' : 'Add Follow-up'}
                </Button>
              )}
            </div>

            {/* Inline Follow-up Creation Form */}
            {isAddingFollowUp && (
              <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Log New Follow-up</span>
                  <span className="text-[11px] text-muted-foreground">Record interaction details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Date</Label>
                    <Input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Channel / Type</Label>
                    <Select value={followUpType} onValueChange={(val) => setFollowUpType(val as FollowUpType)}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                        <SelectItem value="Phone Call">Phone Call</SelectItem>
                        <SelectItem value="Message">Message</SelectItem>
                        <SelectItem value="In-Person">In-Person</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Follow-up Notes</Label>
                  <Textarea
                    placeholder="e.g. Sent personalized email to hiring manager asking for status update..."
                    rows={2}
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    className="text-xs resize-y bg-background"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={isSavingFollowUp}
                    onClick={() => {
                      setIsAddingFollowUp(false);
                      setFollowUpNotes('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    disabled={isSavingFollowUp || !followUpNotes.trim()}
                    onClick={handleAddFollowUp}
                  >
                    {isSavingFollowUp ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    Save Follow-up
                  </Button>
                </div>
              </div>
            )}

            {/* Follow-ups List */}
            {followUpsList.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {followUpsList.map((fu) => (
                  <div
                    key={fu.id}
                    className="p-3 rounded-xl border border-border/70 bg-card/60 hover:bg-card/90 transition-colors flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="p-1.5 rounded-lg bg-muted/80 shrink-0 mt-0.5">
                        {getFollowUpIcon(fu.type)}
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{fu.type}</span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {formatFollowUpDate(fu.date)}
                          </span>
                        </div>
                        <p className="text-foreground/90 text-xs whitespace-pre-wrap leading-relaxed">
                          {fu.notes}
                        </p>
                      </div>
                    </div>

                    {onUpdate && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleDeleteFollowUp(fu.id)}
                        title="Delete follow-up"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-dashed border-border/80 text-xs text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground/60" />
                  No follow-ups recorded yet.
                </span>
                {onUpdate && !isAddingFollowUp && (
                  <button
                    type="button"
                    onClick={() => setIsAddingFollowUp(true)}
                    className="text-primary hover:underline font-medium text-xs"
                  >
                    + Log First Follow-up
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Legacy Notes / General Notes */}
          {job.follow_up_notes && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                General Notes & Preparation
              </span>
              <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {job.follow_up_notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="pt-4 border-t border-border/60 flex items-center justify-between sm:justify-between w-full gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 text-xs"
            onClick={() => {
              onDelete(job.id);
              onClose();
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => {
                onClose();
                onEdit(job);
              }}
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </Button>
            <Button type="button" size="sm" onClick={onClose} className="text-xs">
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailModal;

