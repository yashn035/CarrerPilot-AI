import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.js';
import { 
  handleGetResumes, 
  handleCreateResume, 
  handleUpdateResume, 
  handleRewriteBullet, 
  handleOptimizeJob, 
  handleAnalyzeResume, 
  handleGetReport,
  handleGetResumeById,
  handleAnalyzeAtsGlobal,
  handleRewriteBulletGlobal,
  handleOptimizeJobGlobal,
  handleExportPdfGlobal,
  handleExportDocxGlobal,
  handleExportJsonGlobal,
  handleUploadAndAnalyzeResume
} from './controller/resume.controller.js';

const router = Router();

router.use(authenticateToken);

// Legacy/Compat endpoints
router.get('/', handleGetResumes);
router.post('/', handleCreateResume);
router.put('/:id', handleUpdateResume);
router.post('/:id/rewrite-bullet', handleRewriteBullet);
router.post('/:id/optimize-job', handleOptimizeJob);
router.post('/:id/analyze', handleAnalyzeResume);
router.get('/:id/report', handleGetReport);

// Enterprise endpoints
router.post('/create', handleCreateResume);
router.get('/:id', handleGetResumeById);
router.put('/:id/update', handleUpdateResume);
router.post('/analyze-ats', handleAnalyzeAtsGlobal);
router.post('/rewrite-bullet', handleRewriteBulletGlobal);
router.post('/match-job', handleOptimizeJobGlobal);
router.post('/export/pdf', handleExportPdfGlobal);
router.post('/export/docx', handleExportDocxGlobal);
router.post('/export/json', handleExportJsonGlobal);
router.post('/upload-and-analyze', handleUploadAndAnalyzeResume);

export default router;
