
-- Add icon and color fields to the habits table
ALTER TABLE public.habits 
ADD COLUMN icon TEXT DEFAULT 'radio_button_checked',
ADD COLUMN color TEXT DEFAULT '#3B82F6';
