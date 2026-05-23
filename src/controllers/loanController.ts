import { Response } from 'express';
import { Loan } from '../models/Loan';
import { BorrowerProfile } from '../models/BorrowerProfile';
import {
  calculateLoan,
  isValidLoanRequest,
  INTEREST_RATE_PCT,
} from '../utils/loanMath';
import { AuthedRequest } from '../types';

export async function applyForLoan(req: AuthedRequest, res: Response) {
  const { amount, tenureDays } = req.body as {
    amount?: number;
    tenureDays?: number;
  };
  if (amount === undefined || tenureDays === undefined) {
    return res
      .status(400)
      .json({ message: 'amount and tenureDays are required' });
  }
  const a = Number(amount);
  const t = Number(tenureDays);
  const err = isValidLoanRequest(a, t);
  if (err) return res.status(400).json({ message: err });

  const profile = await BorrowerProfile.findOne({ user: req.user!.id });
  if (!profile || !profile.breCleared) {
    return res
      .status(400)
      .json({ message: 'Profile incomplete or not BRE-cleared' });
  }
  if (!profile.salarySlipPath) {
    return res
      .status(400)
      .json({ message: 'Please upload your salary slip first' });
  }

  const existingActive = await Loan.findOne({
    user: req.user!.id,
    status: { $in: ['applied', 'sanctioned', 'disbursed'] },
  });
  if (existingActive) {
    return res
      .status(409)
      .json({ message: 'You already have an active loan in progress' });
  }

  const quote = calculateLoan(a, t, INTEREST_RATE_PCT);

  const loan = await Loan.create({
    user: req.user!.id,
    profile: profile._id,
    amount: a,
    tenureDays: t,
    interestRate: INTEREST_RATE_PCT,
    totalInterest: quote.totalInterest,
    totalRepayment: quote.totalRepayment,
    status: 'applied',
  });

  res.status(201).json({ loan });
}

export async function myLoans(req: AuthedRequest, res: Response) {
  const loans = await Loan.find({ user: req.user!.id }).sort({
    createdAt: -1,
  });
  res.json({ loans });
}

export async function quoteLoan(req: AuthedRequest, res: Response) {
  const amount = Number(req.query.amount);
  const tenure = Number(req.query.tenureDays);
  const err = isValidLoanRequest(amount, tenure);
  if (err) return res.status(400).json({ message: err });
  res.json(calculateLoan(amount, tenure));
}
