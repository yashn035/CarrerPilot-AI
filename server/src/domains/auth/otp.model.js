import mongoose from 'mongoose';

const OTPSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: '5m' } // Auto-delete after 5 mins
});

// Avoid OverwriteModelError in Next.js/dev environments with HMR
export const OTP = mongoose.models.OTP || mongoose.model('OTP', OTPSchema);
