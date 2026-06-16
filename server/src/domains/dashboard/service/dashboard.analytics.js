import { getDb, getProblemsBank } from '../../../infrastructure/db/mongo.js';
import { getPrompt } from '../../../infrastructure/ai/prompt.engine.js';
import { callAI, parseCleanJson } from '../../../infrastructure/ai/ai.orchestrator.js';
import logger from '../../../shared/logger/logger.js';

/**
 * Computes general statistics, progress trends, and activity timelines for the dashboard.
 * @param {string} userId 
 * @returns {Promise<Object>} Mapped metrics
 */
export async function compileDashboardStats(userId) {
  const db = await getDb();
  const user = db.users.find(u => u.id === userId);
  
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // Filter history logs
  const submissions = (db.submissions || []).filter(s => s.userId === userId);
  const interviews = (db.interviews || []).filter(i => i.userId === userId && i.status === 'completed');
  const resumes = (db.resumes || []).filter(r => r.userId === userId);
  const applications = (db.jobApplications || []).filter(a => a.userId === userId);
  const projects = (db.projects || []).filter(p => p.userId === userId);
  const notifications = (db.notifications || []).filter(n => n.userId === userId).slice(0, 10);

  // Solved coding counts
  const solvedProblems = new Set(submissions.filter(s => s.success).map(s => s.problemId));

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      xp: user.xp || 0,
      level: user.level || 1,
      streak: user.streak || 1,
      readinessScore: user.readinessScore || 35,
      scores: user.scores || {}
    },
    metrics: {
      codingSolved: solvedProblems.size,
      totalCoding: 250,
      interviewsCount: interviews.length,
      averageInterviewScore: interviews.length > 0
        ? Math.round(interviews.reduce((acc, curr) => acc + (curr.feedback?.overallScore || 0), 0) / interviews.length)
        : user.scores?.interview || 74,
      resumeScore: user.scores?.resume || 85,
      projectsCount: projects.length,
      applicationsCount: applications.length,
      applicationsResponses: applications.filter(a => ['OA', 'Interview', 'Offer'].includes(a.stage)).length
    },
    activityTimeline: notifications
  };
}

/**
 * Generates the AI Daily Plan Prescription task lists and algorithms practice focus.
 * @param {string} userId 
 * @param {boolean} forceRefresh 
 * @returns {Promise<Object>}
 */
export async function generateDailyPrescription(userId, forceRefresh = false) {
  const db = await getDb();
  const user = db.users.find(u => u.id === userId);
  
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // Analyze weakest topic based on profile settings
  let weakestTopic = 'Arrays';
  const scores = user.scores || {};
  if (scores.dsa < 50) {
    weakestTopic = 'Dynamic Programming';
  } else if (scores.interview < 60) {
    weakestTopic = 'Graphs';
  } else if (scores.projects < 70) {
    weakestTopic = 'Trees';
  }

  const streak = user.streak || 1;

  let prescriptionText = null;
  
  try {
    const systemPrompt = getPrompt('daily_prescription', 'v1');
    const userPrompt = `User weakest topic: ${weakestTopic}. Streak: ${streak} days.`;
    
    // Attempt real AI query, caching for efficiency
    const aiResponse = await callAI(systemPrompt, userPrompt, !forceRefresh);
    if (aiResponse) {
      prescriptionText = parseCleanJson(aiResponse);
    }
  } catch (err) {
    logger.warn("Gemini daily prescription generator failed, executing fallback heuristics:", { error: err.message });
  }

  // Heuristic Fallback
  if (!prescriptionText) {
    prescriptionText = {
      topic: weakestTopic,
      reason: `Your ${weakestTopic.toLowerCase()} structures need review. Since you are on a ${streak}-day active streak, this focus will solidify your coding core.`
    };
  }

  // Lookup target problem matching prescription topic
  const problems = await getProblemsBank();
  
  // Find problems matching the prescribed category/topic
  let targetCategory = 'Arrays';
  if (prescriptionText.topic.toLowerCase().includes('string')) targetCategory = 'Strings';
  else if (prescriptionText.topic.toLowerCase().includes('graph')) targetCategory = 'Graphs';
  else if (prescriptionText.topic.toLowerCase().includes('tree')) targetCategory = 'Trees';
  else if (prescriptionText.topic.toLowerCase().includes('dynamic')) targetCategory = 'Dynamic Programming';

  let matchProblem = problems.find(p => p.category?.toLowerCase() === targetCategory.toLowerCase() || p.tags?.some(t => t.toLowerCase() === targetCategory.toLowerCase()));
  
  // Dynamic pick fallback if no exact matches
  if (!matchProblem && problems.length > 0) {
    const randomIdx = Math.floor(Math.random() * problems.length);
    matchProblem = problems[randomIdx];
  }

  return {
    problem: matchProblem || {
      id: "two-sum",
      title: "Two Sum",
      difficulty: "Easy",
      category: "Arrays",
      starterCode: { javascript: "function twoSum(nums, target) {}" },
      testCases: []
    },
    reason: prescriptionText.reason,
    topic: prescriptionText.topic
  };
}

export default {
  compileDashboardStats,
  generateDailyPrescription
};
