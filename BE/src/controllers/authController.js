import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
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
