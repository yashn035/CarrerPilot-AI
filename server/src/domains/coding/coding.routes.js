import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.js';
import {
  handleGetProblems,
  handleGetProblemById,
  handleGetApproaches,
  handleGetDailyPrescription,
  handleReplaceDaily,
  handleSubmitSolution,
  handleGetHistory,
  handleSaveFollowUps
} from './controller/coding.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/', handleGetProblems);
router.get('/daily', handleGetDailyPrescription);
router.post('/daily/replace', handleReplaceDaily);
router.get('/history', handleGetHistory);

// Frontend-facing submit/followup aliases
router.post('/submit', handleSubmitSolution);
router.post('/submissions/:id/followups', handleSaveFollowUps);

router.get('/:id', handleGetProblemById);
router.get('/:id/approaches', handleGetApproaches);
router.post('/:id/submit', handleSubmitSolution);
router.post('/:id/followups', handleSaveFollowUps);

export default router;
