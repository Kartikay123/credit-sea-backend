import { Request } from 'express';

export type Role =
  | 'admin'
  | 'sales'
  | 'sanction'
  | 'disbursement'
  | 'collection'
  | 'borrower';

export const ALL_ROLES: Role[] = [
  'admin',
  'sales',
  'sanction',
  'disbursement',
  'collection',
  'borrower',
];

export interface AuthPayload {
  id: string;
  role: Role;
  email: string;
}

export interface AuthedRequest extends Request {
  user?: AuthPayload;
}

export type EmploymentMode = 'salaried' | 'self_employed' | 'unemployed';

export type LoanStatus =
  | 'applied'
  | 'sanctioned'
  | 'rejected'
  | 'disbursed'
  | 'closed';
