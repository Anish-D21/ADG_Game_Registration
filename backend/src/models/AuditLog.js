import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  actor: { type: String, required: true },
  action: { type: String, required: true, index: true },
  entity: { type: String, required: true, index: true },
  entityId: { type: String, required: true, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, index: true }
});

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
