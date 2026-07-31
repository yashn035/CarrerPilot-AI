import { getDb, saveDb, getProblemsBank } from '../../../infrastructure/db/mongo.js';
import { getPrompt } from '../../../infrastructure/ai/prompt.engine.js';
import { callAI, parseCleanJson } from '../../../infrastructure/ai/ai.orchestrator.js';
import { awardXp } from '../../../shared/services/xp.service.js';
import { updateUserState } from '../../../shared/state/user.state.js';
import eventBus from '../../../shared/events/eventBus.js';
import resumeRepository from '../repository/resume.repository.js';
import logger from '../../../shared/logger/logger.js';
import { compileResumeToHtml, compileResumeToDocxXml } from './export.service.js';
import { parseResume } from '../../mock-interview/service/resume.parser.service.js';

// Pre-defined set of active impact verbs for resume audits and fallbacks
const ACTION_VERBS = new Set([
  "engineered", "spearheaded", "optimized", "architected", "implemented", 
  "developed", "designed", "streamlined", "revamped", "modernized", 
  "accelerated", "deployed", "automated", "integrated", "formulated", 
  "constructed", "established", "reduced", "increased", "maximized", 
  "saved", "orchestrated", "collaborated", "pioneered", "mentored", 
  "led", "managed", "delivered", "executed", "created", "built", 
  "authored", "resolved", "improved", "transformed", "restructured", 
  "upgraded", "launched", "conducted", "consolidated", "minimized", 
  "enhanced", "cultivated", "directed", "overhauled", "strengthened", 
  "pushed", "expanded", "achieved", "solved", "compiled", "monitored", 
  "debugged", "tested", "analyzed"
]);

// Helper: Tokenize text into words (removing punctuation and common stopwords)
function tokenize(text) {
  if (!text) return [];
  const words = text.toLowerCase().match(/[a-z0-9+#.]+/g) || [];
  const stopwords = new Set([
    "the", "and", "to", "of", "in", "for", "on", "with", "at", "by", "an", "a", "is", "are", 
    "this", "that", "it", "from", "as", "about", "your", "my", "or", "but", "not", "will", "be",
    "has", "have", "had", "was", "were", "been", "do", "does", "did", "can", "could", "should", "would"
  ]);
  return words.filter(w => !stopwords.has(w) && w.length > 1);
}

// Helper: Calculate cosine similarity between two word arrays
function computeCosineSimilarity(tokensA, tokensB) {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  
  const freqA = {};
  const freqB = {};
  const allTokens = new Set();
  
  tokensA.forEach(t => { freqA[t] = (freqA[t] || 0) + 1; allTokens.add(t); });
  tokensB.forEach(t => { freqB[t] = (freqB[t] || 0) + 1; allTokens.add(t); });
  
  let dotProduct = 0;
  let sumSqA = 0;
  let sumSqB = 0;
  
  allTokens.forEach(t => {
    const valA = freqA[t] || 0;
    const valB = freqB[t] || 0;
    dotProduct += valA * valB;
    sumSqA += valA * valA;
    sumSqB += valB * valB;
  });
  
  if (sumSqA === 0 || sumSqB === 0) return 0;
  return dotProduct / (Math.sqrt(sumSqA) * Math.sqrt(sumSqB));
}

// Helper: Compute mathematical multi-factor ATS Score
export function calculateAtsScoringMetrics(resume, jobDescription = "") {
  const personalInfo = resume.personalInfo || {};
  // 1. Keyword Match (W_kw) - 30% weight
  let keywordMatchScore = 0;
  const resumeTokens = tokenize(
    JSON.stringify({
      skills: resume.skills,
      experience: (resume.experience || []).map(e => `${e.role} ${e.company} ${e.description}`).join(' '),
      projects: (resume.projects || []).map(p => `${p.title} ${p.description} ${p.technologies}`).join(' ')
    })
  );

  const referenceTechKeywords = [
    "javascript", "typescript", "react", "redux", "node.js", "express", "python", 
    "java", "c++", "c#", "go", "rust", "aws", "docker", "kubernetes", "sql", 
    "postgresql", "mongodb", "redis", "git", "github", "ci/cd", "rest", "api", 
    "graphql", "html", "css", "tailwind", "jest", "testing", "algorithms", 
    "microservices", "serverless", "cloud"
  ];

  if (jobDescription) {
    const jdTokens = tokenize(jobDescription);
    const cosineSim = computeCosineSimilarity(resumeTokens, jdTokens);
    keywordMatchScore = Math.min(100, Math.round(cosineSim * 100 * 1.5));
  } else {
    // Grade against standard tech keywords list density
    const matchedRefKeywords = referenceTechKeywords.filter(kw => resumeTokens.includes(kw));
    keywordMatchScore = Math.min(100, Math.round((matchedRefKeywords.length / 10) * 100));
  }

  // 2. Skills Match (W_sk) - 20% weight
  let skillsMatchScore = 0;
  const resumeSkillsLower = (resume.skills || []).map(s => s.toLowerCase());
  
  if (jobDescription) {
    const jdKeywordsMatched = referenceTechKeywords.filter(kw => jobDescription.toLowerCase().includes(kw));
    if (jdKeywordsMatched.length > 0) {
      const intersection = jdKeywordsMatched.filter(kw => resumeSkillsLower.some(s => s.includes(kw) || kw.includes(s)));
      skillsMatchScore = Math.min(100, Math.round((intersection.length / jdKeywordsMatched.length) * 100));
    } else {
      skillsMatchScore = 80; // default high if no tech indicators in JD
    }
  } else {
    skillsMatchScore = Math.min(100, resumeSkillsLower.length * 12.5);
  }

  // 3. Experience Relevance (W_ex) - 20% weight
  let experienceRelevanceScore = 0;
  let totalYears = 0;
  
  (resume.experience || []).forEach(exp => {
    const datesText = exp.date || '';
    const yearsFound = datesText.match(/\b(20\d{2})\b/g);
    if (yearsFound && yearsFound.length >= 2) {
      const start = parseInt(yearsFound[0]);
      const end = parseInt(yearsFound[1]);
      totalYears += Math.max(1, end - start);
    } else if (yearsFound && yearsFound.length === 1) {
      totalYears += 1;
    } else {
      totalYears += 1; // default fallback per experience item
    }
  });

  const durationScore = Math.min(70, totalYears * 15 || 30);
  
  let roleAlignmentScore = 0;
  if (jobDescription) {
    const jdTokens = tokenize(jobDescription);
    const matchedRolesCount = (resume.experience || []).filter(exp => {
      const roleTokens = tokenize(exp.role);
      return roleTokens.some(rt => jdTokens.includes(rt));
    }).length;
    roleAlignmentScore = Math.min(30, matchedRolesCount * 15);
  } else {
    roleAlignmentScore = Math.min(30, (resume.experience || []).length * 10);
  }
  experienceRelevanceScore = durationScore + roleAlignmentScore;

  // 4. Bullet Quality & Metrics (W_bq) - 15% weight
  let bulletQualityScore = 0;
  let totalBullets = 0;
  let bulletsWithActionVerbs = 0;
  let bulletsWithMetrics = 0;

  const allDescriptions = [
    ...(resume.experience || []).map(e => e.description || ''),
    ...(resume.projects || []).map(p => p.description || '')
  ];

  allDescriptions.forEach(desc => {
    const bullets = desc.split('\n').map(b => b.trim()).filter(Boolean);
    bullets.forEach(b => {
      totalBullets++;
      
      // Clean leading listing chars
      const cleanLine = b.replace(/^[^a-zA-Z0-9]+/, '').trim().toLowerCase();
      const firstWord = cleanLine.split(/\s+/)[0];
      
      if (ACTION_VERBS.has(firstWord)) {
        bulletsWithActionVerbs++;
      }
      
      // Detect numerical metrics (percentages, savings, scale counts)
      if (/\d+/.test(cleanLine)) {
        bulletsWithMetrics++;
      }
    });
  });

  if (totalBullets > 0) {
    const actionPercentage = (bulletsWithActionVerbs / totalBullets) * 100;
    const metricPercentage = (bulletsWithMetrics / totalBullets) * 100;
    // 50% action verb, 50% metric density
    bulletQualityScore = Math.round((actionPercentage + metricPercentage) / 2);
  } else {
    bulletQualityScore = 50; // Neutral fallback
  }

  // 5. Formatting Score (W_fm) - 15% weight
  let formattingScore = 100;

  // Deduct for missing sections
  if (!resume.education || resume.education.length === 0) formattingScore -= 10;
  if (!resume.experience || resume.experience.length === 0) formattingScore -= 10;
  if (!resume.skills || resume.skills.length === 0) formattingScore -= 10;

  // Length check (character limit representing page constraint)
  const totalChars = JSON.stringify(resume).length;
  if (totalChars > 4500) {
    formattingScore -= 15; // penalize excessive lengths
  }

  // Deduct for missing essential personal metadata links
  if (!personalInfo.phone) formattingScore -= 5;
  if (!personalInfo.email) formattingScore -= 5;
  if (!personalInfo.linkedin) formattingScore -= 5;

  formattingScore = Math.max(40, formattingScore);

  // Final ATS Score Formula integration
  const finalScore = Math.round(
    (0.30 * keywordMatchScore) +
    (0.20 * skillsMatchScore) +
    (0.20 * experienceRelevanceScore) +
    (0.15 * bulletQualityScore) +
    (0.15 * formattingScore)
  );

  return {
    atsScore: Math.min(100, Math.max(10, finalScore)),
    keywordMatchScore,
    skillsMatchScore,
    experienceRelevanceScore,
    bulletQualityScore,
    formattingScore
  };
}

/**
 * Get all resumes for a specific user.
 */
export async function getUserResumes(userId) {
  return await resumeRepository.getUserResumes(userId);
}

/**
 * Get a specific resume by its ID and user ID.
 */
export async function getResumeById(userId, resumeId) {
  return await resumeRepository.getResumeById(resumeId, userId);
}

/**
 * Creates a new resume entry, awards XP, and updates readiness score.
 */
export async function createResume(userId, resumeData) {
  const newResume = {
    id: resumeData.id || "res-" + Math.random().toString(36).substring(2, 11),
    userId,
    version: 1,
    title: resumeData.title || "My Career Resume",
    layout: resumeData.layout || "chronological",
    template: resumeData.template || "classic",
    updatedAt: new Date().toISOString(),
    personalInfo: resumeData.personalInfo || {},
    education: resumeData.education || [],
    experience: resumeData.experience || [],
    projects: resumeData.projects || [],
    skills: resumeData.skills || [],
    certifications: resumeData.certifications || []
  };

  await resumeRepository.createResume(userId, newResume);

  const db = await getDb();
  const xpReward = await awardXp(userId, 50, "Created a Resume", db);
  await saveDb(db); // Save back standard XP list updates

  // Sync readiness scores using the state engine
  const user = db.users.find(u => u.id === userId);
  if (user) {
    const nextResumeScore = Math.min((user.scores?.resume || 0) + 10, 95);
    await updateUserState(userId, {
      xp: user.xp,
      level: user.level,
      scores: { resume: nextResumeScore }
    });
  }

  eventBus.emit('resume_updated', { userId, resumeId: newResume.id, action: 'created' });

  return { resume: newResume, leveledUp: xpReward?.leveledUp || false };
}

/**
 * Updates an existing resume version.
 */
export async function updateResume(userId, resumeId, resumeData) {
  const existing = await resumeRepository.getResumeById(resumeId, userId);
  if (!existing) {
    throw new Error("Resume not found");
  }

  const updatedResume = {
    ...existing,
    title: resumeData.title || existing.title,
    layout: resumeData.layout || existing.layout,
    template: resumeData.template || existing.template,
    personalInfo: resumeData.personalInfo || existing.personalInfo,
    education: resumeData.education || existing.education,
    experience: resumeData.experience || existing.experience,
    projects: resumeData.projects || existing.projects,
    skills: resumeData.skills || existing.skills,
    certifications: resumeData.certifications || existing.certifications,
    updatedAt: new Date().toISOString(),
    version: existing.version + 1
  };

  await resumeRepository.updateResume(userId, resumeId, updatedResume);
  eventBus.emit('resume_updated', { userId, resumeId, action: 'updated' });
  
  return updatedResume;
}

/**
 * Calls AI rewriter for weaker bullet points with validation checks.
 */
export async function rewriteResumeBullet(userId, bullet) {
  const db = await getDb();
  const user = db.users.find(u => u.id === userId);
  const role = user?.targetRole || "Software Engineer";

  let aiResponse = null;
  try {
    const systemPrompt = `You are a professional resume consultant. Rewrite the user's weak bullet point into 3 strong, metric-driven bullet points for a "${role}" resume. Each option must follow the STAR format (Situation, Task, Action, Result) starting with a strong active verb. Preserve all factual bounds. DO NOT hallucinate fake metrics or percentages unless they exist in the input. Format output strictly as JSON matching: { "option1": "string", "option2": "string", "option3": "string" }.`;
    const userPrompt = `[START_USER_INPUT]${bullet}[END_USER_INPUT]`;
    
    aiResponse = await callAI(systemPrompt, userPrompt);
    if (aiResponse) {
      const parsed = parseCleanJson(aiResponse);
      
      // Fact-preservation layer: Ensure LLM hasn't hallucinated numbers/percentages if they weren't in user's input
      const userNumbers = bullet.match(/\d+/g) || [];
      const hasNumberHallucination = ['option1', 'option2', 'option3'].some(key => {
        const optText = parsed[key] || '';
        const optNumbers = optText.match(/\d+/g) || [];
        return userNumbers.length > 0 && optNumbers.some(n => !userNumbers.includes(n));
      });

      if (!hasNumberHallucination && parsed.option1 && parsed.option2 && parsed.option3) {
        return parsed;
      }
      logger.warn("AI response failed fact validation, trigger heuristic fallback.");
    }
  } catch (err) {
    logger.warn("AI resume bullet rewriter failed, falling back to mock:", { error: err.message });
  }

  // Heuristic Fallback Rule-Based Rewriter
  const verbs = ["Engineered", "Optimized", "Architected", "Spearheaded", "Revamped", "Streamlined"];
  const actionClean = bullet.trim()
    .replace(/^(helped to|worked on|did|built|wrote|created|made|worked in a team to build|collaborated on)\s+/i, '');
  
  const userNumbers = bullet.match(/\b\d+(?:%|\s*percent\b|\s*x\b|\s*million\b|\s*k\b|\b)?\b/i);
  const metric1 = userNumbers ? userNumbers[0] : "a 15% increase in speed";
  const metric2 = userNumbers ? userNumbers[0] : "reducing CPU latency footprints by 22%";
  const metric3 = userNumbers ? userNumbers[0] : "collaborating with 3+ engineers to lower code errors by 18%";

  return {
    option1: `${verbs[0]} a key module for ${actionClean || 'core system components'}, driving ${metric1}.`,
    option2: `${verbs[1]} code pipelines for ${actionClean || 'application features'}, ${metric2}.`,
    option3: `${verbs[3]} the implementation of ${actionClean || 'critical updates'}, ${metric3}.`
  };
}

/**
 * Optimizes resume keywords against target job description and returns gap insights.
 */
export async function optimizeResumeForJob(userId, resumeId, jobDescription) {
  const resume = await resumeRepository.getResumeById(resumeId, userId);
  if (!resume) {
    throw new Error("Resume not found");
  }

  const resumeText = JSON.stringify({
    experience: resume.experience,
    projects: resume.projects,
    skills: resume.skills
  });

  try {
    const systemPrompt = `You are a strict ATS matcher. Compare the resume details against the job description. Delimit inputs. Output ONLY valid JSON: { "missingKeywords": ["string"], "rewrittenBullets": [{ "original": "string", "optimized": "string" }], "explanation": "string" }.`;
    const inputStr = `[START_USER_INPUT]Resume:\n${resumeText}\n\nJob Description:\n${jobDescription}[END_USER_INPUT]`;
    const aiResponse = await callAI(systemPrompt, inputStr);
    if (aiResponse) {
      return parseCleanJson(aiResponse);
    }
  } catch (err) {
    logger.warn("AI job description optimization failed, falling back to mock:", { error: err.message });
  }

  // Local Match Heuristic Fallback
  const missingKeywords = [];
  const referenceTechKeywords = ["typescript", "redux", "docker", "ci/cd", "jest", "unit testing", "graphql", "aws", "react", "node", "express", "sql"];
  
  const resumeTextLower = resumeText.toLowerCase();
  referenceTechKeywords.forEach(kw => {
    if (jobDescription.toLowerCase().includes(kw) && !resumeTextLower.includes(kw)) {
      missingKeywords.push(kw.charAt(0).toUpperCase() + kw.slice(1));
    }
  });

  const rewrittenBullets = [];
  (resume.experience || []).slice(0, 2).forEach(exp => {
    const bullets = (exp.description || '').split('\n').filter(Boolean);
    if (bullets.length > 0) {
      rewrittenBullets.push({
        original: bullets[0],
        optimized: `Optimized and rebuilt core logic for ${bullets[0].replace(/^[^a-zA-Z0-9]+/, '').trim().toLowerCase()}, incorporating modern tech and testing guidelines.`
      });
    }
  });

  return {
    missingKeywords,
    rewrittenBullets,
    explanation: "Extracted missing technical keywords from target description and suggestions mapped into top work items."
  };
}

/**
 * Analyzes resume quality against ATS guidelines, computes dynamic score, and maps gap roadmaps.
 */
export async function analyzeResumeAts(userId, resumeId, jobDescription) {
  const resume = await resumeRepository.getResumeById(resumeId, userId);
  if (!resume) {
    throw new Error("Resume not found");
  }

  // Calculate strict mathematical multi-factor score
  const mathMetrics = calculateAtsScoringMetrics(resume, jobDescription);

  let parsedAi = null;
  try {
    const systemPrompt = getPrompt('resume_analyze', 'v1');
    const inputStr = `[START_USER_INPUT]Resume Content: ${JSON.stringify(resume)}` + (jobDescription ? `\n\nJob Description: ${jobDescription}` : "") + `[END_USER_INPUT]`;
    const aiResponse = await callAI(systemPrompt, inputStr);
    if (aiResponse) {
      parsedAi = parseCleanJson(aiResponse);
    }
  } catch (err) {
    logger.warn("AI ATS scan failed, executing fallback analysis calculator:", { error: err.message });
  }

  // Assemble Grammar Issues and Suggestions
  let grammarIssues = [];
  let suggestions = [];
  let recruiterSimulation = "";
  let missingKeywords = [];

  if (parsedAi) {
    grammarIssues = (parsedAi.grammar_and_phrasing_audits || []).map(audit => ({
      line: audit.original_line || "",
      issue: audit.issue_type || "",
      suggestion: audit.suggested_fix || ""
    }));
    recruiterSimulation = parsedAi.recruiter_review || "";
    missingKeywords = parsedAi.missing_keywords || [];
  } else {
    // Math Fallback Local audits
    const allBullets = [];
    [...(resume.experience || []), ...(resume.projects || [])].forEach(item => {
      const bullets = (item.description || '').split('\n').filter(Boolean);
      bullets.forEach(b => allBullets.push(b.trim()));
    });

    allBullets.forEach(b => {
      const cleanLine = b.replace(/^[^a-zA-Z0-9]+/, '').trim();
      const firstWord = cleanLine.split(/\s+/)[0].toLowerCase();
      if (firstWord && !ACTION_VERBS.has(firstWord)) {
        grammarIssues.push({
          line: b,
          issue: "Weak passive voice starter or weak verb.",
          suggestion: `Engineered ${cleanLine.charAt(0).toLowerCase() + cleanLine.slice(1)}`
        });
      }
    });

    recruiterSimulation = "Clean visual flow, standard headings are legible. Spot checks show strong tech density but lacking metric percentages.";
    
    // Fallback missing keywords
    if (jobDescription) {
      const techList = ["typescript", "redux", "docker", "ci/cd", "jest", "unit testing", "graphql", "aws", "react", "node", "express", "sql"];
      const resumeTextLower = JSON.stringify(resume).toLowerCase();
      techList.forEach(w => {
        if (jobDescription.toLowerCase().includes(w) && !resumeTextLower.includes(w)) {
          missingKeywords.push(w.charAt(0).toUpperCase() + w.slice(1));
        }
      });
    }
  }

  // Priority Checklist Compiler
  suggestions = grammarIssues.map(issue => `In line "${issue.line}": Rewrite using active verb. E.g. "${issue.suggestion}"`);
  if (missingKeywords.length > 0) {
    suggestions.push(`Integrate missing keywords: ${missingKeywords.join(', ')}`);
  }
  if (suggestions.length === 0) {
    suggestions.push("Ensure high action density and rich metric integrations.");
  }

  // Compile Dynamic Missing Skill roadmap from Coding Problems Bank
  const problems = await getProblemsBank();
  const skillGapRoadmap = [];
  
  missingKeywords.slice(0, 3).forEach(skill => {
    // Map missing skills to categorized coding tasks
    let matchedProblem = problems.find(p => 
      p.category?.toLowerCase() === skill.toLowerCase() || 
      p.tags?.some(t => t.toLowerCase() === skill.toLowerCase())
    );
    
    if (matchedProblem) {
      skillGapRoadmap.push({
        skill,
        recommendation: `Solve DSA problem "${matchedProblem.title}" (${matchedProblem.difficulty}) to practice.`,
        problemId: matchedProblem.id
      });
    } else {
      skillGapRoadmap.push({
        skill,
        recommendation: `Build a small implementation project utilizing ${skill} and integrate tests.`
      });
    }
  });

  const grade = mathMetrics.atsScore >= 85 ? "A" : mathMetrics.atsScore >= 70 ? "B" : "C";

  const analysisReport = {
    score: mathMetrics.atsScore,
    grade,
    sections: {
      "Keyword Matching": mathMetrics.keywordMatchScore,
      "Skills Relevance": mathMetrics.skillsMatchScore,
      "Resume Format": mathMetrics.formattingScore,
      "Experience & Projects": mathMetrics.bulletQualityScore,
      "Education & Certifications": mathMetrics.experienceRelevanceScore
    },
    keywords: {
      found: resume.skills ? resume.skills.filter(s => !missingKeywords.includes(s)) : [],
      missing: missingKeywords
    },
    grammarIssues: grammarIssues.slice(0, 5),
    suggestions: suggestions.slice(0, 4),
    recruiterSimulation,
    skillGapRoadmap
  };

  const reportId = "report-" + Math.random().toString(36).substring(2, 11);
  const newReport = {
    id: reportId,
    resumeId,
    userId,
    analyzedAt: new Date().toISOString(),
    ...analysisReport
  };

  await resumeRepository.saveAtsReport(newReport);

  // Gamification sync using user state engine
  const db = await getDb();
  const user = db.users.find(u => u.id === userId);
  let leveledUp = false;

  if (user) {
    const wasQuestClaimed = user.completedQuests.includes("ats-analyzer");
    if (!wasQuestClaimed) {
      user.completedQuests.push("ats-analyzer");
      const quest = db.quests.find(q => q.id === "ats-analyzer");
      const xpReward = await awardXp(userId, quest?.xp || 100, `Completed Quest: ${quest?.title || "ATS Review"}`, db);
      leveledUp = xpReward?.leveledUp || false;
      await saveDb(db);
    }
    
    // Sync to state system
    await updateUserState(userId, {
      xp: user.xp,
      level: user.level,
      scores: { resume: analysisReport.score }
    });
  }

  // Publish to Event Bus
  eventBus.emit('resume_analyzed', {
    userId,
    resumeId,
    score: analysisReport.score,
    grade: analysisReport.grade
  });

  return { report: newReport, leveledUp };
}

/**
 * Gets the ATS report generated for a resume.
 */
export async function getAtsReport(userId, resumeId) {
  const report = await resumeRepository.getAtsReport(userId, resumeId);
  if (!report) {
    throw new Error("No report found for this resume. Please analyze first.");
  }
  return report;
}

/**
 * Exports resume contents into files of specific formats (pdf, docx, json).
 */
export async function exportResume(userId, resumeId, format) {
  const resume = await resumeRepository.getResumeById(resumeId, userId);
  if (!resume) {
    throw new Error("Resume not found");
  }

  const filename = `${(resume.personalInfo?.name || 'Resume').replace(/\s+/g, '_')}_v${resume.version}.${format}`;

  if (format === 'json') {
    return {
      buffer: Buffer.from(JSON.stringify(resume, null, 2)),
      contentType: 'application/json',
      filename
    };
  }

  if (format === 'docx') {
    const docxXml = compileResumeToDocxXml(resume);
    return {
      buffer: Buffer.from(docxXml, 'utf-8'),
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      filename
    };
  }

  if (format === 'pdf') {
    const htmlContent = compileResumeToHtml(resume);
    return {
      buffer: Buffer.from(htmlContent, 'utf-8'),
      contentType: 'application/pdf', // Serve print html buffer wrapped inside PDF content-type
      filename
    };
  }

  throw new Error("Unsupported file format requested.");
}

/**
 * Ingests a raw resume file/text, structures it, runs the ATS scoring checks, and logs results.
 */
export async function uploadAndAnalyzeResume(userId, { fileData, fileName, mimeType, text, jobDescription = "" }) {
  let profile;
  let rawText = text || "";
  
  if (text && text.trim().length > 0) {
    profile = await parseResume(Buffer.from(text, 'utf-8'), 'text/plain');
  } else if (fileData) {
    const buffer = Buffer.from(fileData, 'base64');
    profile = await parseResume(buffer, mimeType || 'application/pdf');
    rawText = `Structured Profile for ${profile.name || 'Candidate'}. Skills: ${profile.skills.join(', ')}`;
  } else {
    throw new Error("No resume content or file uploaded.");
  }

  const tempResume = {
    personalInfo: { name: profile.name || "Candidate Profile" },
    skills: profile.skills || [],
    experience: (profile.experience || []).map(exp => ({
      role: typeof exp === 'string' ? exp : exp.role || '',
      company: typeof exp === 'string' ? '' : exp.company || '',
      description: typeof exp === 'string' ? exp : exp.description || ''
    })),
    projects: (profile.projects || []).map(proj => ({
      title: typeof proj === 'string' ? proj : proj.title || '',
      description: typeof proj === 'string' ? proj : proj.description || '',
      technologies: typeof proj === 'string' ? '' : proj.technologies || ''
    })),
    education: profile.education ? [ { school: profile.education } ] : []
  };

  const mathMetrics = calculateAtsScoringMetrics(tempResume, jobDescription);

  let parsedAi = null;
  try {
    const systemPrompt = getPrompt('resume_analyze', 'v1');
    const inputStr = `[START_USER_INPUT]Resume Content: ${JSON.stringify(tempResume)}` + (jobDescription ? `\n\nJob Description: ${jobDescription}` : "") + `[END_USER_INPUT]`;
    const aiResponse = await callAI(systemPrompt, inputStr);
    if (aiResponse) {
      parsedAi = parseCleanJson(aiResponse);
    }
  } catch (err) {
    logger.warn("AI ATS scan for uploaded file failed, falling back to heuristics.", err);
  }

  let grammarIssues = [];
  let suggestions = [];
  let recruiterSimulation = "";
  let missingKeywords = [];

  if (parsedAi) {
    grammarIssues = (parsedAi.grammar_and_phrasing_audits || []).map(audit => ({
      line: audit.original_line || "",
      issue: audit.issue_type || "",
      suggestion: audit.suggested_fix || ""
    }));
    recruiterSimulation = parsedAi.recruiter_review || "";
    missingKeywords = parsedAi.missing_keywords || [];
  } else {
    recruiterSimulation = "Clean visual flow, standard headings legibly parsed. Try adding numeric impacts to experiences.";
    
    if (jobDescription) {
      const techList = ["typescript", "redux", "docker", "ci/cd", "jest", "unit testing", "graphql", "aws", "react", "node", "express", "sql"];
      const resumeTextLower = JSON.stringify(tempResume).toLowerCase();
      techList.forEach(w => {
        if (jobDescription.toLowerCase().includes(w) && !resumeTextLower.includes(w)) {
          missingKeywords.push(w.charAt(0).toUpperCase() + w.slice(1));
        }
      });
    }
  }

  suggestions = grammarIssues.map(issue => `Audit: "${issue.line}": Rewrite as: "${issue.suggestion}"`);
  if (missingKeywords.length > 0) {
    suggestions.push(`Integrate missing keywords: ${missingKeywords.join(', ')}`);
  }
  if (suggestions.length === 0) {
    suggestions.push("Ensure experience descriptions follow strong metric structures.");
  }

  const resultReport = {
    ats_score: mathMetrics.atsScore,
    keyword_match: tempResume.skills || [],
    missing_keywords: missingKeywords,
    bullet_feedback: suggestions.slice(0, 4),
    format_score: mathMetrics.formattingScore,
    recommendation: recruiterSimulation
  };

  const db = await getDb();
  if (!db.resumeUploads) db.resumeUploads = [];
  
  const uploadRecord = {
    id: "upload-" + Math.random().toString(36).substring(2, 11),
    userId,
    fileName: fileName || "Pasted text",
    extractedText: rawText,
    atsScore: resultReport.ats_score,
    report: resultReport,
    createdAt: new Date().toISOString()
  };
  db.resumeUploads.push(uploadRecord);

  const xpReward = await awardXp(userId, 50, "Uploaded & analyzed resume", db);
  await saveDb(db);

  const user = db.users.find(u => u.id === userId);
  if (user) {
    const nextScore = Math.max(user.scores?.resume || 0, resultReport.ats_score);
    await updateUserState(userId, {
      xp: user.xp,
      level: user.level,
      scores: { resume: nextScore }
    });
  }

  eventBus.emit('resume_analyzed', {
    userId,
    resumeId: uploadRecord.id,
    score: resultReport.ats_score,
    grade: resultReport.ats_score >= 85 ? "A" : resultReport.ats_score >= 70 ? "B" : "C"
  });

  return {
    report: resultReport,
    leveledUp: xpReward?.leveledUp || false
  };
}

export default {
  getUserResumes,
  getResumeById,
  createResume,
  updateResume,
  rewriteResumeBullet,
  optimizeResumeForJob,
  analyzeResumeAts,
  getAtsReport,
  exportResume,
  uploadAndAnalyzeResume
};
