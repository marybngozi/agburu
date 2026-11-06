import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import Admin from './models/Admin.js';

dotenv.config();
await connectDB();

// Creates the platform admin from ADMIN_EMAIL / ADMIN_PASSWORD if it doesn't
// exist yet. It never deletes anything: this script used to wipe the whole
// Admin collection, which now also holds every self-signed-up lineage owner.
// To rotate the admin's password, run it with --reset-password.
const seed = async () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD first');

  const existing = await Admin.findOne({ email });
  if (!existing) {
    await Admin.create({ email, password, role: 'platform_admin' });
    console.log(`Admin account created: ${email}`);
  } else if (process.argv.includes('--reset-password')) {
    existing.password = password;
    await existing.save();
    console.log(`Admin password reset: ${email}`);
  } else {
    console.log(`Admin ${email} already exists — nothing changed (use --reset-password to change its password).`);
  }
  process.exit();
};

seed();
