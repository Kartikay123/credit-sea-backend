import { Response } from 'express';
import { User } from '../models/User';
import { Loan } from '../models/Loan';
import { BorrowerProfile } from '../models/BorrowerProfile';
import { Payment } from '../models/Payment';
import { AuthedRequest } from '../types';

// SALES: borrowers who have signed up but not yet created a loan
export async function salesLeads(_req: AuthedRequest, res: Response) {
  const borrowers = await User.find({ role: 'borrower' }).select(
    '_id name email createdAt'
  );
  const borrowerIds = borrowers.map((b) => b._id);
  const loaned = await Loan.find({ user: { $in: borrowerIds } }).distinct(
    'user'
  );
  const loanedSet = new Set(loaned.map(String));
  const profiles = await BorrowerProfile.find({
    user: { $in: borrowerIds },
  }).lean();
  const profileByUser = new Map(
    profiles.map((p) => [String(p.user), p])
  );

  const leads = borrowers
    .filter((b) => !loanedSet.has(String(b._id)))
    .map((b) => {
      const p = profileByUser.get(String(b._id));
      return {
        userId: b._id,
        name: b.name,
        email: b.email,
        registeredAt: b.createdAt,
        hasProfile: !!p,
        salarySlipUploaded: !!(p && p.salarySlipPath),
        breCleared: !!(p && p.breCleared),
      };
    });

  res.json({ leads });
}

// SANCTION: loans in 'applied'
export async function sanctionList(_req: AuthedRequest, res: Response) {
  const loans = await Loan.find({ status: 'applied' })
    .populate('user', 'name email')
    .populate(
      'profile',
      'fullName pan dob monthlySalary employmentMode salarySlipPath'
    )
    .sort({ createdAt: -1 });
  res.json({ loans });
}

export async function sanctionApprove(req: AuthedRequest, res: Response) {
  const loan = await Loan.findById(req.params.id);
  if (!loan) return res.status(404).json({ message: 'Loan not found' });
  if (loan.status !== 'applied') {
    return res
      .status(400)
      .json({ message: `Cannot sanction a loan in '${loan.status}' state` });
  }
  loan.status = 'sanctioned';
  loan.sanctionedBy = req.user!.id as any;
  loan.sanctionedAt = new Date();
  await loan.save();
  res.json({ loan });
}

export async function sanctionReject(req: AuthedRequest, res: Response) {
  const { reason } = req.body as { reason?: string };
  if (!reason || !reason.trim()) {
    return res.status(400).json({ message: 'reason is required' });
  }
  const loan = await Loan.findById(req.params.id);
  if (!loan) return res.status(404).json({ message: 'Loan not found' });
  if (loan.status !== 'applied') {
    return res
      .status(400)
      .json({ message: `Cannot reject a loan in '${loan.status}' state` });
  }
  loan.status = 'rejected';
  loan.rejectionReason = reason.trim();
  loan.sanctionedBy = req.user!.id as any;
  loan.sanctionedAt = new Date();
  await loan.save();
  res.json({ loan });
}

// DISBURSEMENT: loans in 'sanctioned'
export async function disbursementList(_req: AuthedRequest, res: Response) {
  const loans = await Loan.find({ status: 'sanctioned' })
    .populate('user', 'name email')
    .populate('profile', 'fullName pan')
    .sort({ sanctionedAt: -1 });
  res.json({ loans });
}

export async function disburse(req: AuthedRequest, res: Response) {
  const loan = await Loan.findById(req.params.id);
  if (!loan) return res.status(404).json({ message: 'Loan not found' });
  if (loan.status !== 'sanctioned') {
    return res
      .status(400)
      .json({ message: `Cannot disburse a loan in '${loan.status}' state` });
  }
  loan.status = 'disbursed';
  loan.disbursedBy = req.user!.id as any;
  loan.disbursedAt = new Date();
  await loan.save();
  res.json({ loan });
}

// COLLECTION: loans in 'disbursed'
export async function collectionList(_req: AuthedRequest, res: Response) {
  const loans = await Loan.find({ status: { $in: ['disbursed', 'closed'] } })
    .populate('user', 'name email')
    .populate('profile', 'fullName pan')
    .sort({ disbursedAt: -1 });
  res.json({ loans });
}

export async function loanPayments(req: AuthedRequest, res: Response) {
  const payments = await Payment.find({ loan: req.params.id }).sort({
    paymentDate: -1,
  });
  res.json({ payments });
}
