import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  FileText,
  Pin,
  Tag as TagIcon,
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  TrendingUp,
  Layers,
  ExternalLink,
  AlignLeft,
} from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { Note, Tag } from './types';

interface NotesStatsProps {
  notes: Note[];
  tags: Tag[];
}

const countWords = (text: string | null | undefined): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

const NotesStats: React.FC<NotesStatsProps> = ({ notes, tags }) => {
  const totalNotes = notes.length;
  const pinnedNotes = useMemo(() => notes.filter((n) => n.is_pinned).length, [notes]);
  const notionNotes = useMemo(() => notes.filter((n) => Boolean(n.notion_url)).length, [notes]);
  const standardNotes = totalNotes - notionNotes;

  // Words and reading metrics
  const wordMetrics = useMemo(() => {
    let totalWords = 0;
    let longestNote: { title: string; words: number } | null = null;

    notes.forEach((note) => {
      const words = countWords(note.markdown_content || note.content);
      totalWords += words;
      if (!longestNote || words > longestNote.words) {
        longestNote = { title: note.title || 'Untitled', words };
      }
    });

    const avgWords = totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0;
    const estReadingTimeMinutes = Math.max(1, Math.round(totalWords / 200)); // ~200 wpm

    return {
      totalWords,
      avgWords,
      longestNote,
      estReadingTimeMinutes,
    };
  }, [notes, totalNotes]);

  // Tag distribution
  const tagBreakdown = useMemo(() => {
    const map = new Map<string, { tag: Tag; count: number }>();

    // Initialize with existing tags
    tags.forEach((t) => {
      map.set(t.id, { tag: t, count: 0 });
    });

    // Tally notes per tag
    notes.forEach((note) => {
      (note.tags || []).forEach((t) => {
        const item = map.get(t.id);
        if (item) {
          item.count += 1;
        } else {
          map.set(t.id, { tag: t, count: 1 });
        }
      });
    });

    const untaggedCount = notes.filter((n) => !n.tags || n.tags.length === 0).length;

    const list = Array.from(map.values())
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);

    return {
      list,
      untaggedCount,
      taggedPercentage:
        totalNotes > 0 ? Math.round(((totalNotes - untaggedCount) / totalNotes) * 100) : 0,
    };
  }, [notes, tags, totalNotes]);

  // Note length tier distribution
  const lengthTiers = useMemo(() => {
    let shortMemos = 0; // < 100 words
    let standard = 0; // 100 - 499 words
    let comprehensive = 0; // 500 - 1499 words
    let longForm = 0; // 1500+ words

    notes.forEach((note) => {
      if (note.notion_url) return;
      const words = countWords(note.markdown_content || note.content);
      if (words < 100) shortMemos++;
      else if (words < 500) standard++;
      else if (words < 1500) comprehensive++;
      else longForm++;
    });

    const markdownTotal = Math.max(standardNotes, 1);

    return [
      {
        label: 'Quick Notes & Memos',
        sub: '< 100 words',
        count: shortMemos,
        percent: Math.round((shortMemos / markdownTotal) * 100),
      },
      {
        label: 'Standard Notes',
        sub: '100 - 500 words',
        count: standard,
        percent: Math.round((standard / markdownTotal) * 100),
      },
      {
        label: 'In-Depth References',
        sub: '500 - 1,500 words',
        count: comprehensive,
        percent: Math.round((comprehensive / markdownTotal) * 100),
      },
      {
        label: 'Long-Form Guides',
        sub: '1,500+ words',
        count: longForm,
        percent: Math.round((longForm / markdownTotal) * 100),
      },
    ];
  }, [notes, standardNotes]);

  // 14-day creation & update rhythm
  const timelineData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 13),
      end: new Date(),
    });

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const createdCount = notes.filter((n) => {
        try {
          return format(new Date(n.created_at), 'yyyy-MM-dd') === dateStr;
        } catch {
          return false;
        }
      }).length;

      const updatedCount = notes.filter((n) => {
        try {
          const updated = format(new Date(n.updated_at), 'yyyy-MM-dd');
          const created = format(new Date(n.created_at), 'yyyy-MM-dd');
          return updated === dateStr && updated !== created;
        } catch {
          return false;
        }
      }).length;

      return {
        label: format(day, 'MMM d'),
        created: createdCount,
        updated: updatedCount,
        totalActivity: createdCount + updatedCount,
      };
    });
  }, [notes]);

  if (totalNotes === 0) {
    return (
      <Card className="border-dashed bg-card/40">
        <CardContent className="py-14 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">
              No notes in your knowledge base yet
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              Create your first note to visualize documentation volume, tag breakdowns, and writing velocity.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* ========================================================= */}
      {/* 1. Knowledge Base Overview Banner                         */}
      {/* ========================================================= */}
      <div className="rounded-2xl bg-card border border-border/80 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Circular Knowledge Coverage Ring */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted/30 stroke-current"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-primary stroke-current transition-all duration-700 ease-out"
                  strokeDasharray={`${tagBreakdown.taggedPercentage}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xs sm:text-sm font-bold font-mono tracking-tight text-foreground">
                  {tagBreakdown.taggedPercentage}%
                </span>
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Knowledge Base Library
                </span>
                {pinnedNotes > 0 && (
                  <Badge variant="secondary" className="text-[10px] font-medium py-0 text-amber-400 bg-amber-500/10 border-amber-500/20">
                    {pinnedNotes} Pinned
                  </Badge>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                {totalNotes} {totalNotes === 1 ? 'Note' : 'Notes'} Across {tags.length} Categories
              </h2>
              <p className="text-xs text-muted-foreground">
                {wordMetrics.totalWords.toLocaleString()} total words written • ~{wordMetrics.estReadingTimeMinutes} mins estimated total reading time
              </p>
            </div>
          </div>

          {/* Quick Metrics Chips */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60">
              <AlignLeft className="w-3.5 h-3.5 text-muted-foreground" />
              <div className="text-xs">
                <span className="font-semibold text-foreground">{wordMetrics.avgWords}</span>
                <span className="text-muted-foreground ml-1">avg words/note</span>
              </div>
            </div>

            {pinnedNotes > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60">
                <Pin className="w-3.5 h-3.5 fill-amber-400 text-amber-400 rotate-45" />
                <div className="text-xs">
                  <span className="font-semibold text-foreground">{pinnedNotes}</span>
                  <span className="text-muted-foreground ml-1">Pinned</span>
                </div>
              </div>
            )}

            {notionNotes > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60">
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                <div className="text-xs">
                  <span className="font-semibold text-foreground">{notionNotes}</span>
                  <span className="text-muted-foreground ml-1">Notion</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. Tag Topic Distribution & Content Depth Matrix          */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tag Breakdown */}
        <Card className="border-border/80 shadow-sm bg-card">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <TagIcon className="w-4 h-4 text-muted-foreground" />
              Category & Topic Distribution
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Volume of documentation organized across tag categories
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 pt-3 space-y-3">
            {tagBreakdown.list.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No tags assigned to notes yet. Use the Tags tab to organize notes into categories.
              </p>
            ) : (
              tagBreakdown.list.map(({ tag, count }) => {
                const percent = Math.round((count / totalNotes) * 100);

                return (
                  <div key={tag.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="font-medium text-foreground truncate">{tag.name}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                        <span className="font-semibold text-foreground">{count}</span>
                        <span className="text-muted-foreground text-[11px]">({percent}%)</span>
                      </div>
                    </div>

                    <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: tag.color || 'hsl(var(--primary))',
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}

            {tagBreakdown.untaggedCount > 0 && (
              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                <span>Untagged Notes</span>
                <span className="font-mono">{tagBreakdown.untaggedCount}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Length Depth Matrix */}
        <Card className="border-border/80 shadow-sm bg-card">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              Document Depth & Reading Length
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Breakdown of notes by text volume and document length
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 pt-3 space-y-3">
            {lengthTiers.map((tier) => (
              <div key={tier.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-foreground">{tier.label}</span>
                    <span className="text-[11px] text-muted-foreground ml-1.5">({tier.sub})</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="font-semibold text-foreground">{tier.count}</span>
                    <span className="text-muted-foreground text-[11px]">({tier.percent}%)</span>
                  </div>
                </div>

                <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300 bg-primary"
                    style={{ width: `${tier.percent}%` }}
                  />
                </div>
              </div>
            ))}

            {wordMetrics.longestNote && wordMetrics.longestNote.words > 0 && (
              <div className="pt-3 border-t border-border/40 flex items-start justify-between gap-3 text-xs">
                <span className="text-muted-foreground shrink-0">Longest Document:</span>
                <span className="font-semibold text-foreground truncate text-right">
                  "{wordMetrics.longestNote.title}" ({wordMetrics.longestNote.words.toLocaleString()} words)
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ========================================================= */}
      {/* 3. 14-Day Documentation Activity Rhythm                   */}
      {/* ========================================================= */}
      <Card className="border-border/80 shadow-sm bg-card">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            14-Day Documentation & Editing Activity
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Frequency of new note creations and existing note updates over the past two weeks
          </p>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 pt-3">
          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border) / 0.5)' }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border) / 0.5)' }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg bg-popover/95 border border-border p-2.5 shadow-md text-xs space-y-1">
                          <p className="font-semibold text-foreground">{label}</p>
                          <div className="flex items-center justify-between gap-3 text-muted-foreground">
                            <span>New Notes:</span>
                            <span className="font-mono font-semibold text-foreground">
                              {payload[0]?.value}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-primary">
                            <span>Updated Notes:</span>
                            <span className="font-mono font-semibold text-primary">
                              {payload[1]?.value}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="created"
                  name="Created"
                  fill="hsl(var(--primary))"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="updated"
                  name="Updated"
                  fill="hsl(var(--muted-foreground) / 0.4)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground mt-3 pt-2 border-t border-border/40">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
              <span>Created Notes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/40" />
              <span>Updated Notes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotesStats;
