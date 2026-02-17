import { supabase } from './client';

/**
 * Helper to query the finance schema tables.
 * Since the Supabase types only know about the public schema,
 * we cast through any to use .schema('finance').
 */
export const financeDb = {
  from: (table: 'investments' | 'investment_transactions' | 'asset_types' | 'sip_configs') => {
    return (supabase as any).schema('finance').from(table);
  },
};
