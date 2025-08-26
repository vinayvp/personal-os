-- Create journal_entries table
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  content TEXT,
  rich_content JSONB,
  tags TEXT[] DEFAULT '{}',
  mood TEXT,
  attachments TEXT[] DEFAULT '{}',
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Anyone can manage journal entries" 
ON public.journal_entries 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_journal_entries_date ON public.journal_entries(date);
CREATE INDEX idx_journal_entries_tags ON public.journal_entries USING GIN(tags);
CREATE INDEX idx_journal_entries_created_at ON public.journal_entries(created_at);

-- Create unique constraint for one entry per date (can be removed if multiple entries per day needed)
CREATE UNIQUE INDEX idx_journal_entries_unique_date ON public.journal_entries(date);

-- Add journal PIN to app_settings if not exists
INSERT INTO public.app_settings (setting_key, setting_value) 
VALUES ('journal_pin', '1234') 
ON CONFLICT (setting_key) DO NOTHING;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_journal_entries_updated_at
    BEFORE UPDATE ON public.journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();