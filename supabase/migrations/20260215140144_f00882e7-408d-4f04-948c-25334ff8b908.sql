-- Add mf_scheme_code to investments for mutual fund NAV tracking
ALTER TABLE finance.investments 
ADD COLUMN mf_scheme_code TEXT DEFAULT NULL;

-- Add index for quick lookups
CREATE INDEX idx_investments_mf_scheme_code ON finance.investments(mf_scheme_code) WHERE mf_scheme_code IS NOT NULL;