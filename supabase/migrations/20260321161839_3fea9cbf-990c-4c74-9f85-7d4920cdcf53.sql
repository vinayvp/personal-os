
-- Create new investment_valuations table in finance schema
CREATE TABLE finance.investment_valuations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id uuid NOT NULL REFERENCES finance.investments(id) ON DELETE CASCADE,
  valuation_date date NOT NULL,
  current_value numeric NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(investment_id, valuation_date)
);

-- Enable RLS
ALTER TABLE finance.investment_valuations ENABLE ROW LEVEL SECURITY;

-- Allow public access (matching existing finance tables pattern)
CREATE POLICY "Anyone can manage investment valuations"
  ON finance.investment_valuations
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Migrate existing value records (amount_invested = 0) from investment_transactions
INSERT INTO finance.investment_valuations (investment_id, valuation_date, current_value, metadata, created_at)
SELECT 
  investment_id,
  transaction_date,
  current_value,
  CASE 
    WHEN interest_rate IS NOT NULL THEN jsonb_build_object('price', interest_rate)
    ELSE '{}'::jsonb
  END,
  created_at
FROM finance.investment_transactions
WHERE amount_invested = 0 AND current_value > 0
ON CONFLICT (investment_id, valuation_date) 
DO UPDATE SET current_value = EXCLUDED.current_value, metadata = EXCLUDED.metadata;

-- Delete the migrated value-only records from investment_transactions
DELETE FROM finance.investment_transactions WHERE amount_invested = 0;

-- Drop the current_value column from investment_transactions (no longer needed)
ALTER TABLE finance.investment_transactions DROP COLUMN IF EXISTS current_value;
