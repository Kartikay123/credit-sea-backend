import { EmploymentMode } from '../types';

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export interface BREInput {
  dob: Date;
  monthlySalary: number;
  pan: string;
  employmentMode: EmploymentMode;
}

export interface BREResult {
  passed: boolean;
  reasons: string[];
}

export function calculateAge(dob: Date, today: Date = new Date()): number {
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

export function runBRE(input: BREInput): BREResult {
  const reasons: string[] = [];
  const age = calculateAge(input.dob);
  if (age < 23 || age > 50) {
    reasons.push(`Age must be between 23 and 50 (got ${age})`);
  }
  if (input.monthlySalary < 25000) {
    reasons.push('Monthly salary must be at least ₹25,000');
  }
  if (!PAN_REGEX.test(input.pan)) {
    reasons.push('PAN format is invalid (expected AAAAA9999A)');
  }
  if (input.employmentMode === 'unemployed') {
    reasons.push('Applicant must be employed (salaried or self-employed)');
  }
  return { passed: reasons.length === 0, reasons };
}
