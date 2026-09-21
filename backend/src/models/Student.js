import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  studentId: { type: String, required: true, trim: true, index: true },
  email: { 
    type: String, 
    required: true, 
    trim: true, 
    lowercase: true, 
    index: true 
  },
  mobile: { type: String, required: true, trim: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Other' },
  branch: { type: String, required: true },
  year: { type: String, required: true },
  collegeType: { type: String, enum: ['SFIT', 'NON_SFIT'], default: 'SFIT' },
  isSfit: { type: Boolean, default: true },
  college: { type: String, default: 'SFIT' },
  participantType: { type: String, enum: ['LEADER', 'MEMBER'], default: 'MEMBER' },
  idCardUrl: { type: String, default: '' },
  idCardPublicId: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.models.Student || mongoose.model('Student', StudentSchema);
