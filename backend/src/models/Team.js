import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
  teamId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  gameId: { type: String, required: true, default: 'game_deception_2026' },
  registrationId: { type: String, required: true, index: true },
  teamSize: { type: Number, required: true, min: 5, max: 6 },
  leaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
}, { timestamps: true });

export default mongoose.models.Team || mongoose.model('Team', TeamSchema);
