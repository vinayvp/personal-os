import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Star, Calendar, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

interface Category {
  id: string;
  name: string;
}

interface OMDbData {
  Title: string;
  Year: string;
  Genre: string;
  imdbRating: string;
  Ratings: Array<{ Source: string; Value: string }>;
  Rated: string;
  Poster: string;
  Plot: string;
}

interface AddMovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMovieAdded: (movie: Movie) => void;
  categories: Category[];
}

const AddMovieModal: React.FC<AddMovieModalProps> = ({
  isOpen,
  onClose,
  onMovieAdded,
  categories
}) => {
  const [searchTitle, setSearchTitle] = useState('');
  const [searchResults, setSearchResults] = useState<OMDbData[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<OMDbData | null>(null);
  const [editableData, setEditableData] = useState<Partial<OMDbData>>({});
  const [customCategory, setCustomCategory] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchError, setSearchError] = useState('');
  const { toast } = useToast();

  const searchOMDb = async () => {
    if (!searchTitle.trim()) return;

    setIsSearching(true);
    setSearchError('');
    
    try {
      const { data, error } = await supabase.functions.invoke('search-movie', {
        body: { title: searchTitle }
      });

      if (error) {
        console.error('Edge function error:', error);
        setSearchError('Failed to search. Please try again.');
        setSearchResults([]);
        return;
      }

      if (data) {
        // Convert the edge function response to OMDbData format
        const movieResult: OMDbData = {
          Title: data.title,
          Year: data.release_year,
          Genre: data.genre,
          imdbRating: data.imdb_score,
          Ratings: [
            { Source: 'Internet Movie Database', Value: `${data.imdb_score}/10` },
            { Source: 'Rotten Tomatoes', Value: data.rotten_tomatoes_rating }
          ],
          Rated: data.rated,
          Poster: data.poster_url || 'N/A',
          Plot: data.plot
        };
        setSearchResults([movieResult]);
      } else {
        setSearchError('No results found');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Failed to search. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectMovie = (movie: OMDbData) => {
    setSelectedMovie(movie);
    setEditableData({
      Title: movie.Title,
      Year: movie.Year,
      Genre: movie.Genre,
      imdbRating: movie.imdbRating,
      Rated: movie.Rated,
      Poster: movie.Poster,
      Plot: movie.Plot
    });
  };

  const saveMovie = async () => {
    if (!selectedMovie || !editableData.Title) return;

    setIsSaving(true);
    try {
      // Create custom category if provided
      let categoryToUse = customCategory.trim();
      if (categoryToUse) {
        const { error: categoryError } = await supabase
          .from('movies_categories')
          .upsert({ name: categoryToUse });
        
        if (categoryError) {
          console.error('Error creating category:', categoryError);
        }
      }

      // Split genres and create category entries for each
      const genreString = editableData.Genre || selectedMovie.Genre;
      if (genreString) {
        const genres = genreString.split(',').map(g => g.trim()).filter(g => g.length > 0);
        for (const genre of genres) {
          const { error: genreError } = await supabase
            .from('movies_categories')
            .upsert({ name: genre });
          
          if (genreError) {
            console.error('Error creating genre category:', genreError);
          }
        }
      }

      // Get Rotten Tomatoes rating
      const rottenTomatoesRating = selectedMovie.Ratings?.find(
        rating => rating.Source === 'Rotten Tomatoes'
      )?.Value || '';

      const movieData = {
        title: editableData.Title || selectedMovie.Title,
        release_year: editableData.Year || selectedMovie.Year,
        genre: editableData.Genre || selectedMovie.Genre,
        custom_category: categoryToUse || null,
        imdb_score: editableData.imdbRating || selectedMovie.imdbRating,
        rotten_tomatoes_rating: rottenTomatoesRating,
        rated: editableData.Rated || selectedMovie.Rated,
        poster_url: editableData.Poster || selectedMovie.Poster,
        plot: editableData.Plot || selectedMovie.Plot,
        watched: false
      };

      const { data, error } = await supabase
        .from('movies_tv')
        .insert(movieData)
        .select()
        .single();

      if (error) throw error;

      onMovieAdded(data);
      toast({
        title: "Success",
        description: "Movie/TV show added successfully!",
      });
      
      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save movie/TV show",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSearchTitle('');
    setSearchResults([]);
    setSelectedMovie(null);
    setEditableData({});
    setCustomCategory('');
    setSearchError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Movie/TV Show</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Section */}
          {!selectedMovie && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search for a movie or TV show..."
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchOMDb()}
                />
                <Button onClick={searchOMDb} disabled={isSearching}>
                  <Search className="w-4 h-4 mr-2" />
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {searchError && (
                <div className="text-destructive text-sm">{searchError}</div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Search Results</h3>
                  <div className="grid gap-3 max-h-96 overflow-y-auto">
                    {searchResults.map((movie, index) => (
                      <Card key={index} className="cursor-pointer hover:bg-accent" onClick={() => selectMovie(movie)}>
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            {movie.Poster !== 'N/A' && (
                              <img
                                src={movie.Poster}
                                alt={movie.Title}
                                className="w-16 h-24 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-semibold">{movie.Title}</h4>
                              <p className="text-sm text-muted-foreground">{movie.Year} • {movie.Genre}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  <Star className="w-3 h-3 mr-1" />
                                  {movie.imdbRating}/10
                                </Badge>
                                <Badge variant="outline" className="text-xs">{movie.Rated}</Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Edit Selected Movie */}
          {selectedMovie && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Edit Movie Details</h3>
                <Button variant="outline" onClick={() => setSelectedMovie(null)}>
                  Back to Search
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Poster */}
                <div>
                  {editableData.Poster && editableData.Poster !== 'N/A' && (
                    <img
                      src={editableData.Poster}
                      alt={editableData.Title}
                      className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
                    />
                  )}
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={editableData.Title || ''}
                      onChange={(e) => setEditableData(prev => ({ ...prev, Title: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        value={editableData.Year || ''}
                        onChange={(e) => setEditableData(prev => ({ ...prev, Year: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rated">Rated</Label>
                      <Input
                        id="rated"
                        value={editableData.Rated || ''}
                        onChange={(e) => setEditableData(prev => ({ ...prev, Rated: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="genre">Genre</Label>
                    <Input
                      id="genre"
                      value={editableData.Genre || ''}
                      onChange={(e) => setEditableData(prev => ({ ...prev, Genre: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="imdb">IMDb Rating</Label>
                    <Input
                      id="imdb"
                      value={editableData.imdbRating || ''}
                      onChange={(e) => setEditableData(prev => ({ ...prev, imdbRating: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="custom-category">Custom Category (Optional)</Label>
                    <Input
                      id="custom-category"
                      placeholder="e.g., Favorites, To Watch Later"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="plot">Plot</Label>
                    <Textarea
                      id="plot"
                      value={editableData.Plot || ''}
                      onChange={(e) => setEditableData(prev => ({ ...prev, Plot: e.target.value }))}
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="poster">Poster URL</Label>
                    <Input
                      id="poster"
                      value={editableData.Poster || ''}
                      onChange={(e) => setEditableData(prev => ({ ...prev, Poster: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={saveMovie} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Movie'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddMovieModal;