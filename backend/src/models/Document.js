import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  documentType: { 
    type: String, 
    enum: ['ID_CARD', 'TICKET', 'RECEIPT', 'CONFIRMATION', 'PAYMENT_EVIDENCE'],
    required: true,
    index: true
  },
  referenceId: { type: String, required: true, index: true },
  ownerName: { type: String, default: '' },
  url: { type: String, required: true },
  publicId: { type: String, default: '' },
  mimeType: { type: String, default: 'image/jpeg' },
  sizeBytes: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.Document || mongoose.model('Document', DocumentSchema);
