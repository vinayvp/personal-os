import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Star, 
  Calendar, 
  Eye, 
  EyeOff, 
  Clock,
  Award,
  Film,
  Play,
  Users,
  Clapperboard
} from "lucide-react";

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
  actors?: string;
  directors?: string;
  imdb_id?: string;
  created_at: string;
  updated_at: string;
}

interface MovieDetailModalProps {
  movie: Movie;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (movie: Movie) => void;
  onToggleWatched: (movie: Movie) => void;
}

const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  movie,
  isOpen,
  onClose,
  onUpdate,
  onToggleWatched
}) => {
  const formatRating = (rating: string) => {
    if (!rating || rating === 'N/A') return null;
    return rating;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getWatchNowUrl = (title: string) => {
    const formattedTitle = title.toLowerCase().replace(/\s+/g, '+');
    //return `https://tmovie.tv/search?query=${formattedTitle}`;
    return `https://watch-v2.autoembed.cc/search?q=${formattedTitle}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Movie Details</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Poster */}
          <div className="md:col-span-1">
            {movie.poster_url && movie.poster_url !== 'N/A' ? (
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="w-full rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-muted rounded-lg flex items-center justify-center">
                <Film className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{movie.release_year}</span>
                </div>
                <span>•</span>
                <span>{movie.genre}</span>
                {movie.rated && (
                  <>
                    <span>•</span>
                    <Badge variant="outline">{movie.rated}</Badge>
                  </>
                )}
              </div>

              {/* Watch Status & Watch Now */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  onClick={() => onToggleWatched(movie)}
                  variant={movie.watched ? "default" : "outline"}
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
                <Button
                  onClick={() => window.open(getWatchNowUrl(movie.title), '_blank')}
                  variant="secondary"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Watch Now
                </Button>
              </div>
            </div>

            {/* Ratings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Ratings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {formatRating(movie.imdb_score) && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold">IMDb</span>
                      </div>
                      <div className="text-2xl font-bold">{movie.imdb_score}/10</div>
                    </div>
                  )}
                  {formatRating(movie.rotten_tomatoes_rating) && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-lg">🍅</span>
                        <span className="font-semibold">Rotten Tomatoes</span>
                      </div>
                      <div className="text-2xl font-bold">{movie.rotten_tomatoes_rating}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Plot */}
            {movie.plot && (
              <Card>
                <CardHeader>
                  <CardTitle>Plot</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {movie.plot}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Cast & Crew */}
            {(movie.directors || movie.actors) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clapperboard className="w-5 h-5" />
                    Cast & Crew
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {movie.directors && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium mb-1.5">
                        <Clapperboard className="w-4 h-4 text-muted-foreground" />
                        Director{movie.directors.includes(',') ? 's' : ''}
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {movie.directors}
                      </p>
                    </div>
                  )}
                  {movie.actors && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium mb-1.5">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        Cast
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {movie.actors}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Categories */}
            {movie.custom_category && (
              <Card>
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">{movie.custom_category}</Badge>
                    <Badge variant="secondary">{movie.genre}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Added
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {formatDate(movie.created_at)}
                </p>
                {movie.updated_at !== movie.created_at && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Last updated: {formatDate(movie.updated_at)}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MovieDetailModal;
