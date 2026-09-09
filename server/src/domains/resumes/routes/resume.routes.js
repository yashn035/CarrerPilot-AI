import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/auth.js';
import {
  getUserResumes,
  getResumeById,
  createResume,
  updateResume,
  deleteResume,
  duplicateResume
} from '../services/resume.service.js';
import {
  exportToPdf,
  exportToTxt,
  exportToJson
} from '../services/export.service.js';

const router = Router();

// Protect all resume CRUD routes
router.use(authenticateToken);

const getUserId = (req) => req.userId || req.user?.id || req.user?._id;

// 1. Get all resumes for user
router.get('/', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const resumes = await getUserResumes(userId);
    return res.status(200).json({ status: 'success', data: resumes });
  } catch (err) {
    next(err);
  }
});

// 2. Create a new resume
router.post('/', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const newResume = await createResume(userId, req.body);
    return res.status(201).json({ status: 'success', data: newResume });
  } catch (err) {
    next(err);
  }
});

// 3. Get single resume by ID
router.get('/:id', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const resume = await getResumeById(req.params.id, userId);
    return res.status(200).json({ status: 'success', data: resume });
  } catch (err) {
    next(err);
  }
});

// 4. Update resume by ID
router.put('/:id', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const updated = await updateResume(req.params.id, userId, req.body);
    return res.status(200).json({ status: 'success', data: updated });
  } catch (err) {
    next(err);
  }
});

// 5. Delete resume by ID
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const result = await deleteResume(req.params.id, userId);
    return res.status(200).json({ status: 'success', ...result });
  } catch (err) {
    next(err);
  }
});

// 6. Duplicate resume
router.post('/:id/duplicate', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const duplicated = await duplicateResume(req.params.id, userId);
    return res.status(201).json({ status: 'success', data: duplicated });
  } catch (err) {
    next(err);
  }
});

// 7. Export saved resume to PDF
router.get('/:id/export/pdf', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const resume = await getResumeById(req.params.id, userId);
    const pdfBuffer = await exportToPdf(resume.toObject());

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="${(resume.title || 'Resume').replace(/\s+/g, '_')}.pdf"`);
    return res.end(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

// 8. Export saved resume to TXT
router.get('/:id/export/txt', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const resume = await getResumeById(req.params.id, userId);
    const txtContent = exportToTxt(resume.toObject());

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${(resume.title || 'Resume').replace(/\s+/g, '_')}.txt"`);
    return res.send(txtContent);
  } catch (err) {
    next(err);
  }
});

// 9. Export saved resume to JSON
router.get('/:id/export/json', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const resume = await getResumeById(req.params.id, userId);
    const jsonContent = exportToJson(resume.toObject());

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${(resume.title || 'Resume').replace(/\s+/g, '_')}.json"`);
    return res.send(jsonContent);
  } catch (err) {
    next(err);
  }
});

// 10. Direct Export POST Endpoints (from editor state directly without saving first)
router.post('/export/pdf', async (req, res, next) => {
  try {
    const resumeData = req.body;
    const pdfBuffer = await exportToPdf(resumeData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="${(resumeData.title || 'Resume').replace(/\s+/g, '_')}.pdf"`);
    return res.end(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

router.post('/export/txt', async (req, res, next) => {
  try {
    const resumeData = req.body;
    const txtContent = exportToTxt(resumeData);

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${(resumeData.title || 'Resume').replace(/\s+/g, '_')}.txt"`);
    return res.send(txtContent);
  } catch (err) {
    next(err);
  }
});

router.post('/export/json', async (req, res, next) => {
  try {
    const resumeData = req.body;
    const jsonContent = exportToJson(resumeData);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${(resumeData.title || 'Resume').replace(/\s+/g, '_')}.json"`);
    return res.send(jsonContent);
  } catch (err) {
    next(err);
  }
});

export default router;
