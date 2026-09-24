import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/appClient";
import { useToast } from "@/hooks/use-toast";

interface Movie {
  id: string;
  title: string;
  release_year: string;
  genre: string;
  custom_category: string | null;
  imdb_score: string;
  rotten_tomatoes_rating: string;
  rated: string;
  poster_url: string;
  plot: string;
  watched: boolean;
  created_at: string;
  updated_at: string;
}

interface EditMovieModalProps {
  movie: Movie;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (movie: Movie) => void;
}

const EditMovieModal: React.FC<EditMovieModalProps> = ({
  movie,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    title: '',
    release_year: '',
    genre: '',
    custom_category: '',
    imdb_score: '',
    rotten_tomatoes_rating: '',
    rated: '',
    poster_url: '',
    plot: '',
    watched: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (movie) {
      setFormData({
        title: movie.title,
        release_year: movie.release_year,
        genre: movie.genre,
        custom_category: movie.custom_category || '',
        imdb_score: movie.imdb_score,
        rotten_tomatoes_rating: movie.rotten_tomatoes_rating,
        rated: movie.rated,
        poster_url: movie.poster_url,
        plot: movie.plot,
        watched: movie.watched
      });
    }
  }, [movie]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updateData = {
        ...formData,
        custom_category: formData.custom_category || null
      };

      const { data, error } = await supabase
        .from('movies_tv')
        .update(updateData)
        .eq('id', movie.id)
        .select()
        .single();

      if (error) throw error;

      onUpdate(data);
      toast({
        title: "Success",
        description: "Movie/TV show updated successfully!",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update movie/TV show",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Movie/TV Show</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="year">Release Year</Label>
              <Input
                id="year"
                value={formData.release_year}
                onChange={(e) => handleInputChange('release_year', e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => handleInputChange('genre', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="custom-category">Custom Category</Label>
              <Input
                id="custom-category"
                placeholder="e.g., Favorites, To Watch Later"
                value={formData.custom_category}
                onChange={(e) => handleInputChange('custom_category', e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="imdb">IMDb Score</Label>
              <Input
                id="imdb"
                value={formData.imdb_score}
                onChange={(e) => handleInputChange('imdb_score', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="rotten">Rotten Tomatoes</Label>
              <Input
                id="rotten"
                placeholder="e.g., 85%"
                value={formData.rotten_tomatoes_rating}
                onChange={(e) => handleInputChange('rotten_tomatoes_rating', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="rated">Rated</Label>
              <Input
                id="rated"
                placeholder="e.g., PG-13"
                value={formData.rated}
                onChange={(e) => handleInputChange('rated', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="poster">Poster URL</Label>
            <Input
              id="poster"
              value={formData.poster_url}
              onChange={(e) => handleInputChange('poster_url', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="plot">Plot</Label>
            <Textarea
              id="plot"
              value={formData.plot}
              onChange={(e) => handleInputChange('plot', e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="watched"
              checked={formData.watched}
              onCheckedChange={(checked) => handleInputChange('watched', checked)}
            />
            <Label htmlFor="watched">Watched</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditMovieModal;