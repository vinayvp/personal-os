-- Phase 1: Database Security Fixes

-- Add user_id columns to tables that need them
ALTER TABLE public.notes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.note_images ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.note_tags ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable RLS on all vulnerable tables
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can manage habits" ON public.habits;
DROP POLICY IF EXISTS "Anyone can manage todos" ON public.todos;
DROP POLICY IF EXISTS "Anyone can manage completions" ON public.habit_completions;
DROP POLICY IF EXISTS "Users can create tags" ON public.tags;
DROP POLICY IF EXISTS "Users can view all tags" ON public.tags;

-- Create secure RLS policies for notes
CREATE POLICY "Users can view own notes" ON public.notes
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notes" ON public.notes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON public.notes
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON public.notes
FOR DELETE USING (auth.uid() = user_id);

-- Create secure RLS policies for note_images
CREATE POLICY "Users can view own note images" ON public.note_images
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own note images" ON public.note_images
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own note images" ON public.note_images
FOR DELETE USING (auth.uid() = user_id);

-- Create secure RLS policies for note_tags
CREATE POLICY "Users can view own note tags" ON public.note_tags
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own note tags" ON public.note_tags
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own note tags" ON public.note_tags
FOR DELETE USING (auth.uid() = user_id);

-- Create secure RLS policies for tags (users can view all but only manage their own)
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE POLICY "Users can view all tags" ON public.tags
FOR SELECT USING (true);

CREATE POLICY "Users can create own tags" ON public.tags
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags" ON public.tags
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags" ON public.tags
FOR DELETE USING (auth.uid() = user_id);

-- Create secure RLS policies for habits
CREATE POLICY "Users can view own habits" ON public.habits
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habits" ON public.habits
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" ON public.habits
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" ON public.habits
FOR DELETE USING (auth.uid() = user_id);

-- Create secure RLS policies for todos
CREATE POLICY "Users can view own todos" ON public.todos
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own todos" ON public.todos
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own todos" ON public.todos
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own todos" ON public.todos
FOR DELETE USING (auth.uid() = user_id);

-- Create secure RLS policies for habit_completions
CREATE POLICY "Users can view own habit completions" ON public.habit_completions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habit completions" ON public.habit_completions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit completions" ON public.habit_completions
FOR DELETE USING (auth.uid() = user_id);

-- Add user_id columns to habits, todos, and habit_completions
ALTER TABLE public.habits ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.todos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.habit_completions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update triggers to include updated_at for new tables
CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create app passwords table for secure password storage
CREATE TABLE public.app_passwords (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on app_passwords (only system can access)
ALTER TABLE public.app_passwords ENABLE ROW LEVEL SECURITY;

-- Create trigger for app_passwords updated_at
CREATE TRIGGER update_app_passwords_updated_at
BEFORE UPDATE ON public.app_passwords
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create session management table
CREATE TABLE public.app_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on app_sessions
ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;

-- Create login attempts table for brute force protection
CREATE TABLE public.login_attempts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL,
    attempt_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    success BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS on login_attempts
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Index for performance
CREATE INDEX idx_login_attempts_ip_time ON public.login_attempts(ip_address, attempt_time);
CREATE INDEX idx_app_sessions_token ON public.app_sessions(session_token);
CREATE INDEX idx_app_sessions_expires ON public.app_sessions(expires_at);