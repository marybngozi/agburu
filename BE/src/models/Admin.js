import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema({
  username: { type: String, trim: true, sparse: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  // lineage_owner: a self-signed-up user (see authController.signup) who can
  // create and manage only the lineage(s) they own (see Lineage.ownerId and
  // requireLineageOwnerOrAdmin) — distinct from platform_admin (full access
  // to everything) and profile_editor (can only propose edits to their own
  // assigned Person record).
  role: { type: String, enum: ['platform_admin', 'profile_editor', 'lineage_owner'], default: 'platform_admin', index: true },
  assignedPersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', default: null, index: true },
  isApproved: { type: Boolean, default: true, index: true },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

// Async pre-save middleware in Mongoose does not use next()
adminSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('Admin', adminSchema);
