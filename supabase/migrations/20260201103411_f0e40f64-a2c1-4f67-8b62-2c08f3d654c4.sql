-- Drop the unique constraint that prevents multiple completions per day
ALTER TABLE public.habit_completions 
DROP CONSTRAINT IF EXISTS habit_completions_habit_id_completion_date_key;