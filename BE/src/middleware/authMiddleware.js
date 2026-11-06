import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import Lineage from '../models/Lineage.js';
import Person from '../models/Person.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = await Admin.findById(decoded.id).select('-password');
      if (!req.admin || !req.admin.isActive || !req.admin.isApproved) {
        return res.status(401).json({ message: 'Account is not active' });
      }
      req.user = req.admin;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const optionalProtect = async (req, res, next) => {
  if (!req.headers.authorization?.startsWith('Bearer ')) return next();
  return protect(req, res, next);
};

export const requirePlatformAdmin = (req, res, next) => {
  if (req.user?.role !== 'platform_admin') {
    return res.status(403).json({ message: 'Platform administrator access required' });
  }
  next();
};

// Lets a request through if the authenticated user is either a
// platform_admin (full access to every lineage, same as requirePlatformAdmin)
// or the lineage_owner who requested the lineage named by the route's
// :lineageId param. Every route this guards shares that param name
// (lineageRoutes.js), so it's read generically here rather than per-route.
// Attaches the fetched Lineage doc as req.lineage so handlers that already
// need it (none currently do, but future ones might) don't have to refetch.
export const requireLineageOwnerOrAdmin = async (req, res, next) => {
  if (req.user?.role === 'platform_admin') return next();
  try {
    if (!mongoose.isValidObjectId(req.params.lineageId)) return res.status(404).json({ message: 'Lineage not found' });
    const lineage = await Lineage.findById(req.params.lineageId);
    if (!lineage) return res.status(404).json({ message: 'Lineage not found' });
    if (req.user?.role === 'lineage_owner' && lineage.ownerId?.toString() === req.user._id.toString()) {
      req.lineage = lineage;
      return next();
    }
    return res.status(403).json({ message: 'You do not have access to manage this lineage' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Roles that may create and manage lineage content (platform_admin, and
// lineage_owner within their own lineages). profile_editor is deliberately
// excluded — it can only propose edits via change requests.
export const requireContentManager = (req, res, next) => {
  if (['platform_admin', 'lineage_owner'].includes(req.user?.role)) return next();
  return res.status(403).json({ message: 'You do not have permission to manage content' });
};

// A lineage_owner may edit or soft-delete a Person only if they created it.
// (Membership in a lineage they own is NOT enough: that was the old rule, and
// it let someone add another family's person to their own lineage and then
// edit it. Adding to a lineage is now creator-only too — see addLineageMember.)
// platform_admin can edit anyone.
export const requirePersonOwnerOrAdmin = async (req, res, next) => {
  if (req.user?.role === 'platform_admin') return next();
  if (req.user?.role !== 'lineage_owner') {
    return res.status(403).json({ message: 'You do not have access to this profile' });
  }
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Member not found' });
    const owned = await Person.exists({ _id: req.params.id, createdBy: req.user._id });
    if (owned) return next();
    return res.status(403).json({ message: 'You can only edit people you created' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
