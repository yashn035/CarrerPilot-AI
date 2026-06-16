import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.js';
import {
  handleUploadResume,
  handleStartInterview,
  handleSubmitAnswer,
  handleGetStatus,
  handleEndInterview,
  handleGetResult
} from './controller/mock-interview.controller.js';

const router = Router();

router.use(authenticateToken);

// Resume upload & parsing
router.post('/resume/upload', handleUploadResume);

// Interview session control
router.post('/interview/start', handleStartInterview);
router.post('/interview/answer', handleSubmitAnswer);
router.get('/interview/status', handleGetStatus);
router.post('/interview/end', handleEndInterview);
router.get('/interview/result', handleGetResult);

export default router;
