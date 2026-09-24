import React, { useState, useEffect } from 'react';
import PageLoader from '@/components/common/PageLoader';
import RefreshButton from '@/components/common/RefreshButton';
import { supabase } from '@/integrations/supabase/appClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FileText, Tag, Pin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import NoteViewModal from './notes/NoteViewModal';
import NoteEditModal from './notes/NoteEditModal';
import TagManager from './notes/TagManager';
import CreateNoteModal from './notes/CreateNoteModal';
import { Note, Tag as NoteTag } from './notes/types';
const NotesApp = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<NoteTag[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
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

      const formattedNotes: Note[] = notesData?.map((note: any) => ({
        ...note,
        is_pinned: Boolean(note.is_pinned),
        tags: note.note_tags?.map((nt: any) => nt.tags).filter(Boolean) || (Array.isArray(note.tags) ? note.tags.map((t: string) => ({ id: t, name: t, color: '#3B82F6' })) : [])
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
        variant: "destructive",
        title: "Error",
        description: "Failed to load notes.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePin = async (note: Note, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newPinned = !note.is_pinned;

    // Optimistic UI update
    setNotes(prev => {
      const updated = prev.map(n => n.id === note.id ? { ...n, is_pinned: newPinned } : n);
      return updated.sort((a, b) => {
        const aPinned = a.is_pinned ? 1 : 0;
        const bPinned = b.is_pinned ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
    });

    if (viewingNote?.id === note.id) {
      setViewingNote(prev => prev ? { ...prev, is_pinned: newPinned } : null);
    }

    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_pinned: newPinned } as any)
        .eq('id', note.id);

      if (error) throw error;

      toast({
        title: newPinned ? "Note Pinned" : "Note Unpinned",
        description: newPinned
          ? `"${note.title}" is now pinned to the top.`
          : `"${note.title}" unpinned.`,
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      // Revert optimistic update
      setNotes(prev => {
        const reverted = prev.map(n => n.id === note.id ? { ...n, is_pinned: !newPinned } : n);
        return reverted.sort((a, b) => {
          const aPinned = a.is_pinned ? 1 : 0;
          const bPinned = b.is_pinned ? 1 : 0;
          if (aPinned !== bPinned) return bPinned - aPinned;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
      });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update pin status.",
      });
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

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

  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchQuery === '' || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = selectedTag === null || 
      note.tags.some(tag => tag.id === selectedTag);

    return matchesSearch && matchesTag;
  });

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

  const pinnedNotes = filteredNotes.filter(note => note.is_pinned);
  const otherNotes = filteredNotes.filter(note => !note.is_pinned);

  const renderNoteCard = (note: Note) => (
    <Card
      key={note.id}
      className={`cursor-pointer transition-all hover:bg-accent group relative border ${
        note.is_pinned
          ? 'border-amber-500/40 bg-amber-500/[0.02] shadow-sm'
          : 'border-border/70'
      }`}
      onClick={() => handleNoteClick(note)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg truncate flex-1 font-semibold">
            {note.title}
          </CardTitle>
          <button
            type="button"
            onClick={(e) => handleTogglePin(note, e)}
            className={`p-1.5 rounded-md transition-all shrink-0 ${
              note.is_pinned
                ? 'text-amber-400 bg-amber-500/15 hover:bg-amber-500/25'
                : 'text-muted-foreground/40 hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100'
            }`}
            title={note.is_pinned ? "Unpin note" : "Pin note to top"}
          >
            <Pin
              className={`w-4 h-4 transition-transform ${
                note.is_pinned ? 'fill-amber-400 rotate-45' : 'hover:rotate-12'
              }`}
            />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {note.notion_url && (
          <Badge variant="outline" className="text-xs mb-3">
            Notion embed
          </Badge>
        )}
        {!note.notion_url && (note.markdown_content || note.content) && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
            {(note.markdown_content || note.content)?.length > 150 
              ? (note.markdown_content || note.content)?.substring(0, 150) + '...' 
              : (note.markdown_content || note.content)}
          </p>
        )}

        <div className="flex flex-wrap gap-1 mb-3">
          {note.tags.map(tag => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="text-xs"
              style={{ backgroundColor: tag.color + '20', color: tag.color }}
            >
              {tag.name}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{new Date(note.updated_at).toLocaleDateString()}</span>
          {note.is_pinned && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400">
              <Pin className="w-3 h-3 fill-amber-400 rotate-45" />
              Pinned
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Notes App</h1>
          <RefreshButton onRefresh={async () => { await Promise.all([fetchNotes(), fetchTags()]); }} />
        </div>

        <Tabs defaultValue="notes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Notes</span>
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">Tags</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Notes Grid - Full width */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  {/* Search and Create */}
                  <div className="flex gap-2 flex-1">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <CreateNoteModal 
                      tags={tags}
                      onNoteCreated={() => {
                        fetchNotes();
                        fetchTags();
                      }}
                    />
                  </div>

                  {/* Mobile Filter Sheet */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="lg:hidden">
                        <Tag className="w-4 h-4 mr-2" />
                        Filters
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-80">
                      <div className="space-y-4 mt-6">
                        <div className="text-sm font-medium text-foreground">Filter by tag:</div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={selectedTag === null ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedTag(null)}
                          >
                            All
                          </Button>
                          {tags.map(tag => (
                            <Button
                              key={tag.id}
                              variant={selectedTag === tag.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedTag(tag.id)}
                              className="flex items-center gap-1"
                            >
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: tag.color }}
                              />
                              {tag.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Desktop Filter Bar */}
                <div className="hidden lg:block mb-6">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-foreground">Filter by tag:</div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={selectedTag === null ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTag(null)}
                      >
                        All
                      </Button>
                      {tags.map(tag => (
                        <Button
                          key={tag.id}
                          variant={selectedTag === tag.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTag(tag.id)}
                          className="flex items-center gap-1"
                        >
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Notes Grid */}
                {filteredNotes.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        No notes found
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first note to get started.
                      </p>
                      <CreateNoteModal 
                        tags={tags}
                        onNoteCreated={() => {
                          fetchNotes();
                          fetchTags();
                        }}
                      />
                    </CardContent>
                  </Card>
                ) : pinnedNotes.length > 0 ? (
                  <div className="space-y-6">
                    {/* Pinned Notes Section */}
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
                        <Pin className="w-3.5 h-3.5 fill-amber-400 rotate-45" />
                        <span>Pinned Notes ({pinnedNotes.length})</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {pinnedNotes.map(renderNoteCard)}
                      </div>
                    </div>

                    {/* Other Notes Section */}
                    {otherNotes.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          <span>Other Notes ({otherNotes.length})</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {otherNotes.map(renderNoteCard)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredNotes.map(renderNoteCard)}
                  </div>
                )}
              </div>
            </div>

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

          <TabsContent value="tags">
            <TagManager tags={tags} onTagsChange={fetchTags} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NotesApp;
