-- Add fixed income fields to investment_transactions table
ALTER TABLE public.investment_transactions 
ADD COLUMN tenure_months integer,
ADD COLUMN interest_rate numeric,
ADD COLUMN maturity_date date;

-- Remove the fields from investments table since they belong at transaction level
ALTER TABLE public.investments 
DROP COLUMN IF EXISTS tenure_months,
DROP COLUMN IF EXISTS interest_rate,
DROP COLUMN IF EXISTS maturity_date;