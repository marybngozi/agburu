import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import Admin from './models/Admin.js';

dotenv.config();
await connectDB();

const seed = async () => {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  await Admin.deleteMany({});
  await Admin.create({
    email: adminEmail,
    password: adminPassword
  });
  console.log(`Admin Account Created: ${adminEmail} / ${adminPassword}`);
  process.exit();
};

seed();