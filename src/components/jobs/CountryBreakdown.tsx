import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, ArrowRight, CheckCircle2, XCircle, Clock, Users } from 'lucide-react';
import { CountryStat } from './types';

interface Props {
  stats: CountryStat[];
  selectedCountry: string | 'all';
  onSelectCountry: (country: string | 'all') => void;
}

const CountryBreakdown: React.FC<Props> = ({ stats, selectedCountry, onSelectCountry }) => {
  if (stats.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm border border-dashed rounded-xl bg-card/40">
        No country data available yet. Add applications with countries to see geographic breakdowns.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Country Analytics & Breakdown ({stats.length} {stats.length === 1 ? 'Country' : 'Countries'})
          </h3>
        </div>

        {selectedCountry !== 'all' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectCountry('all')}
            className="text-xs h-7 text-primary hover:text-primary/80"
          >
            Clear Country Filter (Show All)
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map((stat) => {
          const isSelected = selectedCountry.toLowerCase() === stat.country.toLowerCase();

          return (
            <Card
              key={stat.country}
              onClick={() => onSelectCountry(isSelected ? 'all' : stat.country)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectCountry(isSelected ? 'all' : stat.country);
                }
              }}
              className={`cursor-pointer transition-all duration-200 border text-left overflow-hidden ${
                isSelected
                  ? 'border-primary ring-1 ring-primary bg-primary/5 shadow-md -translate-y-0.5'
                  : 'border-border/70 hover:border-primary/50 hover:bg-card/90 bg-card/60'
              }`}
            >
              <CardContent className="p-3.5 sm:p-4 space-y-3">
                {/* Header: Country Name & Total */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-semibold text-sm sm:text-base text-foreground truncate block">
                      {stat.country}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {stat.total} {stat.total === 1 ? 'application' : 'applications'}
                    </span>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold shrink-0 ${
                      isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50'
                    }`}
                  >
                    {stat.total} Total
                  </Badge>
                </div>

                {/* Status Breakdown Pills */}
                <div className="grid grid-cols-2 gap-1.5 text-xs pt-1 border-t border-border/50">
                  {/* Interviewing / Active */}
                  <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md">
                    <Users className="w-3 h-3 shrink-0" />
                    <span className="truncate">Interviews:</span>
                    <span className="font-bold ml-auto">{stat.interviewing}</span>
                  </div>

                  {/* Accepted / Offer */}
                  <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span className="truncate">Accepted:</span>
                    <span className="font-bold ml-auto">{stat.accepted}</span>
                  </div>

                  {/* Not Selected / Rejected */}
                  <div className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md">
                    <XCircle className="w-3 h-3 shrink-0" />
                    <span className="truncate">Rejected:</span>
                    <span className="font-bold ml-auto">{stat.notSelected}</span>
                  </div>

                  {/* No Response */}
                  <div className="flex items-center gap-1.5 text-zinc-400 bg-zinc-500/10 px-2 py-1 rounded-md">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span className="truncate">No reply:</span>
                    <span className="font-bold ml-auto">{stat.noResponse}</span>
                  </div>
                </div>

                {/* Distribution Bar */}
                <div className="space-y-1 pt-1">
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                    {stat.accepted > 0 && (
                      <div
                        style={{ width: `${(stat.accepted / stat.total) * 100}%` }}
                        className="bg-emerald-500 h-full"
                        title={`Accepted: ${stat.accepted}`}
                      />
                    )}
                    {stat.interviewing > 0 && (
                      <div
                        style={{ width: `${(stat.interviewing / stat.total) * 100}%` }}
                        className="bg-amber-500 h-full"
                        title={`Interviewing: ${stat.interviewing}`}
                      />
                    )}
                    {stat.applied > 0 && (
                      <div
                        style={{ width: `${(stat.applied / stat.total) * 100}%` }}
                        className="bg-blue-500 h-full"
                        title={`Applied: ${stat.applied}`}
                      />
                    )}
                    {stat.noResponse > 0 && (
                      <div
                        style={{ width: `${(stat.noResponse / stat.total) * 100}%` }}
                        className="bg-zinc-500 h-full"
                        title={`No Response: ${stat.noResponse}`}
                      />
                    )}
                    {stat.notSelected > 0 && (
                      <div
                        style={{ width: `${(stat.notSelected / stat.total) * 100}%` }}
                        className="bg-rose-500 h-full"
                        title={`Rejected: ${stat.notSelected}`}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Response rate: {stat.responseRate}%</span>
                    <span className="text-primary font-medium flex items-center gap-0.5">
                      {isSelected ? 'Filtering active' : 'Filter by country'}
                      <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CountryBreakdown;

