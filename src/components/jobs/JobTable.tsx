import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink,
  MapPin,
  Calendar,
  Target,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  JobApplication,
  STATUS_CONFIG,
  calculateJobDuration,
  VISA_SPONSORSHIP_CONFIG,
  VisaSponsorship,
} from './types';
import {
  formatSalaryInLakhs,
  normalizeAtsScore,
} from '@/integrations/supabase/jobClient';

interface Props {
  jobs: JobApplication[];
  onViewDetails: (job: JobApplication) => void;
  onEdit?: (job: JobApplication) => void;
}

const JobTable: React.FC<Props> = ({ jobs, onViewDetails }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border/80 bg-card/60 shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/40 border-b border-border/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="py-3 px-3 max-w-[155px] sm:max-w-[180px]">Role Name</th>
            <th className="py-3 px-2.5 max-w-[125px] sm:max-w-[140px]">Company Name</th>
            <th className="py-3 px-3">Location</th>
            <th className="py-3 px-3">Applied Date</th>
            <th className="py-3 px-3">Salary (in Lakhs)</th>
            <th className="py-3 px-3">ATS Score</th>
            <th className="py-3 px-3">Status</th>
            <th className="py-3 px-3">Platform</th>
            <th className="py-3 px-3 whitespace-nowrap">Visa</th>
            <th className="py-3 px-4 whitespace-nowrap">Days</th>
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

                {/* Visa Sponsorship */}
                <td className="py-3 px-3 whitespace-nowrap">
                  {(() => {
                    const visaKey = (job.visa_sponsorship || 'no') as VisaSponsorship;
                    const vConfig = VISA_SPONSORSHIP_CONFIG[visaKey] || VISA_SPONSORSHIP_CONFIG.no;
                    return (
                      <Badge variant="outline" className={`text-xs border ${vConfig.badgeClass}`} title={vConfig.description}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${vConfig.dotClass}`} />
                        {vConfig.label}
                      </Badge>
                    );
                  })()}
                </td>

                {/* Days / Timeline */}
                <td className="py-3 px-4 whitespace-nowrap text-xs">
                  {(() => {
                    const duration = calculateJobDuration(job);
                    if (duration.isTerminal) {
                      return (
                        <span
                          className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-[11px] bg-slate-500/10 text-slate-300 border border-slate-500/30"
                          title={duration.tooltip}
                        >
                          <CheckCircle2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{duration.days}d to {duration.statusLabel}</span>
                        </span>
                      );
                    }
                    return (
                      <span
                        className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/30"
                        title={duration.tooltip}
                      >
                        <Clock className="w-3 h-3 text-blue-400 shrink-0" />
                        <span>{duration.days}d active</span>
                      </span>
                    );
                  })()}
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
