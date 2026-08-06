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
    }
  }
});

export default mongoose.model('Person', personSchema);