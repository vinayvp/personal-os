import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Grid, List, Play, Check, FolderPlus, Upload, ChevronUp, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AddMovieModal from "@/components/movies/AddMovieModal";
import MovieCard from "@/components/movies/MovieCard";
import MovieDetailModal from "@/components/movies/MovieDetailModal";
import CreateCategoryModal from "@/components/movies/CreateCategoryModal";
import BulkImportModal from "@/components/movies/BulkImportModal";

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

const MoviesApp = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [watchedFilter, setWatchedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMovies();
    loadCategories();
  }, []);

  const loadMovies = async () => {
    try {
      const { data, error } = await supabase
        .from('movies_tv')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMovies(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load movies/TV shows",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('movies_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleMovieAdded = (newMovie: Movie) => {
    setMovies(prev => [newMovie, ...prev]);
    loadCategories(); // Reload categories in case a new one was added
  };

  const handleMoviesAdded = (newMovies: Movie[]) => {
    setMovies(prev => [...newMovies, ...prev]);
    loadCategories(); // Reload categories in case new ones were added
  };

  const handleMovieUpdated = (updatedMovie: Movie) => {
    setMovies(prev => prev.map(movie => 
      movie.id === updatedMovie.id ? updatedMovie : movie
    ));
  };

  const handleMovieDeleted = (movieId: string) => {
    setMovies(prev => prev.filter(movie => movie.id !== movieId));
  };

  const handleCategoryCreated = (newCategory: Category) => {
    setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const toggleWatched = async (movie: Movie) => {
    try {
      const { data, error } = await supabase
        .from('movies_tv')
        .update({ watched: !movie.watched })
        .eq('id', movie.id)
        .select()
        .single();

      if (error) throw error;

      setMovies(prev => prev.map(m => m.id === movie.id ? data : m));
      
      toast({
        title: "Status Updated",
        description: `Marked as ${!movie.watched ? 'watched' : 'not watched'}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update watch status",
        variant: "destructive",
      });
    }
  };

  // Get unique genres and categories for filtering
  const allGenres = Array.from(new Set(
    movies.flatMap(movie => 
      movie.genre ? movie.genre.split(',').map(g => g.trim()) : []
    ).filter(Boolean)
  ));
  const allCategories = Array.from(new Set(movies.map(movie => movie.custom_category).filter(Boolean)));
  const filterOptions = [
    { value: 'all', label: 'All' },
    ...allGenres.map(genre => ({ value: `genre:${genre}`, label: genre })),
    ...allCategories.map(category => ({ value: `category:${category}`, label: category })),
  ];

  // Filter and sort movies
  const filteredAndSortedMovies = movies
    .filter(movie => {
      const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
        (selectedCategory.startsWith('genre:') && movie.genre?.split(',').map(g => g.trim()).includes(selectedCategory.replace('genre:', ''))) ||
        (selectedCategory.startsWith('category:') && movie.custom_category === selectedCategory.replace('category:', ''));
      
      const matchesWatched = watchedFilter === 'all' || 
        (watchedFilter === 'watched' && movie.watched) ||
        (watchedFilter === 'unwatched' && !movie.watched);

      return matchesSearch && matchesCategory && matchesWatched;
    })
    .sort((a, b) => {
      let result = 0;
      
      switch (sortBy) {
        case 'title':
          result = a.title.localeCompare(b.title);
          break;
        case 'year':
          const yearA = parseInt(a.release_year) || 0;
          const yearB = parseInt(b.release_year) || 0;
          result = yearA - yearB;
          break;
        case 'imdb_rating':
          const ratingA = parseFloat(a.imdb_score) || 0;
          const ratingB = parseFloat(b.imdb_score) || 0;
          result = ratingA - ratingB;
          break;
        case 'created_at':
        default:
          result = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      
      return sortDirection === 'asc' ? result : -result;
    });

  const watchedCount = movies.filter(movie => movie.watched).length;
  const totalCount = movies.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading movies...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Movies & TV Shows</h1>
            <p className="text-muted-foreground">
              {totalCount} total • {watchedCount} watched • {totalCount - watchedCount} unwatched
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button 
              variant="outline"
              onClick={() => setIsCreateCategoryModalOpen(true)}
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsBulkImportModalOpen(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Bulk Import
            </Button>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Movie/TV Show
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search movies and TV shows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 -mb-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm flex-shrink-0"
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={watchedFilter}
              onChange={(e) => setWatchedFilter(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm flex-shrink-0"
            >
              <option value="all">All Status</option>
              <option value="watched">Watched</option>
              <option value="unwatched">Not Watched</option>
            </select>

            <div className="flex items-center flex-shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-l-md text-sm border-r-0"
              >
                <option value="created_at">Sort by Date Added</option>
                <option value="title">Sort by Title</option>
                <option value="year">Sort by Year</option>
                <option value="imdb_rating">Sort by IMDB Rating</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="rounded-l-none px-2"
              >
                {sortDirection === 'asc' ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="flex border border-input rounded-md flex-shrink-0">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none rounded-l-md"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none rounded-r-md"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Movies Grid/List */}
        {filteredAndSortedMovies.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Play className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No movies found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {movies.length === 0 
                  ? "Start building your watchlist by adding your first movie or TV show."
                  : "Try adjusting your search or filters."
                }
              </p>
              {movies.length === 0 && (
                <Button onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Movie
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6"
            : "space-y-4"
          }>
            {filteredAndSortedMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                viewMode={viewMode}
                onToggleWatched={toggleWatched}
                onViewDetails={(movie) => {
                  setSelectedMovie(movie);
                  setIsDetailModalOpen(true);
                }}
                onUpdate={handleMovieUpdated}
                onDelete={handleMovieDeleted}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <AddMovieModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onMovieAdded={handleMovieAdded}
          categories={categories}
        />

        {selectedMovie && (
          <MovieDetailModal
            movie={selectedMovie}
            isOpen={isDetailModalOpen}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedMovie(null);
            }}
            onUpdate={handleMovieUpdated}
            onToggleWatched={toggleWatched}
          />
        )}

        <CreateCategoryModal
          isOpen={isCreateCategoryModalOpen}
          onClose={() => setIsCreateCategoryModalOpen(false)}
          onCategoryCreated={handleCategoryCreated}
        />

        <BulkImportModal
          isOpen={isBulkImportModalOpen}
          onClose={() => setIsBulkImportModalOpen(false)}
          onMoviesAdded={handleMoviesAdded}
        />
      </div>
    </div>
  );
};

export default MoviesApp;