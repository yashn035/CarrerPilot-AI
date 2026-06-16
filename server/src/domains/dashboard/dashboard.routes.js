import { Router } from 'express';
import { handleGetStats, handleGetDailyProblem, handleReplaceDailyProblem } from './dashboard.controller.js';
import { authenticateToken } from '../../middlewares/auth.js';

const router = Router();

router.use(authenticateToken);

// Expose dashboard data and AI daily prescription plans
router.get('/stats', handleGetStats);
router.get('/daily', handleGetDailyProblem);
router.post('/daily/replace', handleReplaceDailyProblem);

export default router;
