import { Router } from 'express';
import multer from 'multer';
import { createRequire } from 'module';
import { authenticateToken } from '../../../middlewares/auth.js';
import { LLMRouter } from '../../../infrastructure/ai/llm.router.js';
import ResumeResult from '../models/ResumeResult.js';
import { generateSummaryAI, polishBulletAI } from '../services/resume.service.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const router = Router();
router.use(authenticateToken);

// Helper for Groq / LLM ATS scoring
async function performATSAnalysis(resumeText, jobDescription, jobTitle = 'Software Engineer') {
  const prompt = `Analyze this resume text against the provided job description and evaluate its Applicant Tracking System (ATS) compatibility.

JOB TITLE: ${jobTitle}
JOB DESCRIPTION:
${jobDescription || 'Standard software engineering role requiring technical proficiency, modern frameworks, clean code, teamwork, and system design.'}

RESUME TEXT:
${resumeText.slice(0, 4000)}

Perform a comprehensive analysis and respond STRICTLY in JSON format without markdown ticks or additional commentary:
{
  "overallScore": 82,
  "breakdown": {
    "formattingScore": 85,
    "keywordScore": 78,
    "contentScore": 84,
    "impactScore": 80
  },
  "foundKeywords": ["React", "JavaScript", "Express", "Node.js", "MongoDB", "Git"],
  "missingKeywords": ["TypeScript", "Docker", "Kubernetes", "AWS", "CI/CD", "Unit Testing"],
  "bulletSuggestions": [
    {
      "original": "Built a website for company",
      "improved": "Engineered high-performance React web app serving 10k+ monthly active users with 99.9% uptime",
      "reason": "Quantified scale, impact, and technical stack."
    }
  ],
  "sectionFeedback": {
    "summary": "Clear target statement. Add core metrics or domain expertise.",
    "experience": "Strong action verbs present. Focus on quantifying outcomes with metrics.",
    "skills": "Good technical list. Align skill categories with target job post keywords.",
    "education": "Properly formatted with degree and institution."
  }
}`;

  try {
    const aiRes = await LLMRouter.route(prompt, 'fast', false, 'You are a veteran ATS recruiting engine evaluator.');
    const text = aiRes.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error('LLM ATS Analysis failed, falling back to heuristic engine:', err.message);
  }

  // Robust Heuristic Engine Fallback if LLM API is unavailable
  const commonTech = ['React', 'Node.js', 'Express', 'JavaScript', 'Python', 'SQL', 'MongoDB', 'Git', 'AWS', 'Docker', 'REST API', 'CSS', 'HTML', 'TypeScript', 'Agile'];
  const jdUpper = (jobDescription || '').toUpperCase();
  const resUpper = resumeText.toUpperCase();

  const foundKeywords = [];
  const missingKeywords = [];

  commonTech.forEach(tech => {
    if (resUpper.includes(tech.toUpperCase())) {
      foundKeywords.push(tech);
    } else if (jdUpper.includes(tech.toUpperCase())) {
      missingKeywords.push(tech);
    }
  });

  const keywordScore = Math.min(100, Math.max(45, Math.round((foundKeywords.length / (foundKeywords.length + missingKeywords.length || 1)) * 100)));
  const formattingScore = resumeText.length > 500 ? 88 : 65;
  const contentScore = resumeText.includes('•') || resumeText.includes('-') ? 85 : 70;
  const impactScore = /\d+%|\$\d+|\d+k/i.test(resumeText) ? 88 : 68;
  const overallScore = Math.round((formattingScore * 0.2) + (keywordScore * 0.4) + (contentScore * 0.2) + (impactScore * 0.2));

  return {
    overallScore,
    breakdown: { formattingScore, keywordScore, contentScore, impactScore },
    foundKeywords,
    missingKeywords: missingKeywords.length ? missingKeywords : ['Docker', 'TypeScript', 'Kubernetes', 'CI/CD'],
    bulletSuggestions: [
      {
        original: "Worked on frontend features",
        improved: "Engineered responsive React web interfaces improving page load speed by 35%",
        reason: "Added quantified metrics and performance impact."
      }
    ],
    sectionFeedback: {
      summary: "Add specific domain target keywords matching job description.",
      experience: "Include quantified metrics (%, $, scale) for achievements.",
      skills: "Highlight primary backend/frontend frameworks prominently.",
      education: "Format degree and dates clearly."
    }
  };
}

// 1. Analyze PDF or Text Resume for ATS Score
router.post('/analyze-ats', upload.single('resumeFile'), async (req, res, next) => {
  try {
    let resumeText = req.body.resumeText || '';
    const jobDescription = req.body.jobDescription || '';
    const jobTitle = req.body.jobTitle || 'Software Engineer';
    const resumeId = req.body.resumeId || null;

    if (req.file) {
      const parsedPdf = await pdfParse(req.file.buffer);
      resumeText = parsedPdf.text;
    }

    if (!resumeText.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide resume text or upload a valid PDF resume file.'
      });
    }

    const analysis = await performATSAnalysis(resumeText, jobDescription, jobTitle);

    const userId = req.userId || req.user?.id || req.user?._id;
    const savedResult = new ResumeResult({
      userId,
      resumeId: resumeId || undefined,
      jobTitle,
      jobDescription,
      overallScore: analysis.overallScore,
      breakdown: analysis.breakdown,
      foundKeywords: analysis.foundKeywords,
      missingKeywords: analysis.missingKeywords,
      bulletSuggestions: analysis.bulletSuggestions,
      sectionFeedback: analysis.sectionFeedback,
      rawParsedText: resumeText.slice(0, 1000)
    });

    await savedResult.save();

    return res.status(200).json({
      status: 'success',
      data: {
        id: savedResult._id,
        ...analysis,
        rawParsedText: resumeText
      }
    });
  } catch (err) {
    next(err);
  }
});

// 2. Extract Keywords from Job Description
router.post('/extract-keywords', async (req, res, next) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription) {
      return res.status(400).json({ status: 'fail', message: 'Job description is required.' });
    }

    const prompt = `Extract top 15 technical skills, frameworks, tools, and soft skills from this job description:
"${jobDescription}"

Respond ONLY with JSON format:
{
  "technical": ["Skill1", "Skill2"],
  "soft": ["Communication", "Leadership"]
}`;

    let keywords = { technical: [], soft: [] };
    try {
      const aiRes = await LLMRouter.route(prompt, 'fast', false);
      const jsonMatch = (aiRes.text || '').match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        keywords = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      keywords = {
        technical: ["JavaScript", "React", "Node.js", "Express", "REST APIs", "SQL", "Git"],
        soft: ["Problem Solving", "Teamwork", "Agile Development"]
      };
    }

    return res.status(200).json({ status: 'success', data: keywords });
  } catch (err) {
    next(err);
  }
});

// 3. Polish / Rewrite Bullet Point
router.post('/polish-bullet', async (req, res, next) => {
  try {
    const { bulletText, targetRole } = req.body;
    if (!bulletText) {
      return res.status(400).json({ status: 'fail', message: 'Bullet text is required.' });
    }

    const result = await polishBulletAI(bulletText, targetRole);
    return res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

// 4. Generate AI Summary
router.post('/generate-summary', async (req, res, next) => {
  try {
    const { personalInfo, targetRole, skills, experience } = req.body;
    const summary = await generateSummaryAI(personalInfo, targetRole, skills, experience);
    return res.status(200).json({ status: 'success', data: { summary } });
  } catch (err) {
    next(err);
  }
});

export default router;
