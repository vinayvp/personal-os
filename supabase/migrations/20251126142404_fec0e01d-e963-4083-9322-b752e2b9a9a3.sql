-- Add current_value column to financial_breakdown to track investment growth
ALTER TABLE public.financial_breakdown 
ADD COLUMN current_value numeric NULL;

COMMENT ON COLUMN public.financial_breakdown.current_value IS 'Current value of the investment (only applicable for investment category)';