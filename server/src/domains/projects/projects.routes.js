import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.js';
import {
  handleGetProjects,
  handleEvaluateRepo
} from './controller/projects.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/', handleGetProjects);
router.post('/evaluate', handleEvaluateRepo);

export default router;
