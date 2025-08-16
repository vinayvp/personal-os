
-- Create categories table for lessons
CREATE TABLE public.lesson_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#3B82F6',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create lessons table
CREATE TABLE public.lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  category_id uuid REFERENCES public.lesson_categories(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.lesson_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for lesson_categories
CREATE POLICY "Anyone can manage lesson categories" 
  ON public.lesson_categories 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create RLS policies for lessons
CREATE POLICY "Anyone can manage lessons" 
  ON public.lessons 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Insert default categories
INSERT INTO public.lesson_categories (name, color) VALUES
  ('Mindset', '#8B5CF6'),
  ('Career', '#10B981'),
  ('Relationships', '#F59E0B'),
  ('Health', '#EF4444'),
  ('Personal Growth', '#3B82F6'),
  ('Finance', '#06B6D4');

-- Create indexes for better performance
CREATE INDEX idx_lessons_category_id ON public.lessons(category_id);
CREATE INDEX idx_lessons_created_at ON public.lessons(created_at);
