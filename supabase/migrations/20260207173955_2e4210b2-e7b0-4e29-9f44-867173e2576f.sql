-- Add end_date column to habits table
ALTER TABLE public.habits 
ADD COLUMN end_date DATE DEFAULT NULL;

-- Add a comment explaining the column
COMMENT ON COLUMN public.habits.end_date IS 'Optional end date after which the habit will no longer be shown';
