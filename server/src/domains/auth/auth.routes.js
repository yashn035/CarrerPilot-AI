import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { handleRegister, handleLogin, handleVerifyOTP, handleOnboarding } from './controller/auth.controller.js';
import { authenticateToken } from '../../middlewares/auth.js';
import { rateLimiter } from '../../middlewares/rateLimiter.js';

const router = Router();

// Rate limit logins/registrations to prevent brute force (e.g. 15 requests per 15 minutes)
const authRateLimiter = rateLimiter(15, 15 * 60 * 1000);

router.post('/register', authRateLimiter, handleRegister);
router.post('/login', authRateLimiter, handleLogin);
router.post('/verify-otp', authRateLimiter, handleVerifyOTP);
router.post('/onboarding', authenticateToken, handleOnboarding);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
  const SECRET_KEY = process.env.JWT_SECRET || "careerpilot-super-secret-key-123456";
  const token = jwt.sign({ id: req.user.id }, SECRET_KEY, { expiresIn: '7d' });
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontendUrl}?token=${token}`);
});

export default router;
