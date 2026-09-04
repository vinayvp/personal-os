import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Send,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Globe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { JobStatsData, CountryStat, JobStatus } from './types';
import CountryBreakdown from './CountryBreakdown';

interface Props {
  stats: JobStatsData;
  countryStats: CountryStat[];
  selectedStatus: JobStatus | 'all';
  onSelectStatus: (status: JobStatus | 'all') => void;
  selectedCountry: string | 'all';
  onSelectCountry: (country: string | 'all') => void;
}

const JobStats: React.FC<Props> = ({
  stats,
  countryStats,
  selectedStatus,
  onSelectStatus,
  selectedCountry,
  onSelectCountry,
}) => {
  const [showCountryBreakdown, setShowCountryBreakdown] = useState(false);

  const statCards = [
    {
      id: 'all' as const,
      label: 'Total Applied',
      count: stats.totalApplied,
      icon: Send,
      textColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
    {
      id: 'interviewing' as const,
      label: 'Interviewing',
      count: stats.interviewing,
      icon: Users,
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
    },
    {
      id: 'negotiating' as const,
      label: 'Negotiating',
      count: stats.negotiating,
      icon: Sparkles,
      textColor: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/30',
    },
    {
      id: 'accepted' as const,
      label: 'Accepted',
      count: stats.accepted,
      icon: CheckCircle2,
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
    },
    {
      id: 'no response' as const,
      label: 'No Response',
      count: stats.noResponse,
      icon: Clock,
      textColor: 'text-zinc-400',
      bgColor: 'bg-zinc-500/10',
      borderColor: 'border-zinc-500/30',
    },
    {
      id: 'not selected' as const,
      label: 'Not Selected',
      count: stats.notSelected,
      icon: XCircle,
      textColor: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Overview Cards (responsive 2-cols mobile, 3-cols tablet, 6-cols desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {statCards.map((card) => {
          const isSelected = selectedStatus === card.id;
          const Icon = card.icon;

          return (
            <Card
              key={card.id}
              onClick={() => onSelectStatus(isSelected ? 'all' : card.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectStatus(isSelected ? 'all' : card.id);
                }
              }}
              className={`cursor-pointer transition-all duration-200 border text-left ${
                isSelected
                  ? 'border-primary ring-1 ring-primary bg-primary/10 shadow-md -translate-y-0.5'
                  : 'border-border/70 hover:border-primary/50 hover:bg-card/90 bg-card/60'
              }`}
            >
              <CardContent className="p-3 sm:p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className={`p-1.5 rounded-lg ${card.bgColor} ${card.textColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">
                      Active
                    </span>
                  )}
                </div>

                <div>
                  <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {card.count}
                  </div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground truncate">
                    {card.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Country Breakdown Toggle Bar */}
      <div className="flex items-center justify-between pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCountryBreakdown(!showCountryBreakdown)}
          className="gap-2 text-xs h-8 border-border/80 hover:bg-accent"
        >
          <Globe className="w-3.5 h-3.5 text-primary" />
          <span>Country Breakdown & Outcomes</span>
          <span className="text-xs text-muted-foreground bg-muted/60 px-1.5 py-0.2 rounded-full">
            {countryStats.length}
          </span>
          {showCountryBreakdown ? (
            <ChevronUp className="w-3.5 h-3.5 ml-1" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 ml-1" />
          )}
        </Button>

        {selectedCountry !== 'all' && (
          <span className="text-xs text-muted-foreground">
            Filtered by: <span className="font-semibold text-primary">{selectedCountry}</span>
          </span>
        )}
      </div>

      {/* Expandable Country Analytics Section */}
      {showCountryBreakdown && (
        <div className="pt-2">
          <CountryBreakdown
            stats={countryStats}
            selectedCountry={selectedCountry}
            onSelectCountry={onSelectCountry}
          />
        </div>
      )}
    </div>
  );
};

export default JobStats;

