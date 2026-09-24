
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/appClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Palette } from 'lucide-react';
import { Tag } from './types';

interface TagManagerProps {
  tags: Tag[];
  onTagsChange: () => void;
}

const TagManager: React.FC<TagManagerProps> = ({ tags, onTagsChange }) => {
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const predefinedColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
  ];

  const createTag = async () => {
    if (!newTagName.trim()) return;

    setIsCreating(true);
    try {
      const { error } = await supabase
        .from('tags')
        .insert({
          name: newTagName.trim(),
          color: newTagColor
        });

      if (error) throw error;

      setNewTagName('');
      setNewTagColor('#3B82F6');
      onTagsChange();

      toast({
        title: "Success",
        description: "Tag created successfully!",
      });
    } catch (error: any) {
      console.error('Error creating tag:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message === 'duplicate key value violates unique constraint "tags_name_key"' 
          ? "A tag with this name already exists."
          : "Failed to create tag.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      onTagsChange();

      toast({
        title: "Success",
        description: "Tag deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete tag.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Create New Tag
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name..."
              onKeyPress={(e) => e.key === 'Enter' && createTag()}
            />
            <Button
              onClick={createTag}
              disabled={!newTagName.trim() || isCreating}
            >
              <Plus className="w-4 h-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Color:</label>
            <div className="flex gap-2 flex-wrap">
              {predefinedColors.map(color => (
                <button
                  key={color}
                  onClick={() => setNewTagColor(color)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    newTagColor === color ? 'border-foreground' : 'border-border'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-8 h-8 rounded-full border-2 border-border cursor-pointer"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Tags ({tags.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No tags created yet. Create your first tag above!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tags.map(tag => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-2"
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </Badge>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the tag "{tag.name}"? This will remove it from all notes.
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
