import { Response } from 'express';
import { BorrowerProfile } from '../models/BorrowerProfile';
import { runBRE } from '../utils/bre';
import { AuthedRequest, EmploymentMode } from '../types';

export async function getMyProfile(req: AuthedRequest, res: Response) {
  const profile = await BorrowerProfile.findOne({ user: req.user!.id });
  res.json({ profile });
}

export async function upsertProfile(req: AuthedRequest, res: Response) {
  const { fullName, pan, dob, monthlySalary, employmentMode } = req.body as {
    fullName?: string;
    pan?: string;
    dob?: string;
    monthlySalary?: number;
    employmentMode?: EmploymentMode;
  };

  if (
    !fullName ||
    !pan ||
    !dob ||
    monthlySalary === undefined ||
    !employmentMode
  ) {
    return res.status(400).json({
      message:
        'fullName, pan, dob, monthlySalary, employmentMode are required',
    });
  }

  const dobDate = new Date(dob);
  if (isNaN(dobDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date of birth' });
  }

  const bre = runBRE({
    dob: dobDate,
    monthlySalary: Number(monthlySalary),
    pan: pan.toUpperCase(),
    employmentMode,
  });

  if (!bre.passed) {
    return res.status(422).json({
      message: 'Application rejected by Business Rule Engine',
      reasons: bre.reasons,
    });
  }

  const profile = await BorrowerProfile.findOneAndUpdate(
    { user: req.user!.id },
    {
      user: req.user!.id,
      fullName,
      pan: pan.toUpperCase(),
      dob: dobDate,
      monthlySalary: Number(monthlySalary),
      employmentMode,
      breCleared: true,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.json({ profile, bre });
}

export async function uploadSalarySlip(req: AuthedRequest, res: Response) {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const profile = await BorrowerProfile.findOne({ user: req.user!.id });
  if (!profile) {
    return res
      .status(400)
      .json({ message: 'Complete personal details first' });
  }
  profile.salarySlipPath = req.file.filename;
  await profile.save();
  res.json({ profile });
}
