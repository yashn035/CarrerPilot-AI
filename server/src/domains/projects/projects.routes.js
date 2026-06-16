import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.js';
import {
  handleGetProjects,
  handleEvaluateRepo,
  handleGeneratePortfolio
} from './controller/projects.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/', handleGetProjects);
router.post('/evaluate', handleEvaluateRepo);
router.post('/portfolio/generate', handleGeneratePortfolio);

export default router;
