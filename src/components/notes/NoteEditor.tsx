
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save, Eye, Edit, Image, Upload } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Note, Tag } from './types';
import 'highlight.js/styles/github-dark.css';

interface NoteEditorProps {
  note: Note;
  tags: Tag[];
  onSave: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, tags, onSave }) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.markdown_content || note.content || '');
  const [selectedTags, setSelectedTags] = useState<Tag[]>(note.tags || []);
  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setTitle(note.title);
    setContent(note.markdown_content || note.content || '');
    setSelectedTags(note.tags || []);
  }, [note]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    
    setSaving(true);
    try {
      // Update note
      const { error: noteError } = await supabase
        .from('notes')
        .update({
          title,
          content,
          markdown_content: content,
          updated_at: new Date().toISOString()
        })
        .eq('id', note.id);

      if (noteError) {
        console.error('Note update error:', noteError);
        throw noteError;
      }

      // Clear existing tags first
      const { error: deleteError } = await supabase
        .from('note_tags')
        .delete()
        .eq('note_id', note.id);

      if (deleteError) {
        console.error('Delete tags error:', deleteError);
        throw deleteError;
      }

      // Add new tags if any selected
      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map(tag => ({
          note_id: note.id,
          tag_id: tag.id
        }));

        const { error: tagError } = await supabase
          .from('note_tags')
          .insert(tagInserts);

        if (tagError) {
          console.error('Tag insert error:', tagError);
          throw tagError;
        }
      }

      toast({
        title: "Success",
        description: "Note saved successfully!",
      });

      onSave();
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save note. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }, [title, content, selectedTags, note.id, onSave, isSaving, toast]);

  const handleImageDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    for (const file of imageFiles) {
      await uploadImage(file);
    }
  }, []);

  const handleImagePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));
    
    for (const item of imageItems) {
      const file = item.getAsFile();
      if (file) {
        await uploadImage(file);
      }
    }
  }, []);

  const uploadImage = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${note.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('note-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('note-images')
        .getPublicUrl(filePath);

      // Insert image record
      await supabase
        .from('note_images')
        .insert({
          note_id: note.id,
          image_url: publicUrl,
          image_name: file.name,
          image_size: file.size
        });

      // Insert markdown image syntax at cursor position
      const imageMarkdown = `\n![${file.name}](${publicUrl})\n`;
      setContent(prev => prev + imageMarkdown);

      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload image.",
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await uploadImage(file);
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
    <Card className="h-full">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Note Editor
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <Eye className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              {isEditing ? 'Preview' : 'Edit'}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          className="text-lg font-medium"
        />

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Select onValueChange={addTag} value="">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Add tags..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-md">
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

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="image-upload"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('image-upload')?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Images
            </Button>
          </div>

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
      </CardHeader>

      <CardContent className="flex-1">
        <Tabs value={isEditing ? 'edit' : 'preview'} className="h-full">
          <TabsContent value="edit" className="h-full mt-0">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onDrop={handleImageDrop}
              onPaste={handleImagePaste}
              placeholder="Start writing your note... You can use Markdown syntax and drag & drop images!"
              className="min-h-[500px] resize-none font-mono"
            />
          </TabsContent>

          <TabsContent value="preview" className="h-full mt-0">
            <div className="min-h-[500px] p-4 border rounded-md bg-background overflow-auto">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code: ({className, children, ...props}) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return match ? (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    ) : (
                      <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {content || '*No content yet. Switch to edit mode to start writing.*'}
              </ReactMarkdown>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NoteEditor;
