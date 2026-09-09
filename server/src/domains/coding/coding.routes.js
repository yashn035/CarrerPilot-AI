import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.js';
import {
  handleGetProblems,
  handleGetProblemById,
  handleRunCode,
  handleSubmitSolution,
  handleGetUserProgress,
  handleGetCompanyTracks
} from './controller/coding.controller.js';
import {
  handleStartOa,
  handleSubmitOaAnswer,
  handleRecordWarning,
  handleEndOa
} from './controller/oa.controller.js';

const router = Router();

router.use(authenticateToken);

// Problem Browser & General Coding Arena Endpoints
router.get('/', handleGetProblems);
router.get('/problems', handleGetProblems);
router.get('/progress', handleGetUserProgress);
router.get('/company-tracks', handleGetCompanyTracks);

// OA Simulator Endpoints
router.post('/oa/start', handleStartOa);
router.post('/oa/answer', handleSubmitOaAnswer);
router.post('/oa/warning', handleRecordWarning);
router.post('/oa/end', handleEndOa);

// Code Execution & Single Problem Endpoints
router.post('/submit', handleSubmitSolution);
router.get('/:id', handleGetProblemById);
router.post('/:id/run', handleRunCode);
router.post('/:id/submit', handleSubmitSolution);

export default router;
