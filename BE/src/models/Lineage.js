import mongoose from 'mongoose';

const lineageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
  description: { type: String, default: '' },
  visibility: { type: String, enum: ['public', 'private'], default: 'public', index: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  requestedBy: {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true }
  },
  branding: {
    logoUrl: { type: String, default: '' },
    primaryColor: { type: String, default: '#0f172a' }
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  approvedAt: { type: Date, default: null },
  // The signed-up (lineage_owner) account that requested this lineage, if
  // any — null for lineages created before self-signup existed, or by the
  // legacy migration script. Lets a lineage_owner manage only the
  // lineage(s) they themselves created (see requireLineageOwnerOrAdmin),
  // without needing platform_admin access to everything.
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null, index: true }
}, { timestamps: true });

export default mongoose.model('Lineage', lineageSchema);
