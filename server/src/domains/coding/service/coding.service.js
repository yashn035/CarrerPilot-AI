import { getDb, saveDb, getProblemsBank } from '../../../infrastructure/db/mongo.js';
import { executeCode } from '../services/execution.service.js';
import { generateAutopsyReport } from '../services/autopsy.service.js';
import { awardXp } from '../../../shared/services/xp.service.js';
import { updateUserState } from '../../../shared/state/user.state.js';
import { COMPANY_TRACKS_PATH } from '../../../infrastructure/db/paths.js';
import fs from 'fs';
import logger from '../../../shared/logger/logger.js';

let _companyTracksData = null;

export function getCompanyTracks() {
  if (!_companyTracksData) {
    try {
      const content = fs.readFileSync(COMPANY_TRACKS_PATH, 'utf8');
      _companyTracksData = JSON.parse(content);
    } catch (e) {
      _companyTracksData = {
        companyMeta: {
          Google: { name: 'Google', totalQuestions: 150, easy: 30, medium: 90, hard: 30 },
          Amazon: { name: 'Amazon', totalQuestions: 180, easy: 40, medium: 100, hard: 40 },
          Meta: { name: 'Meta', totalQuestions: 140, easy: 25, medium: 85, hard: 30 },
          Stripe: { name: 'Stripe', totalQuestions: 90, easy: 15, medium: 55, hard: 20 }
        },
        companyQuestions: {}
      };
    }
  }
  return _companyTracksData;
}

/**
 * Filter problems list for Problem Browser.
 */
export async function getProblems(queryFilters = {}) {
  const problems = await getProblemsBank();
  if (!problems || problems.length === 0) return [];

  let filtered = problems;
  const { topic, difficulty, company, search, tags } = queryFilters;

  if (topic && topic !== 'All') {
    filtered = filtered.filter(p => p.category?.toLowerCase() === topic.toLowerCase());
  }
  if (difficulty && difficulty !== 'All') {
    filtered = filtered.filter(p => p.difficulty?.toLowerCase() === difficulty.toLowerCase());
  }
  if (company && company !== 'All') {
    filtered = filtered.filter(p => Array.isArray(p.companies) && p.companies.some(c => c.toLowerCase() === company.toLowerCase()));
  }
  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(p => p.title?.toLowerCase().includes(q) || p.tags?.some(t => t.toLowerCase().includes(q)));
  }
  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim().toLowerCase());
    if (tagArray.length > 0 && !tagArray.includes('all')) {
      filtered = filtered.filter(p => p.tags && tagArray.every(t => p.tags.some(pt => pt.toLowerCase() === t)));
    }
  }

  return filtered.map(p => ({
    id: p.id || p.titleSlug,
    title: p.title,
    titleSlug: p.titleSlug || p.id,
    difficulty: p.difficulty || 'Medium',
    category: p.category || (p.tags && p.tags[0]) || 'Algorithms',
    acceptance: p.acceptance || 50.0,
    tags: p.tags || []
  }));
}

/**
 * Get single problem details.
 */
export async function getProblemById(problemId) {
  const problems = await getProblemsBank();
  const problem = problems.find(p => (p.id === problemId || p.titleSlug === problemId));
  if (!problem) {
    throw new Error(`Problem with ID "${problemId}" not found`);
  }
  return {
    ...problem,
    id: problem.id || problem.titleSlug
  };
}

/**
 * Run user code against sample test cases.
 */
export async function runCode(userId, problemId, code, language) {
  const problem = await getProblemById(problemId);
  const sampleTestCases = (problem.testCases && problem.testCases.length > 0)
    ? problem.testCases.filter(tc => !tc.isHidden)
    : [{ input: "sample", expectedOutput: "", isHidden: false }];

  const execResult = await executeCode({
    language,
    code,
    testCases: sampleTestCases
  });

  return execResult;
}

/**
 * Submit user code against ALL test cases (public + hidden).
 */
export async function submitCode(userId, problemId, code, language) {
  const problem = await getProblemById(problemId);
  const allTestCases = problem.testCases && problem.testCases.length > 0
    ? problem.testCases
    : [{ input: "full test", expectedOutput: "", isHidden: false }];

  const execResult = await executeCode({
    language,
    code,
    testCases: allTestCases
  });

  const passed = execResult.success;

  // Generate AI Autopsy Report
  const autopsyReport = await generateAutopsyReport({
    problemTitle: problem.title,
    problemDescription: problem.description,
    code,
    language,
    passed
  });

  // Record submission in Datastore / DB
  const submissionRecord = {
    id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
    problemId: problem.id,
    code,
    language,
    passed,
    passedCount: execResult.passedCount,
    totalCount: execResult.totalCount,
    runtimeMs: execResult.runtimeMs,
    memoryMb: execResult.memoryMb,
    error: execResult.error,
    autopsy: autopsyReport,
    createdAt: new Date()
  };

  const db = await getDb();
  if (!db.submissions) db.submissions = [];
  db.submissions.push(submissionRecord);

  // Update User Progress
  if (!db.userProgress) db.userProgress = [];
  const existingProgIdx = db.userProgress.findIndex(p => p.userId === userId && p.problemId === problem.id);
  if (existingProgIdx !== -1) {
    if (passed) db.userProgress[existingProgIdx].status = 'solved';
    db.userProgress[existingProgIdx].lastAttempt = new Date();
    db.userProgress[existingProgIdx].bestRuntimeMs = Math.min(db.userProgress[existingProgIdx].bestRuntimeMs || 9999, execResult.runtimeMs);
  } else {
    db.userProgress.push({
      userId,
      problemId: problem.id,
      status: passed ? 'solved' : 'attempted',
      lastAttempt: new Date(),
      bestRuntimeMs: execResult.runtimeMs,
      bestMemoryMb: execResult.memoryMb
    });
  }

  await saveDb(db);

  // Award XP if solved
  let xpAwarded = 0;
  if (passed) {
    const xpAmount = problem.difficulty === 'Easy' ? 50 : problem.difficulty === 'Medium' ? 100 : 200;
    try {
      await awardXp(userId, xpAmount, `Solved problem: ${problem.title}`);
      xpAwarded = xpAmount;
    } catch (e) {}
  }

  return {
    ...execResult,
    submissionId: submissionRecord.id,
    autopsy: autopsyReport,
    xpAwarded
  };
}

/**
 * Get User Coding Progress Dashboard Analytics
 */
export async function getUserProgressSummary(userId) {
  const db = await getDb();
  const progressList = (db.userProgress || []).filter(p => p.userId === userId);
  const submissionsList = (db.submissions || []).filter(s => s.userId === userId);

  const solvedIds = progressList.filter(p => p.status === 'solved').map(p => p.problemId);
  const attemptedIds = progressList.map(p => p.problemId);

  // Topic breakdown
  const problemsBank = await getProblemsBank();
  const topicStats = {};

  problemsBank.forEach(p => {
    const cat = p.category || 'Algorithms';
    if (!topicStats[cat]) {
      topicStats[cat] = { total: 0, solved: 0, attempted: 0 };
    }
    topicStats[cat].total++;
    if (solvedIds.includes(p.id) || solvedIds.includes(p.titleSlug)) {
      topicStats[cat].solved++;
    }
    if (attemptedIds.includes(p.id) || attemptedIds.includes(p.titleSlug)) {
      topicStats[cat].attempted++;
    }
  });

  // Calculate radar chart data
  const radarData = Object.entries(topicStats).map(([topic, stats]) => ({
    topic,
    accuracy: stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0,
    solved: stats.solved,
    total: stats.total
  })).slice(0, 6);

  // Find weak areas for recommendations
  const weakTopics = radarData.sort((a, b) => a.accuracy - b.accuracy).map(d => d.topic);
  const recommendedProblems = problemsBank.filter(p => 
    weakTopics.includes(p.category) && !solvedIds.includes(p.id)
  ).slice(0, 4).map(p => ({
    id: p.id || p.titleSlug,
    title: p.title,
    difficulty: p.difficulty,
    category: p.category
  }));

  return {
    totalSolved: solvedIds.length,
    totalAttempted: attemptedIds.length,
    totalSubmissions: submissionsList.length,
    streakDays: 5,
    solvedIds,
    attemptedIds,
    radarData,
    recommendedProblems
  };
}

export default {
  getCompanyTracks,
  getProblems,
  getProblemById,
  runCode,
  submitCode,
  getUserProgressSummary
};
