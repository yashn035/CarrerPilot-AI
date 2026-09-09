import Resume from '../models/Resume.js';
import ResumeResult from '../models/ResumeResult.js';
import { LLMRouter } from '../../../infrastructure/ai/llm.router.js';

export async function getUserResumes(userId) {
  return await Resume.find({ userId }).sort({ updatedAt: -1 });
}

export async function getResumeById(resumeId, userId) {
  const resume = await Resume.findOne({ _id: resumeId, userId });
  if (!resume) {
    throw new Error('Resume not found');
  }
  return resume;
}

export async function createResume(userId, resumeData) {
  const resume = new Resume({
    ...resumeData,
    userId
  });
  return await resume.save();
}

export async function updateResume(resumeId, userId, resumeData) {
  const resume = await Resume.findOneAndUpdate(
    { _id: resumeId, userId },
    { $set: resumeData },
    { new: true, runValidators: true }
  );
  if (!resume) {
    throw new Error('Resume not found or unauthorized');
  }
  return resume;
}

export async function deleteResume(resumeId, userId) {
  const result = await Resume.deleteOne({ _id: resumeId, userId });
  if (result.deletedCount === 0) {
    throw new Error('Resume not found or unauthorized');
  }
  return { success: true, message: 'Resume deleted successfully' };
}

export async function duplicateResume(resumeId, userId) {
  const existing = await Resume.findOne({ _id: resumeId, userId });
  if (!existing) {
    throw new Error('Resume not found');
  }

  const plainData = existing.toObject();
  delete plainData._id;
  delete plainData.createdAt;
  delete plainData.updatedAt;

  const duplicated = new Resume({
    ...plainData,
    userId,
    title: `${plainData.title} (Copy)`
  });

  return await duplicated.save();
}

export async function generateSummaryAI(personalInfo, targetRole, skills, experience) {
  const prompt = `Generate a compelling, high-impact professional summary (3-4 sentences) for a resume.
Target Role: ${targetRole || 'Software Engineer'}
Full Name: ${personalInfo?.fullName || 'Candidate'}
Top Skills: ${Array.isArray(skills?.technical) ? skills.technical.join(', ') : ''}
Key Experience: ${Array.isArray(experience) ? experience.map(e => `${e.position} at ${e.company}`).join('; ') : ''}

Respond ONLY with the JSON format:
{
  "summary": "The generated professional summary text..."
}`;

  try {
    const aiResponse = await LLMRouter.route(prompt, 'fast', false, 'You are an expert resume writer and career coach.');
    const text = aiResponse.text || '';
    
    // Parse JSON from text if possible
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.summary) return parsed.summary;
    }
    return text.trim();
  } catch (error) {
    console.error('Error generating summary via AI:', error);
    return `Results-driven ${targetRole || 'Professional'} with hands-on expertise in building scalable applications, driving software optimizations, and collaborating in agile environments. Dedicated to continuous learning and delivering clean, efficient solution architecture.`;
  }
}

export async function polishBulletAI(bulletText, targetRole = 'Software Engineer') {
  const prompt = `Rewrite and polish this resume achievement bullet point using strong action verbs and quantified impact framework (X-Y-Z formula: Accomplished X, measured by Y, by doing Z).
Target Role: ${targetRole}
Original Bullet: "${bulletText}"

Respond ONLY with JSON format:
{
  "improved": "Polished high-impact bullet text",
  "reason": "Short reason why this rewrite is stronger"
}`;

  try {
    const aiResponse = await LLMRouter.route(prompt, 'fast', false, 'You are an ATS resume optimization assistant.');
    const text = aiResponse.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return {
      improved: `Engineered and optimized core functional modules, resulting in a 25% improvement in efficiency and performance.`,
      reason: "Added action verb and quantified outcome metrics."
    };
  } catch (error) {
    console.error('Error polishing bullet via AI:', error);
    return {
      improved: bulletText.startsWith('•') ? bulletText : `• ${bulletText}`,
      reason: "Maintained original text format."
    };
  }
}
