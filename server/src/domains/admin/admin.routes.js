import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.js';
import {
  handleGetStats,
  handleGetUsers,
  handleAddProblem
} from './controller/admin.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/stats', handleGetStats);
router.get('/users', handleGetUsers);
router.post('/problems', handleAddProblem);

export default router;
