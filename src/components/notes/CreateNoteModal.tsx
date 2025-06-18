
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Save } from 'lucide-react';
import { Tag } from './types';

interface CreateNoteModalProps {
  tags: Tag[];
  onNoteCreated: () => void;
}

const CreateNoteModal: React.FC<CreateNoteModalProps> = ({ tags, onNoteCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setTitle('');
    setContent('');
    setSelectedTags([]);
  };

  const handleCreateNote = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          title: title || 'New Note',
          content,
          markdown_content: content,
        })
        .select()
        .single();

      if (error) throw error;

      // Add tags if any selected
      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map(tag => ({
          note_id: data.id,
          tag_id: tag.id
        }));

        const { error: tagError } = await supabase
          .from('note_tags')
          .insert(tagInserts);

        if (tagError) throw tagError;
      }

      toast({
        title: "Success",
        description: "Note created successfully!",
      });

      resetForm();
      setIsOpen(false);
      onNoteCreated();
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create note.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const addTag = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    if (tag && !selectedTags.find(t => t.id === tagId)) {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const removeTag = (tagId: string) => {
    setSelectedTags(prev => prev.filter(t => t.id !== tagId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Note
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className="text-lg font-medium"
          />

          <div className="space-y-2">
            <Select onValueChange={addTag} value="">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Add tags..." />
              </SelectTrigger>
              <SelectContent>
                {tags
                  .filter(tag => !selectedTags.find(t => t.id === tag.id))
                  .map(tag => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                >
                  {tag.name}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeTag(tag.id)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your note... You can use Markdown syntax!"
            className="min-h-[300px] resize-none font-mono"
          />

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateNote}
              disabled={isCreating}
            >
              <Save className="w-4 h-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create Note'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNoteModal;
