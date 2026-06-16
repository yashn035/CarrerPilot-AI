import * as resumeService from '../service/resume.service.js';

export async function handleGetResumes(req, res) {
  try {
    const resumes = await resumeService.getUserResumes(req.userId);
    return res.json(resumes);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleGetResumeById(req, res) {
  const { id } = req.params;
  try {
    const resume = await resumeService.getResumeById(req.userId, id);
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }
    return res.json(resume);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleCreateResume(req, res) {
  try {
    const result = await resumeService.createResume(req.userId, req.body);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleUpdateResume(req, res) {
  const { id } = req.params;
  try {
    const resume = await resumeService.updateResume(req.userId, id, req.body);
    return res.json({ resume });
  } catch (err) {
    const statusCode = err.message === "Resume not found" ? 404 : 500;
    return res.status(statusCode).json({ message: err.message });
  }
}

export async function handleRewriteBullet(req, res) {
  const { bullet } = req.body;
  if (!bullet) {
    return res.status(400).json({ message: "Bullet content is required" });
  }
  try {
    const rewrites = await resumeService.rewriteResumeBullet(req.userId, bullet);
    return res.json(rewrites);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleRewriteBulletGlobal(req, res) {
  return handleRewriteBullet(req, res);
}

export async function handleOptimizeJob(req, res) {
  const { id } = req.params;
  const { jobDescription } = req.body;
  if (!jobDescription) {
    return res.status(400).json({ message: "Job description is required" });
  }
  try {
    const optimization = await resumeService.optimizeResumeForJob(req.userId, id, jobDescription);
    return res.json(optimization);
  } catch (err) {
    const statusCode = err.message === "Resume not found" ? 404 : 500;
    return res.status(statusCode).json({ message: err.message });
  }
}

export async function handleOptimizeJobGlobal(req, res) {
  const { resumeId, jobDescription } = req.body;
  if (!jobDescription) {
    return res.status(400).json({ message: "Job description is required" });
  }
  try {
    let targetResumeId = resumeId;
    if (!targetResumeId) {
      const resumes = await resumeService.getUserResumes(req.userId);
      if (resumes.length === 0) {
        return res.status(400).json({ message: "No resume found. Create one first." });
      }
      targetResumeId = resumes[0].id;
    }
    const optimization = await resumeService.optimizeResumeForJob(req.userId, targetResumeId, jobDescription);
    return res.json(optimization);
  } catch (err) {
    const statusCode = err.message === "Resume not found" ? 404 : 500;
    return res.status(statusCode).json({ message: err.message });
  }
}

export async function handleAnalyzeResume(req, res) {
  const { id } = req.params;
  const { jobDescription } = req.body;
  try {
    const result = await resumeService.analyzeResumeAts(req.userId, id, jobDescription);
    return res.json(result);
  } catch (err) {
    const statusCode = err.message === "Resume not found" ? 404 : 500;
    return res.status(statusCode).json({ message: err.message });
  }
}

export async function handleAnalyzeAtsGlobal(req, res) {
  const { resumeId, jobDescription } = req.body;
  try {
    let targetResumeId = resumeId;
    if (!targetResumeId) {
      const resumes = await resumeService.getUserResumes(req.userId);
      if (resumes.length === 0) {
        return res.status(400).json({ message: "No resume found. Create one first." });
      }
      targetResumeId = resumes[0].id;
    }
    const result = await resumeService.analyzeResumeAts(req.userId, targetResumeId, jobDescription);
    return res.json(result);
  } catch (err) {
    const statusCode = err.message === "Resume not found" ? 404 : 500;
    return res.status(statusCode).json({ message: err.message });
  }
}

export async function handleGetReport(req, res) {
  const { id } = req.params;
  try {
    const report = await resumeService.getAtsReport(req.userId, id);
    return res.json(report);
  } catch (err) {
    const statusCode = err.message === "No report found for this resume. Please analyze first." ? 404 : 500;
    return res.status(statusCode).json({ message: err.message });
  }
}

export async function handleExportPdfGlobal(req, res) {
  const { resumeId } = req.body;
  try {
    let targetResumeId = resumeId;
    if (!targetResumeId) {
      const resumes = await resumeService.getUserResumes(req.userId);
      if (resumes.length === 0) {
        return res.status(400).json({ message: "No resume found to export." });
      }
      targetResumeId = resumes[0].id;
    }
    
    const { buffer, contentType, filename } = await resumeService.exportResume(req.userId, targetResumeId, 'pdf');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleExportDocxGlobal(req, res) {
  const { resumeId } = req.body;
  try {
    let targetResumeId = resumeId;
    if (!targetResumeId) {
      const resumes = await resumeService.getUserResumes(req.userId);
      if (resumes.length === 0) {
        return res.status(400).json({ message: "No resume found to export." });
      }
      targetResumeId = resumes[0].id;
    }
    
    const { buffer, contentType, filename } = await resumeService.exportResume(req.userId, targetResumeId, 'docx');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleExportJsonGlobal(req, res) {
  const { resumeId } = req.body;
  try {
    let targetResumeId = resumeId;
    if (!targetResumeId) {
      const resumes = await resumeService.getUserResumes(req.userId);
      if (resumes.length === 0) {
        return res.status(400).json({ message: "No resume found to export." });
      }
      targetResumeId = resumes[0].id;
    }
    
    const { buffer, contentType, filename } = await resumeService.exportResume(req.userId, targetResumeId, 'json');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleUploadAndAnalyzeResume(req, res) {
  try {
    const { fileData, fileName, mimeType, text, jobDescription } = req.body;
    const result = await resumeService.uploadAndAnalyzeResume(req.userId, {
      fileData,
      fileName,
      mimeType,
      text,
      jobDescription
    });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
