
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, X, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Checkbox } from '@/components/ui/checkbox';
import { Note, Tag } from './types';
import 'highlight.js/styles/github-dark.css';

interface NoteViewModalProps {
  note: Note | null;
  onClose: () => void;
  onEdit: (note: Note) => void;
  onDelete: () => void;
}

const NoteViewModal: React.FC<NoteViewModalProps> = ({ note, onClose, onEdit, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  if (!note) return null;

  const handleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', note.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note deleted successfully!",
      });

      onClose();
      onDelete();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete note.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={!!note} onOpenChange={onClose}>
      <DialogContent className="min-w-[500px] min-h-[400px] max-w-none max-h-none w-[90vw] h-[90vh] p-0 resize overflow-hidden">
        <div className="flex flex-col h-full overflow-hidden">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-4 border-b shrink-0">
            <DialogTitle className="text-2xl font-bold flex-1 pr-4">
              {note.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(note)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
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
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="ml-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          
          {note.tags && note.tags.length > 0 && (
            <div className="p-6 pt-4 border-b shrink-0">
              <div className="flex flex-wrap gap-2">
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
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto overflow-x-auto p-6 bg-background prose prose-sm max-w-none dark:prose-invert break-words min-h-0">
            {note.notion_url ? (
              <div className="not-prose flex flex-col h-full min-h-[400px]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">Embedded Notion page</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(note.notion_url!, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Open in Notion
                  </Button>
                </div>
                <iframe
                  src={note.notion_url}
                  title={note.title}
                  className="w-full flex-1 min-h-[500px] rounded-md border bg-background"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Tip: Use Notion's "Copy embed link" (contains /ebd/) for embedding.
                </p>
              </div>
            ) : (
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
                    <code className={`${className} block bg-muted p-4 rounded-md overflow-x-auto text-sm`} {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono break-all" {...props}>
                      {children}
                    </code>
                  );
                },
                pre: ({children, ...props}) => (
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto mb-4 text-sm whitespace-pre-wrap break-all" {...props}>
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
                }
              }}
            >
              {note.markdown_content || note.content || '*No content available.*'}
            </ReactMarkdown>
            )}
            
            <div className="text-sm text-muted-foreground text-right mt-6 pt-4 border-t">
              Last updated: {new Date(note.updated_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NoteViewModal;
