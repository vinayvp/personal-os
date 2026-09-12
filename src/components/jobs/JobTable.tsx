import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ExternalLink,
  Edit2,
  Download,
  MapPin,
  Calendar,
  FileText,
  ScrollText,
  Target,
} from 'lucide-react';
import { JobApplication, STATUS_CONFIG } from './types';
import {
  downloadResume,
  formatSalaryInLakhs,
  normalizeAtsScore,
} from '@/integrations/supabase/jobClient';
import { useToast } from '@/hooks/use-toast';

interface Props {
  jobs: JobApplication[];
  onViewDetails: (job: JobApplication) => void;
  onEdit: (job: JobApplication) => void;
}

const JobTable: React.FC<Props> = ({ jobs, onViewDetails, onEdit }) => {
  const { toast } = useToast();
  const [selectedDownloadJob, setSelectedDownloadJob] = useState<JobApplication | null>(null);

  const handleDownloadResume = async (job: JobApplication) => {
    if (!job.resume_storage_path) return;

    try {
      await downloadResume(job.resume_storage_path, job.resume_filename || 'resume.pdf');
      toast({
        title: 'Downloading resume',
        description: `Starting download for ${job.resume_filename || 'resume.pdf'}`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Download failed',
        description: err?.message || 'Could not download resume',
      });
    }
  };

  const handleDownloadCoverLetter = async (job: JobApplication) => {
    if (!job.cover_letter_storage_path) return;

    try {
      await downloadResume(job.cover_letter_storage_path, job.cover_letter_filename || 'cover_letter.pdf');
      toast({
        title: 'Downloading cover letter',
        description: `Starting download for ${job.cover_letter_filename || 'cover_letter.pdf'}`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Download failed',
        description: err?.message || 'Could not download cover letter',
      });
    }
  };

  const handleDownloadBoth = async (job: JobApplication) => {
    if (job.resume_storage_path) {
      await handleDownloadResume(job);
    }
    if (job.cover_letter_storage_path) {
      setTimeout(async () => {
        await handleDownloadCoverLetter(job);
      }, 300);
    }
  };

  const handleDownloadAction = (e: React.MouseEvent, job: JobApplication) => {
    e.stopPropagation();

    const hasResume = Boolean(job.resume_storage_path);
    const hasCoverLetter = Boolean(job.cover_letter_storage_path);

    // If both exist, ask which one to download
    if (hasResume && hasCoverLetter) {
      setSelectedDownloadJob(job);
      return;
    }

    // If only resume, directly download
    if (hasResume) {
      handleDownloadResume(job);
      return;
    }

    // If only cover letter, directly download
    if (hasCoverLetter) {
      handleDownloadCoverLetter(job);
      return;
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border/80 bg-card/60 shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/40 border-b border-border/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="py-3 px-3 max-w-[155px] sm:max-w-[180px]">Role Name</th>
            <th className="py-3 px-2.5 max-w-[125px] sm:max-w-[140px]">Company Name</th>
            <th className="py-3 px-3">Location</th>
            <th className="py-3 px-1.5 w-[65px] max-w-[65px]">Job Type</th>
            <th className="py-3 px-3">Applied Date</th>
            <th className="py-3 px-3">Salary (in Lakhs)</th>
            <th className="py-3 px-3">ATS Score</th>
            <th className="py-3 px-3">Status</th>
            <th className="py-3 px-3">Platform</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {jobs.map((job) => {
            const config = STATUS_CONFIG[job.status] || STATUS_CONFIG.applied;
            const safeAts = normalizeAtsScore(job.ats_score);
            const formattedDate = (() => {
              if (!job.applied_date) return '—';
              const d = new Date(job.applied_date);
              return isNaN(d.getTime()) ? job.applied_date : d.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });
            })();

            // Convert and format in Lakhs
            const { lakhsText, originalText } = formatSalaryInLakhs(
              job.salary_min_inr,
              job.salary_max_inr,
              job.salary_min,
              job.salary_max,
              job.salary_currency
            );

            const locationText = [job.city, job.country].filter(Boolean).join(', ') || '—';

            return (
              <tr
                key={job.id}
                onClick={() => onViewDetails(job)}
                className="hover:bg-muted/30 cursor-pointer transition-colors"
              >
                {/* Role Name (Standard, unhighlighted - reduced by 30%) */}
                <td className="py-3 px-3">
                  <div
                    className="text-foreground/90 font-normal truncate max-w-[155px] sm:max-w-[180px]"
                    title={job.role_name}
                  >
                    {job.role_name}
                  </div>
                </td>

                {/* Company Name (Linked to job posting link if available - reduced by 30%) */}
                <td className="py-3 px-2.5">
                  <div className="max-w-[125px] sm:max-w-[140px] truncate" title={job.company_name}>
                    {job.application_link ? (
                      <a
                        href={job.application_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-foreground hover:text-primary hover:underline inline-flex items-center gap-1 transition-colors group max-w-full"
                        title={`Open job posting for ${job.company_name}`}
                      >
                        <span className="truncate">{job.company_name}</span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0" />
                      </a>
                    ) : (
                      <span className="font-medium text-foreground/90 truncate block">
                        {job.company_name}
                      </span>
                    )}
                  </div>
                </td>

                {/* Location (City & Country together) */}
                <td className="py-3 px-3 whitespace-nowrap text-muted-foreground text-xs">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                    {locationText}
                  </span>
                </td>

                {/* Job Type (Reduced by 50%) */}
                <td className="py-3 px-1.5 whitespace-nowrap text-xs max-w-[65px]">
                  {job.job_type ? (
                    <span
                      className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-muted/70 text-foreground/90 text-[10px] font-medium border border-border/50 truncate max-w-[65px]"
                      title={job.job_type}
                    >
                      {job.job_type}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </td>

                {/* Applied Date */}
                <td className="py-3 px-3 whitespace-nowrap text-muted-foreground text-xs">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                    {formattedDate}
                  </span>
                </td>

                {/* Estimated Salary (Shown in Lakhs with original currency subtitle) */}
                <td className="py-3 px-3 whitespace-nowrap text-xs">
                  {lakhsText !== '—' ? (
                    <div className="flex flex-col">
                      <span className="text-emerald-400 font-mono font-semibold">{lakhsText}</span>
                      {originalText && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ({originalText})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>

                {/* ATS Score */}
                <td className="py-3 px-3 whitespace-nowrap text-xs font-mono">
                  {safeAts != null ? (
                    <span
                      className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-[11px] border ${
                        safeAts >= 80
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : safeAts >= 60
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                      title={`ATS Match: ${safeAts}%`}
                    >
                      <Target className="w-3 h-3" />
                      {safeAts}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </td>

                {/* Status */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <Badge variant="outline" className={`text-xs border ${config.badgeClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.dotClass}`} />
                    {config.label}
                  </Badge>
                </td>

                {/* Platform (Found In) */}
                <td className="py-3 px-3 whitespace-nowrap text-xs text-muted-foreground">
                  {job.found_in ? (
                    <span className="bg-muted/60 px-2 py-0.5 rounded text-[11px] text-foreground/90 font-medium">
                      {job.found_in}
                    </span>
                  ) : (
                    <span>—</span>
                  )}
                </td>

                {/* Actions (NO Delete button here - deletion safely kept in full view modal) */}
                <td className="py-3 px-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    {/* Single download button for resume / cover letter */}
                    {(job.resume_storage_path || job.cover_letter_storage_path) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={(e) => handleDownloadAction(e, job)}
                        title={
                          job.resume_storage_path && job.cover_letter_storage_path
                            ? 'Download resume or cover letter'
                            : job.resume_storage_path
                            ? `Download tailored resume (${job.resume_filename || 'resume.pdf'})`
                            : `Download cover letter (${job.cover_letter_filename || 'cover_letter.pdf'})`
                        }
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => onEdit(job)}
                      title="Edit application"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Document Selection Dialog (When both Resume and Cover Letter exist) */}
      <Dialog
        open={Boolean(selectedDownloadJob)}
        onOpenChange={(open) => !open && setSelectedDownloadJob(null)}
      >
        <DialogContent
          className="max-w-md p-5 sm:p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader className="text-left space-y-1.5 pb-2 border-b border-border/60">
            <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" />
              Download Documents
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Both a tailored resume and cover letter are attached for{' '}
              <span className="font-semibold text-foreground">
                {selectedDownloadJob?.role_name}
              </span>{' '}
              at{' '}
              <span className="font-semibold text-foreground">
                {selectedDownloadJob?.company_name}
              </span>
              . Which one would you like to download?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 pt-3">
            {/* Download Resume Option */}
            <button
              type="button"
              onClick={() => {
                if (selectedDownloadJob) {
                  handleDownloadResume(selectedDownloadJob);
                  setSelectedDownloadJob(null);
                }
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-primary/15 text-primary shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-foreground block">
                    Tailored Resume
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate block">
                    {selectedDownloadJob?.resume_filename || 'Tailored Resume'}
                  </span>
                </div>
              </div>
              <Download className="w-4 h-4 text-primary shrink-0 group-hover:translate-y-0.5 transition-transform" />
            </button>

            {/* Download Cover Letter Option */}
            <button
              type="button"
              onClick={() => {
                if (selectedDownloadJob) {
                  handleDownloadCoverLetter(selectedDownloadJob);
                  setSelectedDownloadJob(null);
                }
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors text-left group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                  <ScrollText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-foreground block">
                    Cover Letter
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate block">
                    {selectedDownloadJob?.cover_letter_filename || 'Cover Letter'}
                  </span>
                </div>
              </div>
              <Download className="w-4 h-4 text-emerald-400 shrink-0 group-hover:translate-y-0.5 transition-transform" />
            </button>

            {/* Download Both */}
            <Button
              type="button"
              variant="outline"
              className="w-full text-xs gap-1.5 h-9"
              onClick={() => {
                if (selectedDownloadJob) {
                  handleDownloadBoth(selectedDownloadJob);
                  setSelectedDownloadJob(null);
                }
              }}
            >
              <Download className="w-3.5 h-3.5" />
              Download Both Files
            </Button>
          </div>

          <DialogFooter className="pt-2 border-t border-border/40">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDownloadJob(null)}
              className="text-xs"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobTable;
