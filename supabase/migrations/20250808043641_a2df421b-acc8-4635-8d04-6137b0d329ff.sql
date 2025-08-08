-- Enable RLS on todos table (it appears to be missing despite policies existing)
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;