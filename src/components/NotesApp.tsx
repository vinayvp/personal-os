import React, { useState, useEffect } from 'react';
import PageLoader from '@/components/common/PageLoader';
import RefreshButton from '@/components/common/RefreshButton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FileText, Tag } from 'lucide-react';
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
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          note_tags(
            tags(*)
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const formattedNotes = data?.map(note => ({
        ...note,
        tags: note.note_tags?.map((nt: any) => nt.tags) || []
      })) || [];

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

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
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
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredNotes.map(note => (
                      <Card
                        key={note.id}
                        className="cursor-pointer transition-colors hover:bg-accent group"
                        onClick={() => handleNoteClick(note)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg truncate flex-1">
                              {note.title}
                            </CardTitle>
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

                          <div className="text-xs text-muted-foreground">
                            {new Date(note.updated_at).toLocaleDateString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
