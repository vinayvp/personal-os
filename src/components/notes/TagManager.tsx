import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/appClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Palette, Tag as TagIcon, Check } from 'lucide-react';
import { Tag } from './types';

interface TagManagerProps {
  tags: Tag[];
  onTagsChange: () => void;
}

const PREDEFINED_COLORS = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#6366F1',
  '#14B8A6',
  '#F43F5E',
];

const TagManager: React.FC<TagManagerProps> = ({ tags, onTagsChange }) => {
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const createTag = async () => {
    const cleanName = newTagName.trim().replace(/^#/, '');
    if (!cleanName) return;

    setIsCreating(true);
    try {
      const { error } = await supabase.from('tags').insert({
        name: cleanName,
        color: newTagColor,
      });

      if (error) throw error;

      setNewTagName('');
      setNewTagColor('#3B82F6');
      onTagsChange();

      toast({
        title: 'Success',
        description: 'Tag created successfully!',
      });
    } catch (error: any) {
      console.error('Error creating tag:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error.message === 'duplicate key value violates unique constraint "tags_name_key"'
            ? 'A tag with this name already exists.'
            : 'Failed to create tag.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteTag = async (tagId: string) => {
    try {
      const { error } = await supabase.from('tags').delete().eq('id', tagId);

      if (error) throw error;

      onTagsChange();

      toast({
        title: 'Success',
        description: 'Tag deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete tag.',
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Create New Tag */}
      <Card className="rounded-xl border border-border/80 shadow-sm bg-card">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Palette className="w-4 h-4 text-muted-foreground" />
            Create Category Tag
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 pt-3 space-y-4">
          <div className="flex gap-2">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name (e.g. Engineering, Architecture, Research)..."
              onKeyDown={(e) => e.key === 'Enter' && createTag()}
              className="text-xs sm:text-sm h-9"
            />
            <Button
              onClick={createTag}
              disabled={!newTagName.trim() || isCreating}
              className="h-9 px-4 text-xs font-semibold gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreating ? 'Creating...' : 'Create Tag'}</span>
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Accent Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PREDEFINED_COLORS.map((color) => {
                const isSelected = newTagColor.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTagColor(color)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      isSelected ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </button>
                );
              })}
              <div className="relative flex items-center">
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-7 h-7 rounded-full border border-border/60 cursor-pointer p-0 bg-transparent"
                  title="Custom color picker"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Tags Grid */}
      <Card className="rounded-xl border border-border/80 shadow-sm bg-card">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <TagIcon className="w-4 h-4 text-muted-foreground" />
            Active Category Tags ({tags.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 pt-3">
          {tags.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No tags created yet. Create your first category above!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="font-semibold text-xs text-foreground truncate">
                      #{tag.name}
                    </span>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete tag"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border/80">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the tag "#{tag.name}"? This will detach it from all associated notes.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteTag(tag.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TagManager;
