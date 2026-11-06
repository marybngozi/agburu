import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  date: { type: String, required: true },
  description: { type: String, required: true }
}, { _id: false });

const personSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  titledName: { type: String, default: '' },
  name: { type: String, required: true, index: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  modeOfJoining: { type: String, enum: ['birthed', 'married', 'adopted'], default: 'birthed' },
  birthDate: { type: String, default: '' },
  deathDate: { type: String, default: null },
  
  profilePicture: { type: String, default: '' },
  biographySummary: { type: String, default: '' },
  detailedBiography: { type: String, default: '' },
  
  // Optional human-readable address (e.g. /profile/basil-umeh). Only a
  // platform_admin can set it; getPersonById accepts either this or the id.
  slug: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
  // The account that created this record. Non-admin accounts may only edit
  // or add to a lineage the people they created — see requirePersonOwnerOrAdmin.
  // null on records that predate self-signup (admin-only to edit).
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null, index: true },

  // Legacy relationship fields. Nothing writes them any more — the
  // Relationship collection is the source of truth, and these are derived
  // from it at read time (see utils/access.js withRelationshipFields).
  parentId: { type: String, default: null, index: true },
  partnerIds: [{ type: String }],
  childrenIds: [{ type: String }],
  
  milestones: [milestoneSchema],
  isDeleted: { type: Boolean, default: false, index: true }
}, { 
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.createdBy;
    }
  }
});

export default mongoose.model('Person', personSchema);