import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.js';
import {
  handleGetInterviews,
  handleStartInterview,
  handleRespondInterview,
  handleEndInterview
} from './controller/interview.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/', handleGetInterviews);
router.post('/start', handleStartInterview);
router.post('/:id/respond', handleRespondInterview);
router.post('/:id/end', handleEndInterview);

export default router;
