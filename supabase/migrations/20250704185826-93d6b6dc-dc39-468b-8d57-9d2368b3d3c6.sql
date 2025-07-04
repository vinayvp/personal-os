
-- Drop old tracking table
DROP TABLE IF EXISTS public.daily_tracking;

-- Create habits table
CREATE TABLE public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  goal TEXT,
  frequency_type TEXT NOT NULL CHECK (frequency_type IN ('daily', 'weekly', 'custom')),
  target_count INTEGER NOT NULL DEFAULT 1,
  target_period TEXT NOT NULL CHECK (target_period IN ('weekly', 'monthly', 'yearly')) DEFAULT 'weekly',
  custom_days INTEGER[] DEFAULT NULL, -- Array of weekdays (0=Sunday, 1=Monday, etc.) for custom scheduling
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create habit completions table
CREATE TABLE public.habit_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(habit_id, completion_date)
);

-- Create indexes for better performance
CREATE INDEX idx_habit_completions_habit_id ON public.habit_completions(habit_id);
CREATE INDEX idx_habit_completions_date ON public.habit_completions(completion_date);
CREATE INDEX idx_habit_completions_habit_date ON public.habit_completions(habit_id, completion_date);

-- Enable RLS
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for habits
CREATE POLICY "Anyone can manage habits" ON public.habits FOR ALL USING (true) WITH CHECK (true);

-- Create RLS policies for habit completions  
CREATE POLICY "Anyone can manage completions" ON public.habit_completions FOR ALL USING (true) WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
