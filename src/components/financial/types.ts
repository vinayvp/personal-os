export type AssetType = 'crypto' | 'mutual_funds' | 'stocks' | 'bonds' | 'commodities';

export interface Investment {
  id: string;
  name: string;
  asset_type: AssetType;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvestmentTransaction {
  id: string;
  investment_id: string;
  transaction_date: string;
  amount_invested: number;
  current_value: number;
  created_at: string;
}

export interface InvestmentWithLatest extends Investment {
  total_invested: number;
  current_value: number;
  gain_loss: number;
  gain_loss_percent: number;
}

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  crypto: 'Crypto',
  mutual_funds: 'Mutual Funds',
  stocks: 'Stocks',
  bonds: 'Bonds',
  commodities: 'Commodities',
};

export const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  crypto: 'hsl(45, 93%, 47%)',
  mutual_funds: 'hsl(217, 91%, 65%)',
  stocks: 'hsl(142, 71%, 45%)',
  bonds: 'hsl(271, 91%, 65%)',
  commodities: 'hsl(24, 95%, 53%)',
};
