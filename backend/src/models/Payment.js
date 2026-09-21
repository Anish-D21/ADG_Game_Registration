import mongoose from 'mongoose';
import { PaymentStatus } from '../../../shared/payment-contract/payment-status.js';

const PaymentSchema = new mongoose.Schema({
  registrationId: { type: String, required: true, index: true },
  paymentId: { type: String, required: true, unique: true, index: true },
  amount: { type: Number, required: true, default: 500 },
  currency: { type: String, default: 'INR' },
  method: { type: String, default: 'UPI' },
  provider: { type: String, default: 'MOCK' },
  providerPaymentId: { type: String, default: '' },
  providerOrderId: { type: String, default: '' },
  transactionReference: { type: String, default: '' },
  status: { 
    type: String, 
    enum: Object.values(PaymentStatus), 
    default: PaymentStatus.NOT_STARTED,
    index: true 
  },
  evidence: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' }
  },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  verifiedAt: { type: Date },
  verifiedBy: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
