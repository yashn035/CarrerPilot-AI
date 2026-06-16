import { Router } from 'express';
import { handleRegister, handleLogin, handleOnboarding } from './controller/auth.controller.js';
import { authenticateToken } from '../../middlewares/auth.js';
import { rateLimiter } from '../../middlewares/rateLimiter.js';

const router = Router();

// Rate limit logins/registrations to prevent brute force (e.g. 15 requests per 15 minutes)
const authRateLimiter = rateLimiter(15, 15 * 60 * 1000);

router.post('/register', authRateLimiter, handleRegister);
router.post('/login', authRateLimiter, handleLogin);
router.post('/onboarding', authenticateToken, handleOnboarding);

export default router;
