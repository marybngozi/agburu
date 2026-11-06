import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  // Reject non-string input outright (e.g. {"$gt": ""}) so it can never be
  // interpreted as a query operator, and match the lowercase form the model stores.
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  try {
    const admin = await Admin.findOne({ email: email.trim().toLowerCase() });
    if (admin && (await admin.matchPassword(password))) {
      if (!admin.isActive || !admin.isApproved) {
        return res.status(403).json({ message: 'This account is awaiting approval or has been disabled' });
      }
      res.json({
        id: admin._id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
        assignedPersonId: admin.assignedPersonId,
        token: generateToken(admin._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  res.json(req.admin);
};

// Public self-signup. Instant activation (isApproved/isActive both default
// true on the Admin model) — no email verification step for now; add one
// later by flipping isApproved's default and gating loginAdmin on it, which
// it already checks. Always creates a 'lineage_owner' account: the other
// two roles (platform_admin, profile_editor) are only ever created by an
// existing platform_admin (seedAdmin.js / userController.createProfileEditor),
// never through this public route.
export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (![username, email, password].every((value) => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: 'Password must be 8–128 characters' });
    }
    if (username.trim().length > 80 || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return res.status(400).json({ message: 'Please enter a valid name and email address' });
    }
    const admin = await Admin.create({ username: username.trim(), email: email.trim(), password, role: 'lineage_owner' });
    res.status(201).json({
      id: admin._id,
      email: admin.email,
      username: admin.username,
      role: admin.role,
      token: generateToken(admin._id)
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      message: error.code === 11000 ? 'That email or name is already in use' : error.message
    });
  }
};
