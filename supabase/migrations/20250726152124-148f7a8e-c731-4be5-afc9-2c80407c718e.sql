-- Phase 1: Database Security Fixes (Fixed Order)

-- First, add user_id columns to all tables that need them
ALTER TABLE public.notes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.note_images ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.note_tags ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.habits ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.todos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.habit_completions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.tags ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable RLS on all vulnerable tables
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can manage habits" ON public.habits;
DROP POLICY IF EXISTS "Anyone can manage todos" ON public.todos;
DROP POLICY IF EXISTS "Anyone can manage completions" ON public.habit_completions;
DROP POLICY IF EXISTS "Users can create tags" ON public.tags;
DROP POLICY IF EXISTS "Users can view all tags" ON public.tags;