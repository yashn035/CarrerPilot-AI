import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.js';
import {
  handleStartSession,
  handleChat,
  handleGetHistory,
  handleEndSession
} from './controller/ai-mentor.controller.js';

const router = Router();

router.use(authenticateToken);

// Modular endpoints
router.post('/start-session', handleStartSession);
router.post('/chat', handleChat);
router.get('/history', handleGetHistory);
router.post('/end-session', handleEndSession);

export default router;
