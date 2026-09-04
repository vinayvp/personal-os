import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import { JobApplication, STATUS_CONFIG } from './types';
import { getResumeSignedUrl, downloadResume, formatSalaryInLakhs } from '@/integrations/supabase/jobClient';
import { useToast } from '@/hooks/use-toast';

interface Props {
  job: JobApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (job: JobApplication) => void;
  onDelete: (id: string) => void;
}

const JobDetailModal: React.FC<Props> = ({ job, isOpen, onClose, onEdit, onDelete }) => {
  const { toast } = useToast();
  const [isLoadingResume, setIsLoadingResume] = useState(false);

  if (!job) return null;

  const config = STATUS_CONFIG[job.status] || STATUS_CONFIG.applied;

  const formattedDate = new Date(job.applied_date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const { lakhsText, originalText } = formatSalaryInLakhs(
    job.salary_min_inr,
    job.salary_max_inr,
    job.salary_min,
    job.salary_max,
    job.salary_currency
  );
  const hasSalary = lakhsText !== '—';
  const hasMetrics = hasSalary || Boolean(job.country) || Boolean(job.found_in);

  const locationString = [job.city, job.country].filter(Boolean).join(', ');

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
            </div>
          )}

          {/* Tailored Resume Section */}
          {job.resume_storage_path ? (
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
          ) : (
            <div className="p-3 rounded-xl border border-dashed border-border/80 text-xs text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>No tailored resume attached for this application yet. You can edit to upload one.</span>
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
          {job.follow_up_notes && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Follow-Up Notes & Preparation
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

