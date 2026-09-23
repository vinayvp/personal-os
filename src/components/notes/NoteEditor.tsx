import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Save, Eye, Edit, Image, Upload, HelpCircle, ListTree, ArrowDown, ArrowUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Note, Tag } from './types';
import { MarkdownImage } from './MarkdownImage';
import { NoteHeadingsOutline, extractHeadings, getNodeText, slugify } from './NoteHeadingsOutline';
import { smoothScrollElement } from './scrollUtils';
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
  const [isEditing, setIsEditing] = useState(false); // Changed to default to preview mode
  const [isSaving, setSaving] = useState(false);
  const [isOutlineOpen, setIsOutlineOpen] = useState(true);
  const [activeHeadingId, setActiveHeadingId] = useState<string | undefined>();
  const { toast } = useToast();

  const headings = useMemo(() => extractHeadings(content || ''), [content]);
  const headingOccurrences = useRef<Record<string, number>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cancelScrollRef = useRef<(() => void) | null>(null);

  const scrollToBottom = useCallback(() => {
    cancelScrollRef.current?.();
    if (textareaRef.current) {
      const el = textareaRef.current;
      const target = Math.max(0, el.scrollHeight - el.clientHeight);
      cancelScrollRef.current = smoothScrollElement(el, target, 450, () => {
        const len = el.value.length;
        el.setSelectionRange(len, len);
        el.focus();
      });
    }
  }, []);

  const scrollToTop = useCallback(() => {
    cancelScrollRef.current?.();
    if (textareaRef.current) {
      const el = textareaRef.current;
      cancelScrollRef.current = smoothScrollElement(el, 0, 450, () => {
        el.setSelectionRange(0, 0);
        el.focus();
      });
    }
  }, []);

  const getRenderHeadingId = (text: string) => {
    const baseSlug = slugify(text);
    if (!baseSlug) return 'heading';
    const count = headingOccurrences.current[baseSlug] || 0;
    headingOccurrences.current[baseSlug] = count + 1;
    return count === 0 ? baseSlug : `${baseSlug}-${count}`;
  };

  useEffect(() => {
    setTitle(note.title);
    setContent(note.markdown_content || note.content || '');
    setSelectedTags(note.tags || []);
    setIsEditing(true); // Reset to preview mode when note changes
  }, [note]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    
    setSaving(true);
    try {
      console.log('Starting save process for note:', note.id);
      
      // First, verify the note exists and update it
      const { data: noteExists, error: checkError } = await supabase
        .from('notes')
        .select('id')
        .eq('id', note.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking note existence:', checkError);
        throw checkError;
      }

      if (!noteExists) {
        throw new Error('Note not found');
      }

      // Update the note content
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

      console.log('Note updated successfully');

      // Clear existing tags first
      const { error: deleteError } = await supabase
        .from('note_tags')
        .delete()
        .eq('note_id', note.id);

      if (deleteError) {
        console.error('Delete tags error:', deleteError);
        throw deleteError;
      }

      console.log('Existing tags cleared');

      // Add new tags if any selected
      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map(tag => ({
          note_id: note.id,
          tag_id: tag.id
        }));

        console.log('Inserting tags:', tagInserts);

        const { error: tagError } = await supabase
          .from('note_tags')
          .insert(tagInserts);

        if (tagError) {
          console.error('Tag insert error:', tagError);
          throw tagError;
        }

        console.log('Tags inserted successfully');
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

        {isEditing && (
          <>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
              className="text-lg font-medium"
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
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

                <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={scrollToTop}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Scroll to top"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={scrollToBottom}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Scroll to bottom"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                </div>
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
          </>
        )}

        {!isEditing && (
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{title}</h2>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
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
      </CardHeader>

      <CardContent className="flex-1">
        <Tabs value={isEditing ? 'edit' : 'preview'} className="h-full">
          <TabsContent value="edit" className="h-full mt-0 relative">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onDrop={handleImageDrop}
              onPaste={handleImagePaste}
              placeholder="Start writing your note... You can use Markdown syntax and drag & drop images!&#10;&#10;Try checkboxes:&#10;- [ ] Unchecked item&#10;- [x] Checked item&#10;&#10;Resize images: ![image.png|400](url) or ![image.png|50%](url)"
              className="min-h-[500px] resize-none font-mono"
            />
          </TabsContent>

          <TabsContent value="preview" className="h-full mt-0">
            <div className="min-h-[500px] border rounded-md bg-background overflow-hidden flex">
              <NoteHeadingsOutline
                headings={headings}
                isOpen={isOutlineOpen}
                onToggle={() => setIsOutlineOpen(!isOutlineOpen)}
                activeId={activeHeadingId}
                onHeadingClick={(id) => setActiveHeadingId(id)}
              />

              <div className="flex-1 p-4 overflow-auto prose prose-sm max-w-none dark:prose-invert">
                {(() => {
                  headingOccurrences.current = {};
                  return (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        h1: ({children, ...props}) => {
                          const id = getRenderHeadingId(getNodeText(children));
                          return <h1 id={id} className="text-2xl font-bold mb-4 mt-6 first:mt-0 scroll-mt-6" {...props}>{children}</h1>;
                        },
                        h2: ({children, ...props}) => {
                          const id = getRenderHeadingId(getNodeText(children));
                          return <h2 id={id} className="text-xl font-semibold mb-3 mt-5 scroll-mt-6" {...props}>{children}</h2>;
                        },
                        h3: ({children, ...props}) => {
                          const id = getRenderHeadingId(getNodeText(children));
                          return <h3 id={id} className="text-lg font-medium mb-2 mt-4 scroll-mt-6" {...props}>{children}</h3>;
                        },
                        h4: ({children, ...props}) => {
                          const id = getRenderHeadingId(getNodeText(children));
                          return <h4 id={id} className="text-base font-medium mb-2 mt-3 scroll-mt-6" {...props}>{children}</h4>;
                        },
                        h5: ({children, ...props}) => {
                          const id = getRenderHeadingId(getNodeText(children));
                          return <h5 id={id} className="text-sm font-medium mb-2 mt-3 scroll-mt-6" {...props}>{children}</h5>;
                        },
                        h6: ({children, ...props}) => {
                          const id = getRenderHeadingId(getNodeText(children));
                          return <h6 id={id} className="text-sm font-medium mb-2 mt-3 scroll-mt-6" {...props}>{children}</h6>;
                        },
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
                  );
                })()}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NoteEditor;
