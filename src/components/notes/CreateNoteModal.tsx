
import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Save, Eye, Edit, Upload, Image, HelpCircle, Pin } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Checkbox } from '@/components/ui/checkbox';
import { Tag } from './types';
import { MarkdownImage } from './MarkdownImage';
import 'highlight.js/styles/github-dark.css';

interface CreateNoteModalProps {
  tags: Tag[];
  onNoteCreated: () => void;
}

const CreateNoteModal: React.FC<CreateNoteModalProps> = ({ tags, onNoteCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [embedNotion, setEmbedNotion] = useState(false);
  const [notionUrl, setNotionUrl] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetForm = () => {
    setTitle('');
    setContent('');
    setEmbedNotion(false);
    setNotionUrl('');
    setIsPinned(false);
    setSelectedTags([]);
    setActiveTab('edit');
  };

  const handleCreateNote = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          title: title || 'New Note',
          content: embedNotion ? null : content,
          markdown_content: embedNotion ? null : content,
          notion_url: embedNotion ? notionUrl.trim() || null : null,
          is_pinned: isPinned,
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

  const uploadImage = async (file: File, noteId?: string) => {
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an image file.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('note-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('note-images')
        .getPublicUrl(filePath);

      if (noteId) {
        await supabase
          .from('note_images')
          .insert({
            note_id: noteId,
            image_url: publicUrl,
            image_name: file.name,
            image_size: file.size,
          });
      }

      const imageMarkdown = `![${file.name}](${publicUrl})`;
      setContent(prev => prev + '\n\n' + imageMarkdown);

      toast({
        title: "Image uploaded successfully!",
        description: "Tip: Add |width to resize, e.g. ![alt|400](url) or ![alt|50%](url)",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload image.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      uploadImage(file);
    }
  };

  const handleImagePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          uploadImage(file);
        }
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Note
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <DialogTitle>Create New Note</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="ml-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-4 mt-4 flex-1 overflow-y-auto pr-1">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className="text-lg font-medium"
          />

          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="embed-notion-toggle">Embed a Notion page</Label>
              <p className="text-xs text-muted-foreground">
                Paste a Notion embed/iframe link instead of writing markdown.
              </p>
            </div>
            <Switch
              id="embed-notion-toggle"
              checked={embedNotion}
              onCheckedChange={setEmbedNotion}
            />
          </div>

          {embedNotion && (
            <Input
              value={notionUrl}
              onChange={(e) => setNotionUrl(e.target.value)}
              placeholder="https://your-workspace.notion.site/ebd/..."
            />
          )}

          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="create-pin-note" className="flex items-center gap-1.5 cursor-pointer">
                <Pin className="w-3.5 h-3.5 text-amber-400" />
                Pin note to top
              </Label>
              <p className="text-xs text-muted-foreground">
                Keep this note pinned to the top of your list.
              </p>
            </div>
            <Switch
              id="create-pin-note"
              checked={isPinned}
              onCheckedChange={setIsPinned}
            />
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
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
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <Image className="w-4 h-4" />
                {isUploading ? 'Uploading...' : 'Upload Image'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => window.open('https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax', '_blank')}
                title="Markdown syntax help"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
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

          {!embedNotion && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-96">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit" className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="edit" className="h-full mt-2">
              <div className="h-full space-y-2">
                <div className="flex gap-2">
                  <span className="text-sm text-muted-foreground flex items-center">
                    Drag & drop or paste images directly into the editor
                  </span>
                </div>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onDrop={handleImageDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onPaste={handleImagePaste}
                  placeholder="Start writing your note... You can use Markdown syntax!&#10;&#10;Try checkboxes:&#10;- [ ] Unchecked item&#10;- [x] Checked item&#10;&#10;Resize images: ![image.png|400](url) or ![image.png|50%](url)"
                  className="flex-1 resize-none font-mono"
                  style={{ height: 'calc(100% - 40px)' }}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="preview" className="h-full mt-2">
              <div className="h-full p-4 border rounded-md bg-background overflow-auto prose prose-sm max-w-none dark:prose-invert break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    h1: ({children, ...props}) => <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0" {...props}>{children}</h1>,
                    h2: ({children, ...props}) => <h2 className="text-xl font-semibold mb-3 mt-5" {...props}>{children}</h2>,
                    h3: ({children, ...props}) => <h3 className="text-lg font-medium mb-2 mt-4" {...props}>{children}</h3>,
                    p: ({children, ...props}) => <p className="mb-4 leading-relaxed" {...props}>{children}</p>,
                    ul: ({children, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props}>{children}</ul>,
                    ol: ({children, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props}>{children}</ol>,
                    blockquote: ({children, ...props}) => (
                      <blockquote className="border-l-4 border-primary/20 pl-4 italic my-6 bg-muted/50 py-2 rounded-r" {...props}>
                        {children}
                      </blockquote>
                    ),
                    code: ({className, children, ...props}) => {
                      const match = /language-(\w+)/.exec(className || '');
                      return match ? (
                        <code className={`${className} block bg-muted p-4 rounded-md overflow-x-auto text-sm`} {...props}>
                          {children}
                        </code>
                      ) : (
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono break-all" {...props}>
                          {children}
                        </code>
                      );
                    },
                    input: ({type, checked, ...props}) => {
                      if (type === 'checkbox') {
                        return (
                          <Checkbox
                            checked={checked || false}
                            className="mr-2 mt-0.5"
                            disabled
                          />
                        );
                      }
                      return <input type={type} checked={checked} {...props} />;
                    },
                    img: MarkdownImage
                  }}
                >
                  {content || '*No content yet. Switch to edit mode to start writing.*'}
                </ReactMarkdown>
              </div>
            </TabsContent>
          </Tabs>
          )}

          <div className="flex gap-2 justify-end pt-4 border-t sticky bottom-0 bg-background">
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
