import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  EyeOff, 
  Star, 
  Calendar, 
  MoreVertical, 
  Edit, 
  Trash, 
  Info 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import EditMovieModal from "@/components/movies/EditMovieModal";

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

interface MovieCardProps {
  movie: Movie;
  viewMode: 'grid' | 'list';
  onToggleWatched: (movie: Movie) => void;
  onViewDetails: (movie: Movie) => void;
  onUpdate: (movie: Movie) => void;
  onDelete: (movieId: string) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  viewMode,
  onToggleWatched,
  onViewDetails,
  onUpdate,
  onDelete
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this movie/TV show?')) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('movies_tv')
        .delete()
        .eq('id', movie.id);

      if (error) throw error;

      onDelete(movie.id);
      toast({
        title: "Deleted",
        description: "Movie/TV show deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete movie/TV show",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatRating = (rating: string) => {
    if (!rating || rating === 'N/A') return null;
    return rating;
  };

  if (viewMode === 'list') {
    return (
      <>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Poster */}
              <div className="flex-shrink-0">
                {movie.poster_url && movie.poster_url !== 'N/A' ? (
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="w-16 h-24 object-cover rounded cursor-pointer"
                    onClick={() => onViewDetails(movie)}
                  />
                ) : (
                  <div className="w-16 h-24 bg-muted rounded flex items-center justify-center">
                    <Eye className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="font-semibold text-lg truncate cursor-pointer hover:text-primary"
                      onClick={() => onViewDetails(movie)}
                    >
                      {movie.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {movie.release_year} • {movie.genre}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails(movie)}>
                        <Info className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-destructive"
                      >
                        <Trash className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {formatRating(movie.imdb_score) && (
                    <Badge variant="secondary" className="text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      {movie.imdb_score}/10
                    </Badge>
                  )}
                  {formatRating(movie.rotten_tomatoes_rating) && (
                    <Badge variant="outline" className="text-xs">
                      🍅 {movie.rotten_tomatoes_rating}
                    </Badge>
                  )}
                  {movie.rated && (
                    <Badge variant="outline" className="text-xs">
                      {movie.rated}
                    </Badge>
                  )}
                  {movie.custom_category && (
                    <Badge variant="default" className="text-xs">
                      {movie.custom_category}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate">
                    {movie.plot && movie.plot.length > 100 
                      ? `${movie.plot.substring(0, 100)}...`
                      : movie.plot || 'No plot available'
                    }
                  </p>
                  
                  <Button
                    variant={movie.watched ? "default" : "outline"}
                    size="sm"
                    onClick={() => onToggleWatched(movie)}
                    className="ml-4"
                  >
                    {movie.watched ? (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Watched
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Not Watched
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <EditMovieModal
          movie={movie}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={onUpdate}
        />
      </>
    );
  }

  // Grid view
  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
        <div className="relative">
          {movie.poster_url && movie.poster_url !== 'N/A' ? (
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-full aspect-[2/3] object-contain cursor-pointer"
              onClick={() => onViewDetails(movie)}
            />
          ) : (
            <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
              <Eye className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          
          {/* Watched status overlay */}
          {movie.watched && (
            <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
              <Eye className="w-4 h-4" />
            </div>
          )}

          {/* Action menu */}
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => onViewDetails(movie)}>
                  <Info className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive"
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <CardContent className="p-4">
          <h3 
            className="font-semibold text-lg mb-2 line-clamp-2 cursor-pointer hover:text-primary"
            onClick={() => onViewDetails(movie)}
          >
            {movie.title}
          </h3>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Calendar className="w-4 h-4" />
            <span>{movie.release_year}</span>
            <span>•</span>
            <span>{movie.genre}</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {formatRating(movie.imdb_score) && (
              <Badge variant="secondary" className="text-xs">
                <Star className="w-3 h-3 mr-1" />
                {movie.imdb_score}/10
              </Badge>
            )}
            {formatRating(movie.rotten_tomatoes_rating) && (
              <Badge variant="outline" className="text-xs">
                🍅 {movie.rotten_tomatoes_rating}
              </Badge>
            )}
            {movie.custom_category && (
              <Badge variant="default" className="text-xs">
                {movie.custom_category}
              </Badge>
            )}
          </div>

          <Button
            variant={movie.watched ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleWatched(movie)}
            className="w-full"
          >
            {movie.watched ? (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Watched
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Mark as Watched
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <EditMovieModal
        movie={movie}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={onUpdate}
      />
    </>
  );
};

export default MovieCard;