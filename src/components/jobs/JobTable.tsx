import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ExternalLink,
  Edit2,
  Download,
  MapPin,
  Calendar,
} from 'lucide-react';
import { JobApplication, STATUS_CONFIG } from './types';
import { downloadResume, formatSalaryInLakhs } from '@/integrations/supabase/jobClient';
import { useToast } from '@/hooks/use-toast';

interface Props {
  jobs: JobApplication[];
  onViewDetails: (job: JobApplication) => void;
  onEdit: (job: JobApplication) => void;
}

const JobTable: React.FC<Props> = ({ jobs, onViewDetails, onEdit }) => {
  const { toast } = useToast();

  const handleDownload = async (e: React.MouseEvent, job: JobApplication) => {
    e.stopPropagation();
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

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border/80 bg-card/60 shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/40 border-b border-border/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="py-3 px-4">Role Name</th>
            <th className="py-3 px-3">Company Name</th>
            <th className="py-3 px-3">Location</th>
            <th className="py-3 px-3">Job Type</th>
            <th className="py-3 px-3">Applied Date</th>
            <th className="py-3 px-3">Salary (in Lakhs)</th>
            <th className="py-3 px-3">Status</th>
            <th className="py-3 px-3">Platform</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {jobs.map((job) => {
            const config = STATUS_CONFIG[job.status] || STATUS_CONFIG.applied;
            const formattedDate = new Date(job.applied_date).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

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
                {/* Role Name (Standard, unhighlighted) */}
                <td className="py-3 px-4">
                  <div className="text-foreground/90 font-normal truncate max-w-[220px] sm:max-w-[260px]">
                    {job.role_name}
                  </div>
                </td>

                {/* Company Name (Linked to job posting link if available) */}
                <td className="py-3 px-3 whitespace-nowrap">
                  {job.application_link ? (
                    <a
                      href={job.application_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-foreground hover:text-primary hover:underline inline-flex items-center gap-1.5 transition-colors group"
                      title="Open job posting"
                    >
                      <span>{job.company_name}</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                    </a>
                  ) : (
                    <span className="font-medium text-foreground/90">{job.company_name}</span>
                  )}
                </td>

                {/* Location (City & Country together) */}
                <td className="py-3 px-3 whitespace-nowrap text-muted-foreground text-xs">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                    {locationText}
                  </span>
                </td>

                {/* Job Type */}
                <td className="py-3 px-3 whitespace-nowrap text-xs">
                  {job.job_type ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted/70 text-foreground/90 text-[11px] font-medium border border-border/50">
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
                    {/* Small resume download button like rest */}
                    {job.resume_storage_path && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={(e) => handleDownload(e, job)}
                        title={`Download tailored resume (${job.resume_filename || 'resume.pdf'})`}
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
    </div>
  );
};

export default JobTable;
