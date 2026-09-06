import React, { useState, useMemo } from 'react';
import {
  Globe,
  MapPin,
  ExternalLink,
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  BarChart3,
  TrendingUp,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { JobPlatform, JobApplication, PlatformStat, STATUS_CONFIG } from './types';
import { calculatePlatformStats } from '@/integrations/supabase/jobClient';

interface PlatformsViewProps {
  platforms: JobPlatform[];
  applications: JobApplication[];
  onAddNew: () => void;
  onEdit: (platform: JobPlatform) => void;
  onDelete: (platformId: string) => void;
  onFilterByPlatform?: (platformName: string) => void;
}

export const PlatformsView: React.FC<PlatformsViewProps> = ({
  platforms,
  applications,
  onAddNew,
  onEdit,
  onDelete,
  onFilterByPlatform,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'applied' | 'name' | 'rate' | 'recent'>('applied');
  const [platformToDelete, setPlatformToDelete] = useState<JobPlatform | null>(null);

  // Compute real-time stats map for all platforms
  const statsMap: Record<string, PlatformStat> = useMemo(() => {
    return calculatePlatformStats(platforms, applications);
  }, [platforms, applications]);

  // Overall platform KPIs
  const kpis = useMemo(() => {
    const totalPlatforms = platforms.length;
    let totalLinkedApplications = 0;
    let topPlatform: { name: string; count: number } | null = null;
    let bestRatePlatform: { name: string; rate: number; count: number } | null = null;

    Object.values(statsMap).forEach((stat) => {
      totalLinkedApplications += stat.totalApplied;
      if (!topPlatform || stat.totalApplied > topPlatform.count) {
        if (stat.totalApplied > 0) {
          topPlatform = { name: stat.platformName, count: stat.totalApplied };
        }
      }
      if (stat.totalApplied >= 2) {
        if (!bestRatePlatform || stat.responseRate > bestRatePlatform.rate) {
          bestRatePlatform = {
            name: stat.platformName,
            rate: stat.responseRate,
            count: stat.totalApplied,
          };
        }
      }
    });

    return {
      totalPlatforms,
      totalLinkedApplications,
      topPlatform,
      bestRatePlatform,
    };
  }, [platforms, statsMap]);

  // Unique list of countries across all platforms
  const allCountries = useMemo(() => {
    const set = new Set<string>();
    platforms.forEach((p) => {
      if (p.scope === 'specific' && Array.isArray(p.countries)) {
        p.countries.forEach((c) => {
          if (c.trim()) set.add(c.trim());
        });
      }
    });
    return Array.from(set).sort();
  }, [platforms]);

  // Filter and sort platforms
  const filteredAndSortedPlatforms = useMemo(() => {
    let list = platforms.filter((p) => {
      // Scope/Country filter
      if (scopeFilter === 'global') {
        if (p.scope !== 'global') return false;
      } else if (scopeFilter !== 'all') {
        // Specific country name
        if (p.scope !== 'specific' || !p.countries?.some((c) => c.toLowerCase() === scopeFilter.toLowerCase())) {
          return false;
        }
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inName = p.name.toLowerCase().includes(q);
      const inUrl = p.url.toLowerCase().includes(q);
      const inNotes = p.notes?.toLowerCase().includes(q) || false;
      const inCountries = p.countries?.some((c) => c.toLowerCase().includes(q)) || false;

      return inName || inUrl || inNotes || inCountries;
    });

    // Sorting
    return list.sort((a, b) => {
      const statA = statsMap[a.id] || { totalApplied: 0, responseRate: 0 };
      const statB = statsMap[b.id] || { totalApplied: 0, responseRate: 0 };

      switch (sortBy) {
        case 'applied':
          // Descending application count, tie-break by name
          if (statB.totalApplied !== statA.totalApplied) {
            return statB.totalApplied - statA.totalApplied;
          }
          return a.name.localeCompare(b.name);
        case 'rate':
          if (statB.responseRate !== statA.responseRate) {
            return statB.responseRate - statA.responseRate;
          }
          return statB.totalApplied - statA.totalApplied;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
  }, [platforms, scopeFilter, searchQuery, sortBy, statsMap]);

  const getCleanDomain = (url: string): string => {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-5">
      {/* ======================================================== */}
      {/* Overview Stat KPI Cards                                 */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Platforms */}
        <Card className="bg-card/70 border-border/80 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Platforms
              </span>
              <div className="text-xl font-bold text-foreground">
                {kpis.totalPlatforms}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Linked Applications */}
        <Card className="bg-card/70 border-border/80 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Apps via Platforms
              </span>
              <div className="text-xl font-bold text-foreground">
                {kpis.totalLinkedApplications}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  / {applications.length}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Top Platform */}
        <Card className="bg-card/70 border-border/80 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-0.5 min-w-0 pr-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Most Used Platform
              </span>
              <div className="text-base font-bold text-foreground truncate">
                {kpis.topPlatform ? kpis.topPlatform.name : '—'}
              </div>
              {kpis.topPlatform && (
                <span className="text-[11px] text-emerald-400 font-medium">
                  {kpis.topPlatform.count} applications
                </span>
              )}
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Best Response Rate */}
        <Card className="bg-card/70 border-border/80 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-0.5 min-w-0 pr-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Best Response Rate
              </span>
              <div className="text-base font-bold text-foreground truncate">
                {kpis.bestRatePlatform ? kpis.bestRatePlatform.name : '—'}
              </div>
              {kpis.bestRatePlatform && (
                <span className="text-[11px] text-primary font-medium">
                  {kpis.bestRatePlatform.rate}% reply rate
                </span>
              )}
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* Search & Filter Toolbar                                  */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-card/60 border border-border/70">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search platforms by name, country, domain, or notes..."
              className="pl-9 h-9 text-xs sm:text-sm bg-background/80"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Scope / Country Filter Dropdown */}
          <Select value={scopeFilter} onValueChange={setScopeFilter}>
            <SelectTrigger className="w-[140px] sm:w-[160px] h-9 text-xs shrink-0">
              <SelectValue placeholder="All Scopes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms ({platforms.length})</SelectItem>
              <SelectItem value="global">🌐 General / Global</SelectItem>
              {allCountries.map((c) => (
                <SelectItem key={c} value={c}>
                  📍 {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort By Dropdown */}
          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger className="w-[130px] sm:w-[150px] h-9 text-xs shrink-0">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="applied">Most Applied</SelectItem>
              <SelectItem value="rate">Best Response Rate</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="recent">Recently Added</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add Platform Button */}
        <Button size="sm" onClick={onAddNew} className="gap-1.5 font-semibold shrink-0 h-9">
          <Plus className="w-4 h-4" />
          <span>Add Platform</span>
        </Button>
      </div>

      {/* Filter summary banner if filtered */}
      {(scopeFilter !== 'all' || searchQuery) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <span>
            Showing {filteredAndSortedPlatforms.length} of {platforms.length} platforms
          </span>
          {scopeFilter !== 'all' && (
            <Badge variant="secondary" className="text-[11px] font-medium">
              {scopeFilter === 'global' ? 'Global platforms' : `Country: ${scopeFilter}`}
            </Badge>
          )}
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setScopeFilter('all');
            }}
            className="text-primary hover:underline ml-1 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* Platforms Grid                                           */}
      {/* ======================================================== */}
      {filteredAndSortedPlatforms.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/10">
          <CardContent className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Globe className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-base text-foreground">No platforms found</h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                {searchQuery || scopeFilter !== 'all'
                  ? 'No platforms match your current search or country filter.'
                  : 'Get started by adding your first job platform or directory.'}
              </p>
            </div>
            {searchQuery || scopeFilter !== 'all' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setScopeFilter('all');
                }}
                className="text-xs"
              >
                Reset Filters
              </Button>
            ) : (
              <Button size="sm" onClick={onAddNew} className="text-xs gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Add First Platform
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredAndSortedPlatforms.map((platform) => {
            const stat = statsMap[platform.id] || {
              totalApplied: 0,
              interviewing: 0,
              negotiating: 0,
              accepted: 0,
              noResponse: 0,
              notSelected: 0,
              withdrew: 0,
              responseRate: 0,
            };

            const isGlobal = platform.scope === 'global';
            const domain = getCleanDomain(platform.url);

            return (
              <Card
                key={platform.id}
                className="bg-card/75 border-border/80 hover:border-primary/40 transition-all duration-200 shadow-sm hover:shadow group flex flex-col justify-between"
              >
                <div className="p-4 space-y-3.5">
                  {/* Top Bar: Name, Scope Badge, Menu */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-base text-foreground tracking-tight group-hover:text-primary transition-colors">
                          {platform.name}
                        </h4>
                        {isGlobal ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4.5 bg-blue-500/10 text-blue-400 border-blue-500/30 gap-1 font-medium"
                          >
                            <Globe className="w-2.5 h-2.5" />
                            Global
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1 font-medium"
                          >
                            <MapPin className="w-2.5 h-2.5" />
                            Specific
                          </Badge>
                        )}
                      </div>

                      {/* Domain link */}
                      <a
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-mono"
                      >
                        <span>{domain}</span>
                        <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                      </a>
                    </div>

                    {/* Action Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 text-xs">
                        <DropdownMenuItem
                          onClick={() => window.open(platform.url, '_blank')}
                          className="gap-2 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Visit Platform
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEdit(platform)}
                          className="gap-2 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit Platform
                        </DropdownMenuItem>
                        {onFilterByPlatform && stat.totalApplied > 0 && (
                          <DropdownMenuItem
                            onClick={() => onFilterByPlatform(platform.name)}
                            className="gap-2 cursor-pointer"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            View Applications
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setPlatformToDelete(platform)}
                          className="gap-2 text-rose-400 focus:text-rose-300 focus:bg-rose-500/10 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Countries tags if specific */}
                  {!isGlobal && platform.countries && platform.countries.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold mr-1">
                        Countries:
                      </span>
                      {platform.countries.map((c) => (
                        <Badge
                          key={c}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-4 bg-muted/60 text-muted-foreground"
                        >
                          {c}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Notes / Tips description */}
                  {platform.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-muted/20 p-2 rounded-lg border border-border/40">
                      {platform.notes}
                    </p>
                  )}

                  {/* ======================================================== */}
                  {/* Real-Time Application Statistics Section                */}
                  {/* ======================================================== */}
                  <div className="pt-2 border-t border-border/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="secondary"
                          className={`text-xs px-2 py-0.5 font-bold ${
                            stat.totalApplied > 0
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : 'bg-muted/60 text-muted-foreground'
                          }`}
                        >
                          {stat.totalApplied} {stat.totalApplied === 1 ? 'Application' : 'Applications'}
                        </Badge>

                        {stat.totalApplied > 0 && onFilterByPlatform && (
                          <button
                            type="button"
                            onClick={() => onFilterByPlatform(platform.name)}
                            className="text-[11px] text-primary/80 hover:text-primary hover:underline ml-1 font-medium"
                          >
                            View in list
                          </button>
                        )}
                      </div>

                      {stat.totalApplied > 0 && (
                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {stat.responseRate}% response
                        </span>
                      )}
                    </div>

                    {/* Breakdown Chips */}
                    {stat.totalApplied > 0 ? (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {stat.interviewing > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            {stat.interviewing} interviewing
                          </span>
                        )}
                        {stat.accepted > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {stat.accepted} accepted
                          </span>
                        )}
                        {stat.negotiating > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            {stat.negotiating} offer
                          </span>
                        )}
                        {stat.notSelected > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            {stat.notSelected} rejected
                          </span>
                        )}
                        {stat.noResponse > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                            {stat.noResponse} awaiting
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground/70 italic">
                        No applications tracked from this platform yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer: Quick Action Buttons */}
                <div className="p-3 pt-0 flex items-center justify-between gap-2 border-t border-border/30 bg-muted/10 rounded-b-xl">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-7.5 gap-1.5 font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/40"
                    onClick={() => window.open(platform.url, '_blank')}
                  >
                    <span>Open {platform.name}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Platform Confirmation Dialog */}
      <AlertDialog
        open={Boolean(platformToDelete)}
        onOpenChange={(open) => !open && setPlatformToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-400" />
              Delete {platformToDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{platformToDelete?.name}</strong> from your
              platforms directory? Your existing job application records will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
              onClick={() => {
                if (platformToDelete) {
                  onDelete(platformToDelete.id);
                  setPlatformToDelete(null);
                }
              }}
            >
              Delete Platform
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
