
import React from 'react';
import { supabase } from '@/integrations/supabase/appClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Note, Tag } from './types';

interface NotesListProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
  onDeleteNote: () => void;
  tags: Tag[];
  selectedTag: string | null;
  onSelectTag: (tagId: string | null) => void;
}

const NotesList: React.FC<NotesListProps> = ({
  notes,
  selectedNote,
  onSelectNote,
  onDeleteNote,
  tags,
  selectedTag,
  onSelectTag
}) => {
  const { toast } = useToast();

  const deleteNote = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note deleted successfully!",
      });

      onDeleteNote();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete note.",
      });
    }
  };

  const getPreviewText = (note: Note) => {
    const content = note.markdown_content || note.content || '';
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  };

  return (
    <div className="space-y-4">
      {/* Tag Filter */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-foreground">Filter by tag:</div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedTag === null ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectTag(null)}
          >
            All
          </Button>
          {tags.map(tag => (
            <Button
              key={tag.id}
              variant={selectedTag === tag.id ? "default" : "outline"}
              size="sm"
              onClick={() => onSelectTag(tag.id)}
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

      {/* Notes List */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto p-1">
        {notes.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No notes found</p>
            </CardContent>
          </Card>
        ) : (
          notes.map(note => (
            <Card
              key={note.id}
              className={`cursor-pointer transition-colors hover:bg-accent ${
                selectedNote?.id === note.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onSelectNote(note)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-foreground truncate flex-1">
                    {note.title}
                  </h3>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive ml-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Note</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{note.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => deleteNote(note.id, e)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {getPreviewText(note) && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {getPreviewText(note)}
                  </p>
                )}

                <div className="flex flex-wrap gap-1 mb-2">
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

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(note.updated_at), 'MMM d, yyyy')}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default NotesList;
