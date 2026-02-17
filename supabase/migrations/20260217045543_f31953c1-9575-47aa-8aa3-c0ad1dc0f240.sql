
-- Create SIP configurations table in finance schema
CREATE TABLE finance.sip_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id UUID NOT NULL REFERENCES finance.investments(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  sip_day INTEGER NOT NULL CHECK (sip_day >= 1 AND sip_day <= 28),
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  last_executed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE finance.sip_configs ENABLE ROW LEVEL SECURITY;

-- Allow all operations (matching existing finance tables pattern)
CREATE POLICY "Anyone can manage sip_configs" 
ON finance.sip_configs 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Index for finding active SIPs that need execution
CREATE INDEX idx_sip_configs_active ON finance.sip_configs(is_active, sip_day) WHERE is_active = true;
