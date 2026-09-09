import mongoose from 'mongoose';

const UserProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  problemId: { type: String, required: true, index: true },
  status: { type: String, enum: ['attempted', 'solved'], required: true },
  lastAttempt: { type: Date, default: Date.now },
  bestRuntimeMs: { type: Number, default: 0 },
  bestMemoryMb: { type: Number, default: 0 }
}, { timestamps: true });

UserProgressSchema.index({ userId: 1, problemId: 1 }, { unique: true });

export const UserProgress = mongoose.models.UserProgress || mongoose.model('UserProgress', UserProgressSchema);
export default UserProgress;
