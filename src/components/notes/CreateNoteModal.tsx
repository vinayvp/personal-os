
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Save, Eye, Edit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Checkbox } from '@/components/ui/checkbox';
import { Tag } from './types';
import 'highlight.js/styles/github-dark.css';

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
  const [activeTab, setActiveTab] = useState('edit');
  const { toast } = useToast();

  const resetForm = () => {
    setTitle('');
    setContent('');
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
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
        
        <div className="space-y-4 mt-4 flex-1 overflow-hidden">
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
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your note... You can use Markdown syntax!&#10;&#10;Try checkboxes:&#10;- [ ] Unchecked item&#10;- [x] Checked item"
                className="h-full resize-none font-mono"
              />
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
                    }
                  }}
                >
                  {content || '*No content yet. Switch to edit mode to start writing.*'}
                </ReactMarkdown>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 justify-end pt-12">
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
