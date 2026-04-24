CREATE TABLE public.movies_platforms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url_template TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.movies_platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage movies platforms"
ON public.movies_platforms
FOR ALL
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_movies_platforms_updated_at
BEFORE UPDATE ON public.movies_platforms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.movies_platforms (name, url_template, enabled, is_default)
VALUES ('AutoEmbed', 'https://watch-v2.autoembed.cc/search?q={query}', true, true);