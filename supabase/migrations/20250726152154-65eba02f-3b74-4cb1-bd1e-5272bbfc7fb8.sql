-- Phase 2: Create RLS Policies for all tables

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