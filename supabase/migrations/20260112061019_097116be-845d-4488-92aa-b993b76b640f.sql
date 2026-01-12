-- Drop the existing check constraint and recreate it with the new values
ALTER TABLE public.habits DROP CONSTRAINT IF EXISTS habits_frequency_type_check;

-- Add the new constraint that includes 'none'
ALTER TABLE public.habits ADD CONSTRAINT habits_frequency_type_check 
  CHECK (frequency_type IN ('daily', 'weekly', 'custom', 'none'));

-- Also update target_period to allow 'total'
ALTER TABLE public.habits DROP CONSTRAINT IF EXISTS habits_target_period_check;

-- Add the new constraint that includes 'total'
ALTER TABLE public.habits ADD CONSTRAINT habits_target_period_check 
  CHECK (target_period IN ('weekly', 'monthly', 'yearly', 'total'));