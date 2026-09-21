import mongoose from 'mongoose';

const GameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
  eventDate: { type: String, required: true },
  endDate: { type: String, required: true },
  venue: { type: String, required: true },
  teamConfig: {
    minPlayers: { type: Number, default: 5 },
    maxPlayers: { type: Number, default: 6 }
  },
  participantConfig: {
    requireCollegeEmail: { type: Boolean, default: true },
    collegeEmailDomain: { type: String, default: '@student.sfit.ac.in' },
    requireCollegeId: { type: Boolean, default: true }
  },
  registrationConfig: {
    allowMultipleTeams: { type: Boolean, default: false },
    registrationOpen: { type: Boolean, default: true },
    amount: { type: Number, default: 500 },
    currency: { type: String, default: 'INR' }
  }
}, { timestamps: true });

export default mongoose.models.Game || mongoose.model('Game', GameSchema);
