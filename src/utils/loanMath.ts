export const INTEREST_RATE_PCT = 12;
export const MIN_AMOUNT = 50_000;
export const MAX_AMOUNT = 500_000;
export const MIN_TENURE = 30;
export const MAX_TENURE = 365;

export interface LoanQuote {
  principal: number;
  tenureDays: number;
  interestRate: number;
  totalInterest: number;
  totalRepayment: number;
}

export function calculateLoan(
  principal: number,
  tenureDays: number,
  rate: number = INTEREST_RATE_PCT
): LoanQuote {
  const totalInterest = (principal * rate * tenureDays) / (365 * 100);
  const rounded = Math.round(totalInterest * 100) / 100;
  return {
    principal,
    tenureDays,
    interestRate: rate,
    totalInterest: rounded,
    totalRepayment: Math.round((principal + rounded) * 100) / 100,
  };
}

export function isValidLoanRequest(
  amount: number,
  tenure: number
): string | null {
  if (
    !Number.isFinite(amount) ||
    amount < MIN_AMOUNT ||
    amount > MAX_AMOUNT
  ) {
    return `Amount must be between ₹${MIN_AMOUNT} and ₹${MAX_AMOUNT}`;
  }
  if (
    !Number.isFinite(tenure) ||
    tenure < MIN_TENURE ||
    tenure > MAX_TENURE
  ) {
    return `Tenure must be between ${MIN_TENURE} and ${MAX_TENURE} days`;
  }
  return null;
}
