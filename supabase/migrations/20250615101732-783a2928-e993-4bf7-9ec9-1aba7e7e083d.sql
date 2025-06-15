
-- Drop dependent policies on note_tags
DROP POLICY IF EXISTS "Users can view note_tags for their notes" ON public.note_tags;
DROP POLICY IF EXISTS "Users can create note_tags for their notes" ON public.note_tags;
DROP POLICY IF EXISTS "Users can delete note_tags for their notes" ON public.note_tags;

-- Drop dependent policies on note_images
DROP POLICY IF EXISTS "Users can view images for their notes" ON public.note_images;
DROP POLICY IF EXISTS "Users can create images for their notes" ON public.note_images;
DROP POLICY IF EXISTS "Users can delete images for their notes" ON public.note_images;

-- Disable RLS on note_tags and note_images
ALTER TABLE public.note_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_images DISABLE ROW LEVEL SECURITY;

-- Drop policies from 'notes' table
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can create their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;

-- Drop policies from 'tags' table
DROP POLICY IF EXISTS "Users can manage their own tags" ON public.tags;

-- Disable RLS on notes and tags tables
ALTER TABLE public.notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags DISABLE ROW LEVEL SECURITY;

-- Drop user_id columns
ALTER TABLE public.notes DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.tags DROP COLUMN IF EXISTS user_id;
