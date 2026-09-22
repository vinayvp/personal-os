import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Send,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import { JobStatsData, CountryStat, JobStatus, VisaSponsorship } from './types';
import CountryBreakdown from './CountryBreakdown';

interface Props {
  stats: JobStatsData;
  countryStats: CountryStat[];
  selectedStatus: JobStatus | 'all';
  onSelectStatus: (status: JobStatus | 'all') => void;
  selectedCountry: string | 'all';
  onSelectCountry: (country: string | 'all') => void;
  selectedVisa?: VisaSponsorship | 'all';
  onSelectVisa?: (visa: VisaSponsorship | 'all') => void;
}

const JobStats: React.FC<Props> = ({
  stats,
  countryStats,
  selectedStatus,
  onSelectStatus,
  selectedCountry,
  onSelectCountry,
  selectedVisa,
  onSelectVisa,
}) => {

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

  const visaCards: {
    id: VisaSponsorship;
    label: string;
    count: number;
    textColor: string;
    bgColor: string;
    borderColor: string;
    dotClass: string;
  }[] = [
    {
      id: 'no',
      label: 'No',
      count: stats.visaSponsorship?.no || 0,
      textColor: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
      dotClass: 'bg-rose-400',
    },
    {
      id: 'maybe no',
      label: 'Maybe No',
      count: stats.visaSponsorship?.maybeNo || 0,
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      dotClass: 'bg-amber-400',
    },
    {
      id: 'maybe yes',
      label: 'Maybe Yes',
      count: stats.visaSponsorship?.maybeYes || 0,
      textColor: 'text-teal-400',
      bgColor: 'bg-teal-500/10',
      borderColor: 'border-teal-500/30',
      dotClass: 'bg-teal-400',
    },
    {
      id: 'yes',
      label: 'Yes',
      count: stats.visaSponsorship?.yes || 0,
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      dotClass: 'bg-emerald-400',
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

      {/* Extensible Breakdown & Insights Tab System */}
      <Tabs defaultValue="visa" className="space-y-3 pt-1">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-0.5">
          <TabsList className="h-9 p-1 bg-muted/60 border border-border/60 rounded-lg">
            <TabsTrigger
              value="visa"
              className="gap-1.5 text-xs px-3 py-1 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>Visa Sponsorship</span>
              {selectedVisa && selectedVisa !== 'all' && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </TabsTrigger>

            <TabsTrigger
              value="country"
              className="gap-1.5 text-xs px-3 py-1 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>Country Analytics</span>
              <span className="text-[10px] bg-muted-foreground/15 px-1.5 py-0.2 rounded-full font-mono text-muted-foreground">
                {countryStats.length}
              </span>
              {selectedCountry && selectedCountry !== 'all' && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </TabsTrigger>
          </TabsList>

          {/* Contextual filter quick-reset indicators */}
          <div className="flex items-center gap-2">
            {selectedVisa && selectedVisa !== 'all' && onSelectVisa && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectVisa('all')}
                className="h-7 text-xs text-primary hover:text-primary/90 px-2"
              >
                Reset Visa Filter ({selectedVisa})
              </Button>
            )}
            {selectedCountry && selectedCountry !== 'all' && onSelectCountry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectCountry('all')}
                className="h-7 text-xs text-primary hover:text-primary/90 px-2"
              >
                Reset Country Filter ({selectedCountry})
              </Button>
            )}
          </div>
        </div>

        {/* Tab 1: Visa Sponsorship Breakdown */}
        <TabsContent value="visa" className="mt-0 space-y-2.5">
          <div className="rounded-xl border border-border/70 bg-card/60 p-3 sm:p-3.5 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground tracking-tight">
                    Visa Sponsorship Breakdown
                  </h4>
                  <p className="text-[10.5px] text-muted-foreground">
                    Distribution across all {stats.totalApplied} logged applications
                  </p>
                </div>
              </div>

              {selectedVisa && selectedVisa !== 'all' && onSelectVisa && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectVisa('all')}
                  className="h-7 text-xs text-primary hover:text-primary/90 px-2"
                >
                  Clear Visa Filter
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
              {visaCards.map((card) => {
                const isSelected = selectedVisa === card.id;
                const pct = stats.totalApplied > 0 ? Math.round((card.count / stats.totalApplied) * 100) : 0;

                return (
                  <div
                    key={card.id}
                    onClick={() => onSelectVisa?.(isSelected ? 'all' : card.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectVisa?.(isSelected ? 'all' : card.id);
                      }
                    }}
                    className={`cursor-pointer rounded-lg border p-2.5 transition-all duration-200 text-left ${
                      isSelected
                        ? 'ring-2 ring-primary border-primary bg-primary/10 shadow-sm -translate-y-0.5'
                        : 'border-border/60 hover:border-primary/50 hover:bg-card/90 bg-card/40'
                    }`}
                    title={`Click to filter applications with Visa: ${card.label}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${card.textColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${card.dotClass}`} />
                        {card.label}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {pct}%
                      </span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-xl font-bold font-mono tracking-tight text-foreground">
                        {card.count}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {card.count === 1 ? 'app' : 'apps'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Country Analytics Breakdown */}
        <TabsContent value="country" className="mt-0">
          <CountryBreakdown
            stats={countryStats}
            selectedCountry={selectedCountry}
            onSelectCountry={onSelectCountry}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JobStats;

