import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema({
  registrationId: { type: String, required: true, unique: true, index: true },
  ticketNumber: { type: String, required: true, unique: true, index: true },
  teamName: { type: String, required: true },
  qrData: { type: String, required: true },
  qrCodeUrl: { type: String, default: '' },
  documentUrl: { type: String, default: '' },
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);
