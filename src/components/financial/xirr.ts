/**
 * XIRR (Extended Internal Rate of Return) calculation
 * Uses Newton-Raphson method to find the rate that makes NPV = 0
 */

interface CashFlow {
  amount: number; // negative for investments, positive for returns
  date: Date;
}

const DAYS_PER_YEAR = 365.25;

function xnpv(rate: number, cashFlows: CashFlow[]): number {
  const d0 = cashFlows[0].date;
  return cashFlows.reduce((sum, cf) => {
    const days = (cf.date.getTime() - d0.getTime()) / (1000 * 60 * 60 * 24);
    return sum + cf.amount / Math.pow(1 + rate, days / DAYS_PER_YEAR);
  }, 0);
}

function xnpvDerivative(rate: number, cashFlows: CashFlow[]): number {
  const d0 = cashFlows[0].date;
  return cashFlows.reduce((sum, cf) => {
    const days = (cf.date.getTime() - d0.getTime()) / (1000 * 60 * 60 * 24);
    const t = days / DAYS_PER_YEAR;
    return sum - t * cf.amount / Math.pow(1 + rate, t + 1);
  }, 0);
}

export function calculateXIRR(cashFlows: CashFlow[], guess = 0.1, maxIterations = 100, tolerance = 1e-7): number | null {
  if (cashFlows.length < 2) return null;
  
  // Need at least one positive and one negative flow
  const hasPositive = cashFlows.some(cf => cf.amount > 0);
  const hasNegative = cashFlows.some(cf => cf.amount < 0);
  if (!hasPositive || !hasNegative) return null;

  let rate = guess;
  
  for (let i = 0; i < maxIterations; i++) {
    const npv = xnpv(rate, cashFlows);
    const derivative = xnpvDerivative(rate, cashFlows);
    
    if (Math.abs(derivative) < 1e-10) {
      // Try different guess
      rate = rate + 0.1;
      continue;
    }
    
    const newRate = rate - npv / derivative;
    
    if (Math.abs(newRate - rate) < tolerance) {
      // Sanity check: rate should be between -0.99 and 10 (1000%)
      if (newRate <= -1 || newRate > 10) return null;
      return newRate;
    }
    
    rate = newRate;
    
    // Clamp to prevent divergence
    if (rate < -0.99) rate = -0.5;
    if (rate > 10) rate = 5;
  }
  
  return null;
}

/**
 * Build cash flows for XIRR from investment transactions
 * Buy transactions are negative, current value today is positive
 */
export function buildCashFlows(
  transactions: { transaction_date: string; amount_invested: number }[],
  currentValue: number
): CashFlow[] {
  const flows: CashFlow[] = [];
  
  for (const t of transactions) {
    const amount = Number(t.amount_invested);
    if (amount > 0) {
      // Buy = cash outflow (negative)
      flows.push({ amount: -amount, date: new Date(t.transaction_date) });
    } else if (amount < 0) {
      // Withdrawal = cash inflow (positive)
      flows.push({ amount: Math.abs(amount), date: new Date(t.transaction_date) });
    }
  }
  
  // Current value as final positive cash flow
  if (currentValue > 0) {
    flows.push({ amount: currentValue, date: new Date() });
  }
  
  // Sort by date
  flows.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return flows;
}
