import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  BookmarkPlus,
  ExternalLink,
  Copy,
  Trash2,
  Search,
  Building2,
  MapPin,
  Calendar,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { SavedJobLink } from './types';
import { useToast } from '@/hooks/use-toast';

interface SavedLinksViewProps {
  links: SavedJobLink[];
  onAddNew: () => void;
  onApplyNow: (link: SavedJobLink) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<SavedJobLink>) => void;
}

const SavedLinksView: React.FC<SavedLinksViewProps> = ({
  links,
  onAddNew,
  onApplyNow,
  onDelete,
}) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'saved' | 'applied' | 'all'>('saved');

  // Counts
  const pendingCount = useMemo(() => links.filter((l) => l.status === 'saved').length, [links]);
  const appliedCount = useMemo(() => links.filter((l) => l.status === 'applied').length, [links]);
  const totalCount = links.length;

  // Filtered links
  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      if (statusFilter !== 'all' && link.status !== statusFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        link.company_name?.toLowerCase().includes(q) ||
        link.role_name?.toLowerCase().includes(q) ||
        link.source?.toLowerCase().includes(q) ||
        link.location?.toLowerCase().includes(q) ||
        link.url?.toLowerCase().includes(q) ||
        link.notes?.toLowerCase().includes(q)
      );
    });
  }, [links, statusFilter, searchQuery]);

  const handleCopy = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link copied!',
      description: 'Job posting URL copied to clipboard.',
    });
  };

  const getDomainFromUrl = (url: string): string => {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-card/60 border border-border/70">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company, role, source, or notes..."
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Status filter buttons */}
          <div className="flex items-center gap-1 shrink-0 p-1 bg-muted/40 rounded-lg border border-border/60">
            <Button
              type="button"
              variant={statusFilter === 'saved' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-2.5 font-medium"
              onClick={() => setStatusFilter('saved')}
            >
              Pending ({pendingCount})
            </Button>
            <Button
              type="button"
              variant={statusFilter === 'applied' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-2.5 font-medium"
              onClick={() => setStatusFilter('applied')}
            >
              Applied ({appliedCount})
            </Button>
            <Button
              type="button"
              variant={statusFilter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-2.5 font-medium"
              onClick={() => setStatusFilter('all')}
            >
              All ({totalCount})
            </Button>
          </div>
        </div>

        <Button size="sm" onClick={onAddNew} className="gap-1.5 font-semibold shrink-0">
          <BookmarkPlus className="w-4 h-4" />
          <span>Save New Link</span>
        </Button>
      </div>

      {/* Links List */}
      {filteredLinks.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/10">
          <CardContent className="py-12 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
              <LinkIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg text-foreground">
                {links.length === 0
                  ? 'No saved job links yet'
                  : 'No links match your search'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {links.length === 0
                  ? 'Found a great opening while browsing LinkedIn, Indeed, or company sites? Save the link here so you can prepare your resume and apply later.'
                  : 'Try searching with different keywords or switch the status filter.'}
              </p>
            </div>
            {links.length === 0 && (
              <Button size="sm" onClick={onAddNew} className="gap-1.5">
                <BookmarkPlus className="w-4 h-4" />
                Save Your First Link
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredLinks.map((link) => {
            const isApplied = link.status === 'applied';
            const domain = getDomainFromUrl(link.url);

            return (
              <Card
                key={link.id}
                className={`transition-all hover:border-border duration-150 relative border ${
                  isApplied
                    ? 'border-border/60 bg-card/40 opacity-75'
                    : 'border-border/80 bg-card/80 hover:shadow-sm'
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Top Header: Title, Company, Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-base text-foreground truncate max-w-full">
                          {link.role_name || domain}
                        </h4>
                        {isApplied ? (
                          <Badge variant="outline" className="text-[11px] gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Applied
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[11px] gap-1 bg-amber-500/10 text-amber-400 border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            To Apply
                          </Badge>
                        )}
                      </div>

                      {link.company_name && (
                        <div className="flex items-center gap-1.5 text-sm text-foreground/80 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{link.company_name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={(e) => handleCopy(link.url, e)}
                        title="Copy link URL"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(link.id)}
                        title="Delete saved link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Metadata Chips: Source, Location, Salary, Deadline */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {link.source && (
                      <Badge variant="secondary" className="text-[11px] font-normal">
                        {link.source}
                      </Badge>
                    )}
                    {link.location && (
                      <span className="flex items-center gap-1 text-muted-foreground text-[11px]">
                        <MapPin className="w-3 h-3" />
                        {link.location}
                      </span>
                    )}
                    {link.salary_note && (
                      <Badge variant="outline" className="text-[11px] text-emerald-400 border-emerald-500/30 font-mono">
                        {link.salary_note}
                      </Badge>
                    )}
                    {link.deadline && (
                      <span className="flex items-center gap-1 text-amber-400 text-[11px] font-medium">
                        <Calendar className="w-3 h-3" />
                        Deadline: {link.deadline}
                      </span>
                    )}
                  </div>

                  {/* Quick Notes snippet */}
                  {link.notes && (
                    <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border border-border/40 line-clamp-2">
                      {link.notes}
                    </p>
                  )}

                  {/* Action Bar */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 truncate max-w-[55%]"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{domain}</span>
                    </a>

                    <div className="flex items-center gap-1.5">
                      {!isApplied && (
                        <Button
                          size="sm"
                          className="h-7 px-2.5 text-xs font-semibold gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => onApplyNow(link)}
                          title="Open Application Form pre-filled with this link"
                        >
                          <Send className="w-3 h-3" />
                          Apply Now
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1"
                        asChild
                      >
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" />
                          Open
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SavedLinksView;

