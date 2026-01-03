-- Add new columns for bond/FD-type investments
ALTER TABLE public.investments
ADD COLUMN tenure_months integer,
ADD COLUMN interest_rate numeric,
ADD COLUMN maturity_date date;