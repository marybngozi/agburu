import crypto from 'crypto';
import Admin from '../models/Admin.js';
import AuditLog from '../models/AuditLog.js';
import ChangeRequest from '../models/ChangeRequest.js';
import Person from '../models/Person.js';

const generatedPassword = () => crypto.randomBytes(12).toString('base64url');

export const createProfileEditor = async (req, res) => {
  try {
    const { username, email, personId } = req.body;
    if (!username || !email || !personId) return res.status(400).json({ message: 'Username, email, and person are required' });
    const person = await Person.findById(personId);
    if (!person) return res.status(404).json({ message: 'Person not found' });
    const password = generatedPassword();
    const user = await Admin.create({ username, email, password, role: 'profile_editor', assignedPersonId: personId, isApproved: true });
    await AuditLog.create({ actorId: req.user._id, action: 'editor.created', entityType: 'Admin', entityId: user._id, metadata: { personId } });
    res.status(201).json({ id: user._id, username: user.username, email: user.email, password });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({ message: error.code === 11000 ? 'Username or email is already in use' : error.message });
  }
};

export const regeneratePassword = async (req, res) => {
  const user = await Admin.findById(req.params.id);
  if (!user || user.role !== 'profile_editor') return res.status(404).json({ message: 'Profile editor not found' });
  const password = generatedPassword();
  user.password = password;
  await user.save();
  await AuditLog.create({ actorId: req.user._id, action: 'editor.password_regenerated', entityType: 'Admin', entityId: user._id });
  res.json({ id: user._id, password });
};

export const submitProfileChange = async (req, res) => {
  if (req.user.role !== 'profile_editor' || req.user.assignedPersonId?.toString() !== req.params.personId) {
    return res.status(403).json({ message: 'You can only propose changes to your assigned profile' });
  }
  const allowedFields = ['title', 'titledName', 'name', 'gender', 'birthDate', 'deathDate', 'profilePicture', 'biographySummary', 'detailedBiography', 'milestones'];
  const proposedData = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowedFields.includes(key)));
  if (!Object.keys(proposedData).length) return res.status(400).json({ message: 'No editable profile fields supplied' });
  const change = await ChangeRequest.create({ personId: req.params.personId, submittedBy: req.user._id, proposedData });
  await AuditLog.create({ actorId: req.user._id, action: 'profile_change.submitted', entityType: 'ChangeRequest', entityId: change._id });
  res.status(201).json(change);
};

export const listPendingChanges = async (req, res) => {
  const requests = await ChangeRequest.find({ status: 'pending' }).populate('personId', 'name profilePicture').populate('submittedBy', 'username email').sort({ createdAt: 1 });
  res.json(requests);
};

export const reviewProfileChange = async (req, res) => {
  const { approved, reviewerNote = '' } = req.body;
  const change = await ChangeRequest.findOne({ _id: req.params.id, status: 'pending' });
  if (!change) return res.status(404).json({ message: 'Pending change request not found' });
  if (approved) await Person.findByIdAndUpdate(change.personId, change.proposedData);
  change.status = approved ? 'approved' : 'rejected';
  change.reviewedBy = req.user._id;
  change.reviewedAt = new Date();
  change.reviewerNote = reviewerNote;
  await change.save();
  await AuditLog.create({ actorId: req.user._id, action: `profile_change.${change.status}`, entityType: 'ChangeRequest', entityId: change._id });
  res.json(change);
};
