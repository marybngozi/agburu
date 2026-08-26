import mongoose from 'mongoose';

const changeRequestSchema = new mongoose.Schema({
  personId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true, index: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
  proposedData: { type: mongoose.Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  reviewedAt: { type: Date, default: null },
  reviewerNote: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('ChangeRequest', changeRequestSchema);
