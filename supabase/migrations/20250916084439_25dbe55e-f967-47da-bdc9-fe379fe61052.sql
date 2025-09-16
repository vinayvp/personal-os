-- Create movies_tv table
CREATE TABLE public.movies_tv (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  release_year TEXT,
  genre TEXT,
  custom_category TEXT,
  imdb_score TEXT,
  rotten_tomatoes_rating TEXT,
  rated TEXT,
  poster_url TEXT,
  plot TEXT,
  watched BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create movies_categories table
CREATE TABLE public.movies_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.movies_tv ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for movies_tv
CREATE POLICY "Anyone can manage movies_tv" 
ON public.movies_tv 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create policies for movies_categories
CREATE POLICY "Anyone can manage categories" 
ON public.movies_categories 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates on movies_tv
CREATE TRIGGER update_movies_tv_updated_at
BEFORE UPDATE ON public.movies_tv
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_movies_tv_genre ON public.movies_tv(genre);
CREATE INDEX idx_movies_tv_watched ON public.movies_tv(watched);
CREATE INDEX idx_movies_tv_created_at ON public.movies_tv(created_at);