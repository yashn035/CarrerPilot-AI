import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.js';
import {
  handleStartSession,
  handleChat,
  handleGetHistory,
  handleEndSession,
  handleGetRoadmap,
  handleGetReadiness,
  handleGetMissions,
  handleClaimMission
} from './controller/ai-mentor.controller.js';

const router = Router();

router.use(authenticateToken);

// Modular endpoints
router.post('/start-session', handleStartSession);
router.post('/chat', handleChat);
router.get('/history', handleGetHistory);
router.post('/end-session', handleEndSession);
router.get('/roadmap', handleGetRoadmap);
router.get('/readiness', handleGetReadiness);
router.get('/missions', handleGetMissions);
router.post('/claim-mission', handleClaimMission);

export default router;
