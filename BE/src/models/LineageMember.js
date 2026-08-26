import mongoose from 'mongoose';

const lineageMemberSchema = new mongoose.Schema({
  lineageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lineage', required: true, index: true },
  personId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true, index: true },
  modeOfJoining: { type: String, enum: ['birthed', 'married', 'adopted'], default: 'birthed' },
  isRoot: { type: Boolean, default: false, index: true },
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

lineageMemberSchema.index({ lineageId: 1, personId: 1 }, { unique: true });
lineageMemberSchema.index({ lineageId: 1, isRoot: 1 });

export default mongoose.model('LineageMember', lineageMemberSchema);
