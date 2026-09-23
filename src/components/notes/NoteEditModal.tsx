import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Save, Eye, Edit, Upload, HelpCircle, GripVertical, Pin } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Note, Tag } from './types';
import { MarkdownImage } from './MarkdownImage';
import { useIsMobile } from '@/hooks/use-mobile';
import 'highlight.js/styles/github-dark.css';

interface NoteEditModalProps {
  note: Note | null;
  tags: Tag[];
  onSave: () => void;
  onClose: () => void;
}

const MIN_WIDTH = 400;
const MAX_WIDTH = 1400;
const DEFAULT_WIDTH = 900;

const NoteEditModal: React.FC<NoteEditModalProps> = ({ note, tags, onSave, onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [embedNotion, setEmbedNotion] = useState(false);
  const [notionUrl, setNotionUrl] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [modalWidth, setModalWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.markdown_content || note.content || '');
      setNotionUrl(note.notion_url || '');
      setEmbedNotion(!!note.notion_url);
      setIsPinned(Boolean(note.is_pinned));
      setSelectedTags(note.tags || []);
      setIsEditing(true);
    }
  }, [note]);

  // Handle mouse resize
  const handleMouseDown = useCallback((e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = modalWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = side === 'right' ? e.clientX - startX : startX - e.clientX;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + diff * 2));
      setModalWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [modalWidth]);

  const handleSave = useCallback(async () => {
    if (!note || isSaving) return;
    
    setSaving(true);
    try {
      const { error: noteError } = await supabase
        .from('notes')
        .update({
          title,
          content: embedNotion ? null : content,
          markdown_content: embedNotion ? null : content,
          notion_url: embedNotion ? notionUrl.trim() || null : null,
          is_pinned: isPinned,
          updated_at: new Date().toISOString()
        })
        .eq('id', note.id);

      if (noteError) throw noteError;

      // Clear existing tags first
      await supabase.from('note_tags').delete().eq('note_id', note.id);

      // Add new tags if any selected
      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map(tag => ({
          note_id: note.id,
          tag_id: tag.id
        }));

        const { error: tagError } = await supabase.from('note_tags').insert(tagInserts);
        if (tagError) throw tagError;
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
  }, [title, content, embedNotion, notionUrl, isPinned, selectedTags, note, onSave, isSaving, toast]);

  const uploadImage = async (file: File) => {
    if (!note) return;
    
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

      await supabase.from('note_images').insert({
        note_id: note.id,
        image_url: publicUrl,
        image_name: file.name,
        image_size: file.size
      });

      const imageMarkdown = `\n![${file.name}](${publicUrl})\n`;
      setContent(prev => prev + imageMarkdown);

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
    }
  };

  const handleImageDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    for (const file of imageFiles) {
      await uploadImage(file);
    }
  }, [note]);

  const handleImagePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));
    for (const item of imageItems) {
      const file = item.getAsFile();
      if (file) await uploadImage(file);
    }
  }, [note]);

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

  if (!note) return null;

  return (
    <Dialog open={!!note} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="p-0 gap-0 overflow-hidden"
        style={{ 
          maxWidth: isMobile ? '95vw' : `${modalWidth}px`,
          width: isMobile ? '95vw' : `${modalWidth}px`,
          maxHeight: '90vh',
        }}
      >
        {/* Resize handles - only on desktop */}
        {!isMobile && (
          <>
            <div
              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/10 transition-colors flex items-center justify-center group"
              onMouseDown={(e) => handleMouseDown(e, 'left')}
            >
              <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div
              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/10 transition-colors flex items-center justify-center group"
              onMouseDown={(e) => handleMouseDown(e, 'right')}
            >
              <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </>
        )}

        <DialogHeader className="p-4 sm:p-6 pb-0 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Edit className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">Edit Note</span>
            </DialogTitle>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="h-8 px-2 sm:px-3"
              >
                {isEditing ? <Eye className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                <span className="hidden sm:inline ml-1">{isEditing ? 'Preview' : 'Edit'}</span>
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 px-2 sm:px-3"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">{isSaving ? 'Saving...' : 'Save'}</span>
              </Button>
            </div>
          </div>

          {isEditing && (
            <div className="space-y-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title..."
                className="text-base sm:text-lg font-medium"
              />

              <div className="flex items-center justify-between rounded-md border p-2 sm:p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="edit-embed-notion" className="text-sm">Embed a Notion page</Label>
                  <p className="text-xs text-muted-foreground">
                    Paste a Notion embed/iframe link instead of markdown.
                  </p>
                </div>
                <Switch
                  id="edit-embed-notion"
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

              <div className="flex items-center justify-between rounded-md border p-2 sm:p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="edit-pin-note" className="text-sm flex items-center gap-1.5 cursor-pointer">
                    <Pin className="w-3.5 h-3.5 text-amber-400" />
                    Pin note to top
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Keep this note pinned to the top of your list.
                  </p>
                </div>
                <Switch
                  id="edit-pin-note"
                  checked={isPinned}
                  onCheckedChange={setIsPinned}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select onValueChange={addTag} value="">
                  <SelectTrigger className="w-32 sm:w-40 h-8">
                    <SelectValue placeholder="Add tags..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-md z-50">
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
                  id="modal-image-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('modal-image-upload')?.click()}
                  className="h-8 px-2 sm:px-3"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Images</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open('https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax', '_blank')}
                  title="Markdown syntax help"
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </div>

              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedTags.map(tag => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="flex items-center gap-1 text-xs"
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
              )}
            </div>
          )}

          {!isEditing && (
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedTags.map(tag => (
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
              )}
            </div>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 p-4 sm:p-6 pt-4" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {embedNotion ? (
            notionUrl.trim() ? (
              <iframe
                src={notionUrl}
                title={title}
                className="w-full min-h-[400px] sm:min-h-[500px] rounded-md border bg-background"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            ) : (
              <p className="text-sm text-muted-foreground p-4 border rounded-md">
                Enter a Notion embed/iframe link above to preview the embed.
              </p>
            )
          ) : (
          <Tabs value={isEditing ? 'edit' : 'preview'} className="h-full">
            <TabsContent value="edit" className="mt-0">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onDrop={handleImageDrop}
                onPaste={handleImagePaste}
                placeholder="Start writing your note... You can use Markdown syntax and drag & drop images!&#10;&#10;Try checkboxes:&#10;- [ ] Unchecked item&#10;- [x] Checked item&#10;&#10;Resize images: ![image.png|400](url) or ![image.png|50%](url)"
                className="min-h-[300px] sm:min-h-[400px] resize-none font-mono text-sm"
              />
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              <div className="min-h-[300px] sm:min-h-[400px] p-4 border rounded-md bg-background overflow-auto prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    h1: ({children, ...props}) => <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0" {...props}>{children}</h1>,
                    h2: ({children, ...props}) => <h2 className="text-xl font-semibold mb-3 mt-5" {...props}>{children}</h2>,
                    h3: ({children, ...props}) => <h3 className="text-lg font-medium mb-2 mt-4" {...props}>{children}</h3>,
                    h4: ({children, ...props}) => <h4 className="text-base font-medium mb-2 mt-3" {...props}>{children}</h4>,
                    h5: ({children, ...props}) => <h5 className="text-sm font-medium mb-2 mt-3" {...props}>{children}</h5>,
                    h6: ({children, ...props}) => <h6 className="text-sm font-medium mb-2 mt-3" {...props}>{children}</h6>,
                    p: ({children, ...props}) => <p className="mb-4 leading-relaxed" {...props}>{children}</p>,
                    ul: ({children, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props}>{children}</ul>,
                    ol: ({children, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props}>{children}</ol>,
                    li: ({children, ...props}) => <li className="mb-1" {...props}>{children}</li>,
                    blockquote: ({children, ...props}) => (
                      <blockquote className="border-l-4 border-primary/20 pl-4 italic my-6 bg-muted/50 py-2 rounded-r" {...props}>
                        {children}
                      </blockquote>
                    ),
                    code: ({className, children, ...props}) => {
                      const match = /language-(\w+)/.exec(className || '');
                      return match ? (
                        <code className={`${className} block bg-muted p-4 rounded-md overflow-auto text-sm`} {...props}>
                          {children}
                        </code>
                      ) : (
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono" {...props}>
                          {children}
                        </code>
                      );
                    },
                    pre: ({children, ...props}) => (
                      <pre className="bg-muted p-4 rounded-md overflow-auto mb-4 text-sm" {...props}>
                        {children}
                      </pre>
                    ),
                    table: ({children, ...props}) => (
                      <div className="overflow-auto mb-6">
                        <table className="border-collapse border border-border w-full text-sm" {...props}>
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({children, ...props}) => (
                      <th className="border border-border px-4 py-2 bg-muted font-semibold text-left" {...props}>
                        {children}
                      </th>
                    ),
                    td: ({children, ...props}) => (
                      <td className="border border-border px-4 py-2" {...props}>
                        {children}
                      </td>
                    ),
                    hr: ({...props}) => (
                      <hr className="my-8 border-border" {...props} />
                    ),
                    strong: ({children, ...props}) => (
                      <strong className="font-semibold" {...props}>{children}</strong>
                    ),
                    em: ({children, ...props}) => (
                      <em className="italic" {...props}>{children}</em>
                    ),
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default NoteEditModal;
