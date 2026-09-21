import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  name: { type: String, default: 'Event Admin' },
  role: { type: String, enum: ['SUPER_ADMIN', 'VERIFIER', 'VIEWER'], default: 'SUPER_ADMIN' }
}, { timestamps: true });

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
