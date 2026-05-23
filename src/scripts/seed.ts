import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { User } from '../models/User';
import { Role } from '../types';

const SEED_USERS: { name: string; email: string; password: string; role: Role }[] = [
  { name: 'Admin User', email: 'admin@lms.test', password: 'admin1234', role: 'admin' },
  { name: 'Sales Exec', email: 'sales@lms.test', password: 'sales1234', role: 'sales' },
  { name: 'Sanction Exec', email: 'sanction@lms.test', password: 'sanction1234', role: 'sanction' },
  { name: 'Disbursement Exec', email: 'disbursement@lms.test', password: 'disburse1234', role: 'disbursement' },
  { name: 'Collection Exec', email: 'collection@lms.test', password: 'collect1234', role: 'collection' },
  { name: 'Test Borrower', email: 'borrower@lms.test', password: 'borrow1234', role: 'borrower' },
];

async function run() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';
  await connectDB(MONGO_URI);
  console.log('[seed] connected');

  for (const u of SEED_USERS) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      existing.name = u.name;
      existing.role = u.role;
      existing.password = u.password;
      await existing.save();
      console.log(`[seed] updated ${u.email} (${u.role})`);
    } else {
      await User.create(u);
      console.log(`[seed] created ${u.email} (${u.role})`);
    }
  }

  console.log('\nSeeded accounts (password shown for testing):');
  for (const u of SEED_USERS) {
    console.log(`  ${u.role.padEnd(14)} ${u.email}  /  ${u.password}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
