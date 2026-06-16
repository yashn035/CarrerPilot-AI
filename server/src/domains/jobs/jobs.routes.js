import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.js';
import {
  handleGetJobs,
  handleGetApplications,
  handleCreateApplication,
  handleUpdateApplication,
  handleDeleteApplication
} from './controller/jobs.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/', handleGetJobs);
router.get('/applications', handleGetApplications);
router.post('/applications', handleCreateApplication);
router.put('/applications/:id', handleUpdateApplication);
router.delete('/applications/:id', handleDeleteApplication);

export default router;
