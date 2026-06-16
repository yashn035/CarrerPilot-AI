import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.js';
import {
  handleGetProfile,
  handleClaimQuest,
  handleMentorChat
} from './controller/profile.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/', handleGetProfile);
router.post('/claim-quest', handleClaimQuest);
router.post('/mentor-chat', handleMentorChat);

export default router;
