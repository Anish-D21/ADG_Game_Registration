import mongoose from 'mongoose';
import { RegistrationStatus } from '../../../shared/payment-contract/payment-status.js';

const RegistrationSchema = new mongoose.Schema({
  registrationId: { type: String, required: true, unique: true, index: true },
  gameId: { type: String, required: true, default: 'game_deception_2026' },
  teamId: { type: String, required: true },
  teamName: { type: String, required: true },
  teamSize: { type: Number, required: true, min: 5, max: 6 },
  leaderName: { type: String, required: true },
  contactEmail: { type: String, required: true, index: true },
  contactMobile: { type: String, required: true },
  status: { 
    type: String, 
    enum: Object.values(RegistrationStatus), 
    default: RegistrationStatus.PAYMENT_PENDING,
    index: true 
  },
  paymentId: { type: String, default: '' },
  ticketIssued: { type: Boolean, default: false },
  ticketNumber: { type: String, default: '' },
  notes: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.models.Registration || mongoose.model('Registration', RegistrationSchema);
