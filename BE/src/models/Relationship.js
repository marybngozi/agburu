import mongoose from 'mongoose';

const relationshipSchema = new mongoose.Schema({
  lineageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lineage', required: true, index: true },
  type: { type: String, enum: ['parent_child', 'marriage'], required: true, index: true },
  parentPersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', default: null, index: true },
  childPersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', default: null, index: true },
  personIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }],
  childOrder: { type: Number, default: 0 }
}, { timestamps: true });

relationshipSchema.index({ lineageId: 1, parentPersonId: 1, childPersonId: 1 }, { unique: true, partialFilterExpression: { type: 'parent_child' } });

export default mongoose.model('Relationship', relationshipSchema);
