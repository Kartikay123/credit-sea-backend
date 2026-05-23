import { Response } from 'express';
import mongoose from 'mongoose';
import { Loan } from '../models/Loan';
import { Payment } from '../models/Payment';
import { AuthedRequest } from '../types';

export async function recordPayment(req: AuthedRequest, res: Response) {
  const { loanId } = req.params;
  const { utrNumber, amount, paymentDate } = req.body as {
    utrNumber?: string;
    amount?: number;
    paymentDate?: string;
  };

  if (!utrNumber || !utrNumber.trim()) {
    return res.status(400).json({ message: 'utrNumber is required' });
  }
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    return res
      .status(400)
      .json({ message: 'amount must be a positive number' });
  }

  if (!mongoose.isValidObjectId(loanId)) {
    return res.status(400).json({ message: 'Invalid loan id' });
  }

  const loan = await Loan.findById(loanId);
  if (!loan) return res.status(404).json({ message: 'Loan not found' });
  if (loan.status !== 'disbursed') {
    return res.status(400).json({
      message: `Payments can only be recorded for disbursed loans (current: ${loan.status})`,
    });
  }

  const outstanding = loan.totalRepayment - loan.amountPaid;
  if (amt > outstanding + 0.001) {
    return res.status(400).json({
      message: `Amount exceeds outstanding balance of ₹${outstanding.toFixed(
        2
      )}`,
    });
  }

  const dup = await Payment.findOne({
    utrNumber: utrNumber.trim().toUpperCase(),
  });
  if (dup) {
    return res
      .status(409)
      .json({ message: 'Duplicate UTR number — payment already recorded' });
  }

  const payment = await Payment.create({
    loan: loan._id,
    utrNumber: utrNumber.trim().toUpperCase(),
    amount: amt,
    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
    recordedBy: req.user!.id,
  });

  loan.amountPaid = Math.round((loan.amountPaid + amt) * 100) / 100;
  if (loan.amountPaid >= loan.totalRepayment - 0.001) {
    loan.status = 'closed';
    loan.closedAt = new Date();
  }
  await loan.save();

  res.status(201).json({ payment, loan });
}
