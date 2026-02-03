-- Add actors column to movies_tv table
ALTER TABLE public.movies_tv 
ADD COLUMN IF NOT EXISTS actors text;