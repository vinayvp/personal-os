-- Create financial snapshots table to track salary and totals over time
CREATE TABLE public.financial_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  salary DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financial breakdown table for expenses and investments
CREATE TABLE public.financial_breakdown (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_id UUID NOT NULL REFERENCES public.financial_snapshots(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('expense', 'investment', 'savings')),
  name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.financial_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_breakdown ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (following the pattern of other apps)
CREATE POLICY "Anyone can manage financial snapshots"
ON public.financial_snapshots
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can manage financial breakdown"
ON public.financial_breakdown
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates on financial_snapshots
CREATE TRIGGER update_financial_snapshots_updated_at
BEFORE UPDATE ON public.financial_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_financial_snapshots_date ON public.financial_snapshots(date);
CREATE INDEX idx_financial_breakdown_snapshot_id ON public.financial_breakdown(snapshot_id);