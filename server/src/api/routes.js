import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.js';

// Domain Router Imports
import authRouter from '../domains/auth/auth.routes.js';
import resumeRouter from '../domains/resumes/resume.routes.js';
import codingRouter from '../domains/coding/coding.routes.js';
import interviewRouter from '../domains/interviews/interview.routes.js';
import profileRouter from '../domains/profile/profile.routes.js';
import jobsRouter from '../domains/jobs/jobs.routes.js';
import projectsRouter from '../domains/projects/projects.routes.js';
import adminRouter from '../domains/admin/admin.routes.js';
import dashboardRouter from '../domains/dashboard/dashboard.routes.js';
import aiMentorRouter from '../domains/ai-mentor/ai-mentor.routes.js';
import mockInterviewRouter from '../domains/mock-interview/mock-interview.routes.js';
import assessmentRoutes from '../domains/assessment/assessment.routes.js';

// Coding Controller Imports for OA and Company tracks
import {
  handleStartOa,
  handleSubmitOaProblem,
  handleEndOa,
  handleGetCompanyTracks,
  handleGetCompanyMeta,
  handleGetCompanyQuestions,
  handleGetCompanyAnalytics,
  handleGetCompanyAiGuide
} from '../domains/coding/controller/coding.controller.js';

// Project Controller Imports
import { handleGeneratePortfolio } from '../domains/projects/controller/projects.controller.js';

const router = Router();

// 1. Mount Modular Domain Sub-routers
router.use('/auth', authRouter);
router.use('/resumes', resumeRouter);
router.use('/resume', resumeRouter);
router.use('/coding', codingRouter);
router.use('/interviews', interviewRouter);
router.use('/profile', profileRouter);
router.use('/jobs', jobsRouter);
router.use('/projects', projectsRouter);
router.use('/admin', adminRouter);
router.use('/dashboard', dashboardRouter);
router.use('/ai-mentor', aiMentorRouter);
router.use('/mentor', aiMentorRouter);
router.use('/mock-interview', mockInterviewRouter);
router.use('/assessment', assessmentRoutes);

// 2. Mount OA (Online Assessment) Simulator paths
const oaRouter = Router();
oaRouter.use(authenticateToken);
oaRouter.post('/start', handleStartOa);
oaRouter.post('/submit', handleSubmitOaProblem);
oaRouter.post('/end', handleEndOa);
router.use('/oa', oaRouter);

// 3. Mount Company Tracks Preparation paths
const companyTracksRouter = Router();
companyTracksRouter.use(authenticateToken);
companyTracksRouter.get('/', handleGetCompanyTracks);
companyTracksRouter.get('/:company', handleGetCompanyMeta);
companyTracksRouter.get('/:company/questions', handleGetCompanyQuestions);
companyTracksRouter.get('/:company/analytics', handleGetCompanyAnalytics);
companyTracksRouter.get('/:company/ai-guide', handleGetCompanyAiGuide);
router.use('/company-tracks', companyTracksRouter);

// 4. Mount Legacy Portfolio Generation path
router.post('/portfolio/generate', authenticateToken, handleGeneratePortfolio);

export default router;
