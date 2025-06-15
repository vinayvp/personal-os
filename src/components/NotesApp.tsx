
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, FileText, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import NoteEditor from './notes/NoteEditor';
import NotesList from './notes/NotesList';
import TagManager from './notes/TagManager';
import { Note, Tag as NoteTag } from './notes/types';

const NotesApp = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<NoteTag[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
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

  const createNewNote = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          title: 'New Note',
          content: '',
          markdown_content: '',
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      const newNote = { ...data, tags: [] };
      setNotes(prev => [newNote, ...prev]);
      setSelectedNote(newNote);

      toast({
        title: "Success",
        description: "New note created!",
      });
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create note.",
      });
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4">
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
              {/* Sidebar */}
              <div className="lg:w-1/3 space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={createNewNote} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">New Note</span>
                  </Button>
                </div>

                <NotesList
                  notes={filteredNotes}
                  selectedNote={selectedNote}
                  onSelectNote={setSelectedNote}
                  onDeleteNote={fetchNotes}
                  tags={tags}
                  selectedTag={selectedTag}
                  onSelectTag={setSelectedTag}
                />
              </div>

              {/* Editor */}
              <div className="lg:w-2/3">
                {selectedNote ? (
                  <NoteEditor
                    note={selectedNote}
                    tags={tags}
                    onSave={() => {
                      fetchNotes();
                      fetchTags();
                    }}
                  />
                ) : (
                  <Card className="h-full min-h-[500px] flex items-center justify-center">
                    <CardContent>
                      <div className="text-center">
                        <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">
                          No note selected
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Select a note from the sidebar or create a new one to get started.
                        </p>
                        <Button onClick={createNewNote} className="flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Create New Note
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
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
