-- Create asset_types table for dynamic asset types
CREATE TABLE public.asset_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.asset_types ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view asset types" ON public.asset_types FOR SELECT USING (true);
CREATE POLICY "Anyone can create asset types" ON public.asset_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update asset types" ON public.asset_types FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete asset types" ON public.asset_types FOR DELETE USING (true);

-- Insert default asset types
INSERT INTO public.asset_types (name, color) VALUES
  ('Crypto', 'hsl(45, 93%, 47%)'),
  ('Mutual Funds', 'hsl(217, 91%, 65%)'),
  ('Stocks', 'hsl(142, 71%, 45%)'),
  ('Bonds', 'hsl(271, 91%, 65%)'),
  ('Commodities', 'hsl(24, 95%, 53%)');

-- Add asset_type_id to investments and migrate existing data
ALTER TABLE public.investments ADD COLUMN asset_type_id UUID REFERENCES public.asset_types(id);

-- Migrate existing data
UPDATE public.investments SET asset_type_id = (SELECT id FROM public.asset_types WHERE LOWER(name) = 'crypto') WHERE asset_type = 'crypto';
UPDATE public.investments SET asset_type_id = (SELECT id FROM public.asset_types WHERE LOWER(name) = 'mutual funds') WHERE asset_type = 'mutual_funds';
UPDATE public.investments SET asset_type_id = (SELECT id FROM public.asset_types WHERE LOWER(name) = 'stocks') WHERE asset_type = 'stocks';
UPDATE public.investments SET asset_type_id = (SELECT id FROM public.asset_types WHERE LOWER(name) = 'bonds') WHERE asset_type = 'bonds';
UPDATE public.investments SET asset_type_id = (SELECT id FROM public.asset_types WHERE LOWER(name) = 'commodities') WHERE asset_type = 'commodities';

-- Make asset_type_id NOT NULL after migration
ALTER TABLE public.investments ALTER COLUMN asset_type_id SET NOT NULL;

-- Drop old asset_type column
ALTER TABLE public.investments DROP COLUMN asset_type;