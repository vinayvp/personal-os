import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  ExternalLink,
  MoreVertical,
  Edit2,
  Trash2,
  ChevronRight,
  Download,
  ScrollText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { JobApplication, STATUS_CONFIG } from './types';
import { downloadResume, formatSalaryInLakhs } from '@/integrations/supabase/jobClient';
import { useToast } from '@/hooks/use-toast';

interface Props {
  job: JobApplication;
  onViewDetails: (job: JobApplication) => void;
  onEdit: (job: JobApplication) => void;
  onDelete: (id: string) => void;
}

const JobCard: React.FC<Props> = ({ job, onViewDetails, onEdit, onDelete }) => {
  const { toast } = useToast();
  const config = STATUS_CONFIG[job.status] || STATUS_CONFIG.applied;

  const formattedDate = new Date(job.applied_date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const { lakhsText, originalText } = formatSalaryInLakhs(
    job.salary_min_inr,
    job.salary_max_inr,
    job.salary_min,
    job.salary_max,
    job.salary_currency
  );
  const locationString = [job.city, job.country].filter(Boolean).join(', ');

  const handleDownloadResume = async (e: React.MouseEvent) => {
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

  const handleDownloadCoverLetter = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  return (
    <Card
      onClick={() => onViewDetails(job)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewDetails(job);
        }
      }}
      className="group relative overflow-hidden cursor-pointer border border-border/70 hover:border-primary/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4 bg-card/80 hover:bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
    >
      {/* Left Column: Icon & Primary Info */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        {/* Company Avatar / Icon */}
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 group-hover:scale-105 transition-transform mt-0.5 sm:mt-0">
          <Building2 className="w-5 h-5" />
        </div>

        {/* Company & Role */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-base text-foreground leading-snug truncate group-hover:text-primary transition-colors">
              {job.role_name}
            </h4>
            <Badge variant="outline" className={`text-[10px] px-2 py-0.5 border ${config.badgeClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.dotClass}`} />
              {config.label}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span className="font-semibold text-foreground/90">{job.company_name}</span>
            {locationString && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  {locationString}
                </span>
              </>
            )}
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              Applied {formattedDate}
            </span>
          </div>

          {/* Secondary metadata pills */}
          <div className="flex items-center gap-2 flex-wrap pt-0.5 text-[11px] text-muted-foreground">
            {lakhsText !== '—' && (
              <span
                className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-mono"
                title={originalText ? `Original: ${originalText}` : undefined}
              >
                <DollarSign className="w-3 h-3" />
                <span>{lakhsText}</span>
              </span>
            )}

            {job.job_type && (
              <span className="flex items-center gap-1 text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                <Briefcase className="w-3 h-3" />
                <span>{job.job_type}</span>
              </span>
            )}

            {job.resume_storage_path && (
              <button
                type="button"
                onClick={handleDownloadResume}
                className="flex items-center gap-1 text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-md transition-colors"
                title="Download tailored resume"
              >
                <FileText className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{job.resume_filename || 'Resume'}</span>
                <Download className="w-2.5 h-2.5 ml-0.5" />
              </button>
            )}

            {job.cover_letter_storage_path && (
              <button
                type="button"
                onClick={handleDownloadCoverLetter}
                className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-md transition-colors"
                title="Download cover letter"
              >
                <ScrollText className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{job.cover_letter_filename || 'Cover Letter'}</span>
                <Download className="w-2.5 h-2.5 ml-0.5" />
              </button>
            )}

            {job.application_link && (
              <a
                href={job.application_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Job Post</span>
              </a>
            )}

            {job.found_in && (
              <span className="text-muted-foreground/80">via {job.found_in}</span>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Actions */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => onViewDetails(job)} className="gap-2">
              <FileText className="h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(job)} className="gap-2">
              <Edit2 className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            {job.resume_storage_path && (
              <DropdownMenuItem onClick={handleDownloadResume} className="gap-2">
                <Download className="h-4 w-4" />
                Download Resume
              </DropdownMenuItem>
            )}
            {job.cover_letter_storage_path && (
              <DropdownMenuItem onClick={handleDownloadCoverLetter} className="gap-2 text-emerald-400 focus:text-emerald-400">
                <ScrollText className="h-4 w-4" />
                Download Cover Letter
              </DropdownMenuItem>
            )}
            {job.application_link && (
              <DropdownMenuItem asChild>
                <a
                  href={job.application_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2 flex items-center"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Link
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(job.id)}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all">
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </Card>
  );
};

export default JobCard;

