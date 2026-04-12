export interface AssetType {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface InvestmentPlatform {
  id: string;
  name: string;
  url?: string | null;
  created_at?: string;
}

export interface Investment {
  id: string;
  name: string;
  asset_type_id: string;
  notes: string | null;
  extra_configuration: {
    // Mutual Fund
    mf_scheme_code?: string | null;

    //Crypto fields
    coin_id?: string | null;
    
    // P2P fields
    loans?: number;
    active?: number;
    closed?: number;
    anr?: number;
  } | null;
  created_at: string;
  updated_at: string;
  asset_type?: AssetType; 
  investment_platforms?: InvestmentPlatform;
}

export interface InvestmentTransaction {
  id: string;
  investment_id: string;
  transaction_date: string;
  amount_invested: number;
  tenure_months: number | null;
  interest_rate: number | null;
  maturity_date: string | null;
  created_at: string;
}

export interface InvestmentValuation {
  id: string;
  investment_id: string;
  transaction_id: string | null;
  valuation_date: string;
  current_value: number;
  metadata: { price?: number } | null;
  created_at: string;
}

export interface InvestmentWithLatest extends Investment {
  total_invested: number;
  current_value: number;
  gain_loss: number;
  gain_loss_percent: number;
}

export interface SipConfig {
  id: string;
  investment_id: string;
  amount: number;
  sip_day: number;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  last_executed_date: string | null;
  created_at: string;
  updated_at: string;
}