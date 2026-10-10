import React, { useState, useEffect, useMemo } from 'react';
import PageLoader from '@/components/common/PageLoader';
import RefreshButton from '@/components/common/RefreshButton';
import { supabase } from '@/integrations/supabase/appClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Search,
  FileText,
  Tag as TagIcon,
  Pin,
  BarChart3,
  ExternalLink,
  LayoutGrid,
  List as ListIcon,
  X,
  BookOpen,
  Clock,
} from 'lucide-react';
import NoteViewModal from './notes/NoteViewModal';
import NoteEditModal from './notes/NoteEditModal';
import TagManager from './notes/TagManager';
import CreateNoteModal from './notes/CreateNoteModal';
import NotesStats from './notes/NotesStats';
import { Note, Tag as NoteTag } from './notes/types';

const countWords = (text: string | null | undefined): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

const NotesApp = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<NoteTag[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
    fetchTags();
  }, []);

  const fetchNotes = async () => {
    try {
      let notesData: any[] | null = null;
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          note_tags(
            tags(*)
          )
        `)
        .order('updated_at', { ascending: false });

      if (!error && data) {
        notesData = data;
      } else {
        const simpleRes = await supabase
          .from('notes')
          .select('*')
          .order('updated_at', { ascending: false });
        if (simpleRes.error) throw simpleRes.error;
        notesData = simpleRes.data;
      }

      const formattedNotes: Note[] =
        notesData?.map((note: any) => ({
          ...note,
          is_pinned: Boolean(note.is_pinned),
          tags:
            note.note_tags?.map((nt: any) => nt.tags).filter(Boolean) ||
            (Array.isArray(note.tags)
              ? note.tags.map((t: string) => ({ id: t, name: t, color: '#3B82F6' }))
              : []),
        })) || [];

      // Sort pinned notes to top, then updated_at descending
      formattedNotes.sort((a, b) => {
        const aPinned = a.is_pinned ? 1 : 0;
        const bPinned = b.is_pinned ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });

      setNotes(formattedNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load notes.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePin = async (note: Note, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newPinned = !note.is_pinned;

    // Optimistic UI update
    setNotes((prev) => {
      const updated = prev.map((n) => (n.id === note.id ? { ...n, is_pinned: newPinned } : n));
      return updated.sort((a, b) => {
        const aPinned = a.is_pinned ? 1 : 0;
        const bPinned = b.is_pinned ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
    });

    if (viewingNote?.id === note.id) {
      setViewingNote((prev) => (prev ? { ...prev, is_pinned: newPinned } : null));
    }

    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_pinned: newPinned } as any)
        .eq('id', note.id);

      if (error) throw error;

      toast({
        title: newPinned ? 'Note Pinned' : 'Note Unpinned',
        description: newPinned
          ? `"${note.title}" is now pinned to the top.`
          : `"${note.title}" unpinned.`,
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      // Revert optimistic update
      setNotes((prev) => {
        const reverted = prev.map((n) => (n.id === note.id ? { ...n, is_pinned: !newPinned } : n));
        return reverted.sort((a, b) => {
          const aPinned = a.is_pinned ? 1 : 0;
          const bPinned = b.is_pinned ? 1 : 0;
          if (aPinned !== bPinned) return bPinned - aPinned;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
      });
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update pin status.',
      });
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase.from('tags').select('*').order('name');
      if (error) {
        setTags([]);
        return;
      }
      setTags(data || []);
    } catch (error) {
      console.warn('Error fetching tags:', error);
      setTags([]);
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.markdown_content || note.content || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesTag = selectedTag === null || note.tags.some((tag) => tag.id === selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [notes, searchQuery, selectedTag]);

  const pinnedNotes = useMemo(() => filteredNotes.filter((note) => note.is_pinned), [filteredNotes]);
  const otherNotes = useMemo(() => filteredNotes.filter((note) => !note.is_pinned), [filteredNotes]);
  const allPinnedNotesCount = useMemo(() => notes.filter((n) => n.is_pinned).length, [notes]);

  const handleNoteClick = (note: Note) => {
    setViewingNote(note);
  };

  const handleEditNote = (note: Note) => {
    setViewingNote(null);
    setEditingNote(note);
  };

  const handleCloseViewModal = () => {
    setViewingNote(null);
  };

  const handleCloseEditSheet = () => {
    setEditingNote(null);
  };

  const handleNoteSaved = () => {
    fetchNotes();
    fetchTags();
    setEditingNote(null);
  };

  const handleNoteDeleted = () => {
    fetchNotes();
    setViewingNote(null);
    setEditingNote(null);
  };

  if (isLoading) {
    return <PageLoader message="Loading your notes..." />;
  }

  const renderNoteCard = (note: Note) => {
    const text = note.markdown_content || note.content || '';
    const words = countWords(text);
    const readingTime = Math.max(1, Math.ceil(words / 200));

    return (
      <Card
        key={note.id}
        className={`cursor-pointer transition-all duration-200 group relative rounded-xl border ${
          note.is_pinned
            ? 'border-amber-500/40 bg-card hover:border-amber-500/60 shadow-sm'
            : 'border-border/70 bg-card hover:border-border hover:shadow-sm'
        }`}
        onClick={() => handleNoteClick(note)}
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base sm:text-lg font-bold truncate flex-1 leading-snug text-foreground">
              {note.title || 'Untitled Note'}
            </CardTitle>
            <button
              type="button"
              onClick={(e) => handleTogglePin(note, e)}
              className={`p-1.5 rounded-lg transition-all shrink-0 ${
                note.is_pinned
                  ? 'text-amber-400 bg-amber-500/15 hover:bg-amber-500/25'
                  : 'text-muted-foreground/40 hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100'
              }`}
              title={note.is_pinned ? 'Unpin note' : 'Pin note to top'}
            >
              <Pin
                className={`w-3.5 h-3.5 transition-transform ${
                  note.is_pinned ? 'fill-amber-400 rotate-45' : 'hover:rotate-12'
                }`}
              />
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0 space-y-2.5">
          {note.notion_url ? (
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md border border-border/50">
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
              <span>Notion Document Embed</span>
            </div>
          ) : text ? (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {text.length > 160 ? text.substring(0, 160) + '...' : text}
            </p>
          ) : (
            <p className="text-xs italic text-muted-foreground/60">Empty note</p>
          )}

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {note.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md border"
                  style={{
                    backgroundColor: tag.color ? `${tag.color}18` : 'hsl(var(--muted))',
                    borderColor: tag.color ? `${tag.color}35` : 'hsl(var(--border))',
                    color: tag.color || 'inherit',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Footer Metadata */}
          <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
            <span className="font-mono">
              {new Date(note.updated_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>

            <div className="flex items-center gap-2">
              {!note.notion_url && words > 0 && (
                <span className="text-[10px] text-muted-foreground/70">
                  {words} words • ~{readingTime}m
                </span>
              )}
              {note.is_pinned && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                  <Pin className="w-2.5 h-2.5 fill-amber-400 rotate-45" />
                  Pinned
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderNoteListItem = (note: Note) => {
    const text = note.markdown_content || note.content || '';
    const words = countWords(text);

    return (
      <div
        key={note.id}
        onClick={() => handleNoteClick(note)}
        className={`group p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
          note.is_pinned
            ? 'border-amber-500/40 bg-card hover:border-amber-500/60 shadow-sm'
            : 'border-border/70 bg-card hover:border-border hover:shadow-sm'
        }`}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            {note.is_pinned && (
              <Pin className="w-3.5 h-3.5 fill-amber-400 text-amber-400 rotate-45 shrink-0" />
            )}
            <h4 className="text-sm sm:text-base font-semibold truncate text-foreground">
              {note.title || 'Untitled Note'}
            </h4>
            {note.notion_url && (
              <Badge variant="outline" className="text-[10px] py-0 px-1 text-muted-foreground">
                Notion
              </Badge>
            )}
          </div>
          {text && (
            <p className="text-xs text-muted-foreground truncate max-w-xl">
              {text.replace(/\n+/g, ' ')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {note.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border"
                  style={{
                    backgroundColor: tag.color ? `${tag.color}15` : 'hsl(var(--muted))',
                    borderColor: tag.color ? `${tag.color}30` : 'hsl(var(--border))',
                    color: tag.color || 'inherit',
                  }}
                >
                  {tag.name}
                </span>
              ))}
              {note.tags.length > 3 && (
                <span className="text-[10px] text-muted-foreground">
                  +{note.tags.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="text-right text-xs text-muted-foreground min-w-[80px]">
            <span className="font-mono text-[11px]">
              {new Date(note.updated_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => handleTogglePin(note, e)}
            className={`p-1 rounded-md transition-all shrink-0 ${
              note.is_pinned
                ? 'text-amber-400 hover:bg-amber-500/15'
                : 'text-muted-foreground/40 hover:text-foreground opacity-0 group-hover:opacity-100'
            }`}
            title={note.is_pinned ? 'Unpin note' : 'Pin note to top'}
          >
            <Pin
              className={`w-3.5 h-3.5 ${
                note.is_pinned ? 'fill-amber-400 rotate-45' : ''
              }`}
            />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="app-container py-4 sm:py-6">
        {/* App Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6 pb-3 border-b border-border/60">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground truncate">
                Notes & Knowledge Base
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Markdown documentation, Notion embeds, and topic organization
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <RefreshButton
              onRefresh={async () => {
                await Promise.all([fetchNotes(), fetchTags()]);
              }}
            />
            <CreateNoteModal
              tags={tags}
              onNoteCreated={() => {
                fetchNotes();
                fetchTags();
              }}
            />
          </div>
        </div>

        {/* Tabs: Notes, Analytics, Tags */}
        <Tabs defaultValue="notes" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-9 md:h-10 border border-border/60">
            <TabsTrigger
              value="notes"
              className="flex items-center gap-1.5 text-xs sm:text-sm px-2 md:px-3 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Notes</span>
              <span className="text-[10px] ml-0.5 px-1.5 py-0.2 rounded-full bg-muted-foreground/15 text-muted-foreground font-mono">
                {notes.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="flex items-center gap-1.5 text-xs sm:text-sm px-2 md:px-3 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics & Insights</span>
            </TabsTrigger>
            <TabsTrigger
              value="tags"
              className="flex items-center gap-1.5 text-xs sm:text-sm px-2 md:px-3 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <TagIcon className="w-3.5 h-3.5" />
              <span>Tags & Categories</span>
              <span className="text-[10px] ml-0.5 px-1.5 py-0.2 rounded-full bg-muted-foreground/15 text-muted-foreground font-mono">
                {tags.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            {/* Search, Tag Filter & View Mode Controls */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search notes by title or content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-8 h-9 text-xs sm:text-sm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Grid / List View Toggle */}
                <div className="flex items-center gap-1 border border-border/60 rounded-lg p-0.5 bg-muted/40 self-end sm:self-center">
                  <Button
                    type="button"
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className="h-7 w-7 rounded-md"
                    title="Grid view"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className="h-7 w-7 rounded-md"
                    title="List view"
                  >
                    <ListIcon className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Tag Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <Button
                  type="button"
                  variant={selectedTag === null ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedTag(null)}
                  className="h-7 text-xs font-medium rounded-lg"
                >
                  All ({notes.length})
                </Button>
                {tags.map((tag) => {
                  const tagCount = notes.filter((n) => n.tags.some((t) => t.id === tag.id)).length;

                  return (
                    <Button
                      key={tag.id}
                      type="button"
                      variant={selectedTag === tag.id ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
                      className="h-7 text-xs font-medium rounded-lg gap-1.5"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span>{tag.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ({tagCount})
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Notes Grid / List */}
            {filteredNotes.length === 0 ? (
              <Card className="border-dashed bg-card/40">
                <CardContent className="py-14 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">
                      {searchQuery || selectedTag ? 'No matching notes found' : 'No notes created yet'}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                      {searchQuery || selectedTag
                        ? 'Try clearing your search query or choosing another tag filter.'
                        : 'Create your first markdown note or Notion embed to get started.'}
                    </p>
                  </div>
                  {(searchQuery || selectedTag) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedTag(null);
                      }}
                      className="text-xs h-8"
                    >
                      Reset filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : pinnedNotes.length > 0 ? (
              <div className="space-y-6">
                {/* Pinned Notes Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    <Pin className="w-3.5 h-3.5 fill-amber-400 rotate-45" />
                    <span>Pinned Notes ({pinnedNotes.length})</span>
                  </div>
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                      {pinnedNotes.map(renderNoteCard)}
                    </div>
                  ) : (
                    <div className="space-y-2">{pinnedNotes.map(renderNoteListItem)}</div>
                  )}
                </div>

                {/* Other Notes Section */}
                {otherNotes.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <span>Other Notes ({otherNotes.length})</span>
                    </div>
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                        {otherNotes.map(renderNoteCard)}
                      </div>
                    ) : (
                      <div className="space-y-2">{otherNotes.map(renderNoteListItem)}</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                    {filteredNotes.map(renderNoteCard)}
                  </div>
                ) : (
                  <div className="space-y-2">{filteredNotes.map(renderNoteListItem)}</div>
                )}
              </div>
            )}

            {/* Note View Modal */}
            <NoteViewModal
              note={viewingNote}
              onClose={handleCloseViewModal}
              onEdit={handleEditNote}
              onDelete={handleNoteDeleted}
              onTogglePin={handleTogglePin}
            />

            {/* Note Edit Modal */}
            <NoteEditModal
              note={editingNote}
              tags={tags}
              onSave={handleNoteSaved}
              onClose={handleCloseEditSheet}
            />
          </TabsContent>

          {/* Analytics & Insights Tab */}
          <TabsContent value="stats">
            <NotesStats notes={notes} tags={tags} />
          </TabsContent>

          {/* Tags & Categories Tab */}
          <TabsContent value="tags">
            <TagManager tags={tags} onTagsChange={fetchTags} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NotesApp;
