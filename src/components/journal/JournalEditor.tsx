import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Save, X, Trash2, Tag, Smile, Paperclip } from 'lucide-react';
import { JournalEntry } from '../JournalApp';

interface JournalEditorProps {
  entry: JournalEntry;
  onSave: (entry: JournalEntry) => void;
  onDelete: (entryId: string) => void;
  onClose: () => void;
}

const moodEmojis = ['😊', '😔', '😡', '😴', '🤔', '😎', '🥳', '😰', '🤗', '😌'];

const JournalEditor = ({ entry, onSave, onDelete, onClose }: JournalEditorProps) => {
  const [content, setContent] = useState(entry.content || '');
  const [mood, setMood] = useState(entry.mood || '');
  const [tags, setTags] = useState<string[]>(entry.tags || []);
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Calculate word count
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [content]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast({
        variant: "destructive",
        title: "Content required",
        description: "Please add some content to your journal entry.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const entryData = {
        date: entry.date,
        content: content.trim(),
        mood: mood || null,
        tags: tags,
        word_count: wordCount,
        attachments: entry.attachments || [],
      };

      let savedEntry;

      if (entry.id) {
        // Update existing entry
        const { data, error } = await supabase
          .from('journal_entries')
          .update(entryData)
          .eq('id', entry.id)
          .select()
          .single();

        if (error) throw error;
        savedEntry = data;
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from('journal_entries')
          .insert([entryData])
          .select()
          .single();

        if (error) throw error;
        savedEntry = data;
      }

      onSave(savedEntry);
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save journal entry.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entry.id) {
      onClose();
      return;
    }

    if (!confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entry.id);

      if (error) throw error;
      onDelete(entry.id);
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete journal entry.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              Journal Entry - {new Date(entry.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {wordCount} words
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mood Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Smile className="w-4 h-4" />
              How are you feeling?
            </Label>
            <div className="flex flex-wrap gap-2">
              {moodEmojis.map(emoji => (
                <Button
                  key={emoji}
                  variant={mood === emoji ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMood(mood === emoji ? '' : emoji)}
                  className="text-lg p-2 h-auto"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>

          {/* Content Editor */}
          <div className="space-y-2">
            <Label>What's on your mind?</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write about your day, thoughts, feelings, or anything that comes to mind..."
              className="min-h-[300px] resize-none"
              autoFocus
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addTag}
                disabled={!newTag.trim()}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <div>
              {entry.id && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Entry
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading || !content.trim()}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Saving...' : 'Save Entry'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JournalEditor;