import { Schema, model, Document, Types } from 'mongoose';
import { EmploymentMode } from '../types';

export interface IBorrowerProfile extends Document {
  user: Types.ObjectId;
  fullName: string;
  pan: string;
  dob: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  salarySlipPath?: string;
  breCleared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const profileSchema = new Schema<IBorrowerProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    fullName: { type: String, required: true, trim: true },
    pan: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
    },
    dob: { type: Date, required: true },
    monthlySalary: { type: Number, required: true, min: 0 },
    employmentMode: {
      type: String,
      enum: ['salaried', 'self_employed', 'unemployed'],
      required: true,
    },
    salarySlipPath: { type: String },
    breCleared: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const BorrowerProfile = model<IBorrowerProfile>(
  'BorrowerProfile',
  profileSchema
);
