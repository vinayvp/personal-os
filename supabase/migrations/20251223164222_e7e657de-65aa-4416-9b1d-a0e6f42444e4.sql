-- Drop existing financial tables (they will cascade to breakdowns)
DROP TABLE IF EXISTS public.financial_breakdown CASCADE;
DROP TABLE IF EXISTS public.financial_snapshots CASCADE;

-- Create investments table
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('crypto', 'mutual_funds', 'stocks', 'bonds', 'commodities')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transaction logs table for tracking investment history
CREATE TABLE public.investment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  amount_invested NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for investments
CREATE POLICY "Anyone can view investments"
  ON public.investments FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create investments"
  ON public.investments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update investments"
  ON public.investments FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete investments"
  ON public.investments FOR DELETE
  USING (true);

-- Create RLS policies for investment_transactions
CREATE POLICY "Anyone can view transactions"
  ON public.investment_transactions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create transactions"
  ON public.investment_transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update transactions"
  ON public.investment_transactions FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete transactions"
  ON public.investment_transactions FOR DELETE
  USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_investments_updated_at
  BEFORE UPDATE ON public.investments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_investment_transactions_investment_id ON public.investment_transactions(investment_id);
CREATE INDEX idx_investment_transactions_date ON public.investment_transactions(transaction_date);