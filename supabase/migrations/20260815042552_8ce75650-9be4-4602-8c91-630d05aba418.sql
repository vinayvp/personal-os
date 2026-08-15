ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS instagram_url text;
ALTER TABLE public.lessons ALTER COLUMN content SET DEFAULT '';