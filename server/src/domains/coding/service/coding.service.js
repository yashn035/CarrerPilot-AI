import { getDb, saveDb } from '../../../infrastructure/db/mongo.js';
import { awardXp } from '../../../shared/services/xp.service.js';
import { updateUserState } from '../../../shared/state/user.state.js';
import { runSandboxCode } from '../../../infrastructure/sandbox/executor.js';
import { getPrompt } from '../../../infrastructure/ai/prompt.engine.js';
import { callAI, parseCleanJson } from '../../../infrastructure/ai/ai.orchestrator.js';
import { generateDailyPrescription } from '../../dashboard/service/dashboard.analytics.js';
import eventBus from '../../../shared/events/eventBus.js';
import codingRepository from '../repository/coding.repository.js';
import logger from '../../../shared/logger/logger.js';

/**
 * Filter problems list from lobby.
 */
export async function getProblems(queryFilters) {
  const problems = await codingRepository.getProblemsList();
  if (problems.length === 0) return [];

  let filtered = problems;
  const { topic, difficulty, company, search } = queryFilters;

  if (topic) filtered = filtered.filter(p => p.category?.toLowerCase() === topic.toLowerCase());
  if (difficulty) filtered = filtered.filter(p => p.difficulty?.toLowerCase() === difficulty.toLowerCase());
  if (company) filtered = filtered.filter(p => Array.isArray(p.companies) && p.companies.some(c => c.toLowerCase() === company.toLowerCase()));
  if (search) filtered = filtered.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()));

  return filtered.map(p => ({
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    category: p.category,
    companies: p.companies || [],
    tags: p.tags || []
  }));
}

/**
 * Get single problem details.
 */
export async function getProblemById(problemId) {
  const problem = await codingRepository.getProblemById(problemId);
  if (!problem) {
    throw new Error('Problem not found');
  }
  return problem;
}

/**
 * Generates conceptual algorithmic approaches.
 */
export async function getProblemApproaches(problemId) {
  const problem = await getProblemById(problemId);
  
  try {
    const systemPrompt = getPrompt('code_approaches', 'v1');
    const aiResponse = await callAI(systemPrompt, `Problem: "${problem.title}"\nDescription:\n${problem.description}`);
    if (aiResponse) {
      return parseCleanJson(aiResponse);
    }
  } catch (err) {
    logger.warn("AI approaches calculation failed, compiling heuristic fallbacks:", { error: err.message });
  }

  // Local Mock Fallback
  if (problem.title.toLowerCase().includes('two sum')) {
    return [
      { name: "Brute Force", timeComplexity: "O(N²)", hint: "Traverse every pair using nested loops." },
      { name: "Two Pointer / Sorted", timeComplexity: "O(N log N)", hint: "Sort elements first, then search from boundaries inwards." },
      { name: "Hash Map Cache", timeComplexity: "O(N)", hint: "Store previously visited elements in a Hash Map for O(1) lookups." }
    ];
  }
  return [
    { name: "Brute Force Iteration", timeComplexity: "O(N²)", hint: "Evaluate all permutations or checks sequentially." },
    { name: "Optimal Hash Mapping", timeComplexity: "O(N)", hint: "Cache coordinates in memory to decrease outer loop passes." },
    { name: "Sorting Preprocess", timeComplexity: "O(N log N)", hint: "Sort boundaries to optimize tracking operations." }
  ];
}

/**
 * Retrieves user daily prescription, integrating with the Dashboard engine.
 */
export async function getDailyPrescriptionFromService(userId) {
  return await generateDailyPrescription(userId);
}

/**
 * Skips and replaces daily problem.
 */
export async function replaceDailyProblem(userId) {
  return await generateDailyPrescription(userId, true);
}

/**
 * Processes a coding submission, grading it via the Sandbox Executor, 
 * retrieving AI post-mortems and follow-up prompts, awarding XP, 
 * and publishing telemetry to the Event Bus.
 */
export async function submitProblemSolution(userId, { problemId, code, language, chosenApproach, blindMode, peeksUsed, timeSpentSeconds }) {
  const problem = await codingRepository.getProblemById(problemId);
  if (!problem) throw new Error("Problem not found");

  const runResult = await runSandboxCode(code, language, problemId, problem.testCases);
  
  let autopsy = null;
  try {
    const systemPrompt = getPrompt('code_autopsy', 'v1', { problemTitle: problem.title, problemDescription: problem.description, success: runResult.success ? "Passed all tests" : "Failed / Runtime Error", errorText: runResult.error || "None" });
    const aiResponse = await callAI(systemPrompt, `Language: ${language}\nCode:\n${code}`);
    if (aiResponse) {
      autopsy = parseCleanJson(aiResponse);
    }
  } catch (err) {
    logger.warn("AI code post-mortem autopsy failed, compiling fallback reviews:", { error: err.message });
  }

  if (!autopsy) {
    autopsy = {
      killedBy: runResult.success ? "Passed all cases." : "Runtime exception errors.",
      direction: "Recheck loops boundaries.",
      complexity: "Complexity runs in O(N).",
      interviewRisk: "Standard bounds check.",
      edgeCases: ["Empty input array", "Null inputs"]
    };
  }

  if (chosenApproach && chosenApproach.toLowerCase().includes('hash')) {
    const codeClean = code.replace(/\s/g, '');
    const usesCache = codeClean.includes('newMap') || codeClean.includes('newSet') || codeClean.includes('{}') || codeClean.includes('[]') || codeClean.includes('dict') || codeClean.includes('{');
    if (!usesCache) {
      autopsy.interviewRisk = "Approach Mismatch! You voted 'Hash Map' but did not utilize key caches. Recruiter will flag lack of implementation alignment.";
    }
  }

  const timeSpent = timeSpentSeconds || 60;
  const recallScore = runResult.success 
    ? Math.max(10, 100 - (peeksUsed * 10) - Math.floor(timeSpent / 15)) 
    : 0;

  const runtimePct = runResult.success ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 45) + 10;
  const memoryPct = runResult.success ? Math.floor(Math.random() * 35) + 60 : Math.floor(Math.random() * 40) + 10;

  let followUpQuestions = [];
  if (runResult.success) {
    try {
      const systemPrompt = getPrompt('follow_up_questions', 'v1', { problemTitle: problem.title, language, code });
      const aiResponse = await callAI(systemPrompt, "");
      if (aiResponse) {
        followUpQuestions = parseCleanJson(aiResponse);
      }
    } catch (err) {
      logger.warn("AI follow-up question generation failed, running local mocks:", { error: err.message });
    }

    if (followUpQuestions.length === 0) {
      followUpQuestions = [
        `Why did you choose this exact coding approach for "${problem.title}"?`,
        `What are the space/time complexity trade-offs of your implementation?`,
        `How would you adapt your logic to handle 1 million inputs concurrently?`
      ];
    }
  }

  const submission = {
    id: "sub-" + Math.random().toString(36).substring(2, 11),
    userId,
    problemId,
    code,
    language,
    success: runResult.success,
    chosenApproach: chosenApproach || "direct",
    blindMode: blindMode || false,
    peeksUsed: peeksUsed || 0,
    timeSpentSeconds: timeSpent,
    recallScore,
    runtimePct,
    memoryPct,
    autopsy,
    followUpQuestions,
    followUpAnswers: [],
    submittedAt: new Date().toISOString()
  };

  await codingRepository.saveSubmission(submission);

  // Gamification & state updates
  const db = await getDb();
  const user = db.users.find(u => u.id === userId);
  let leveledUp = false;
  let xpAwarded = 0;

  if (runResult.success && user) {
    // Check if user solved this problem successfully for the first time
    const previousSubmissions = db.submissions || [];
    const isFirstTime = !previousSubmissions.some(s => s.userId === userId && s.problemId === problemId && s.success && s.id !== submission.id);
    
    if (isFirstTime) {
      const difficultyXp = problem.difficulty === "Easy" ? 10 : problem.difficulty === "Medium" ? 25 : 50;
      const xpReward = await awardXp(userId, difficultyXp, `Solved problem: ${problem.title}`, db);
      leveledUp = xpReward?.leveledUp || false;
      xpAwarded = difficultyXp;

      const codeWarriorDone = user.completedQuests.includes("solve-dsa");
      if (!codeWarriorDone) {
        user.completedQuests.push("solve-dsa");
        const qReward = await awardXp(userId, 200, "Completed Quest: Code Warrior", db);
        leveledUp = leveledUp || qReward?.leveledUp || false;
        xpAwarded += 200;
      }

      await saveDb(db); // Save DB changes before state sync updates

      const nextDsaScore = Math.min((user.scores?.dsa || 0) + 12, 99);
      await updateUserState(userId, {
        xp: user.xp,
        level: user.level,
        scores: { dsa: nextDsaScore }
      });
    }
  }

  // Publish telemetry event to central Event Bus
  eventBus.emit('coding_submitted', {
    userId,
    problemId,
    problemTitle: problem.title,
    language,
    success: runResult.success
  });

  return { runResult, autopsy, recallScore, followUpQuestions, submissionId: submission.id, leveledUp, xpAwarded };
}

/**
 * Gets historical solutions solved by user.
 */
export async function getSolvingHistory(userId) {
  const subs = await codingRepository.getSubmissions(userId);
  return subs
    .filter(s => s.success)
    .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
}

/**
 * Saves responses to follow-up questions.
 */
export async function saveFollowUpAnswers(userId, submissionId, answers) {
  const db = await getDb();
  
  const index = (db.submissions || []).findIndex(s => s.id === submissionId && s.userId === userId);
  if (index === -1) throw new Error("Submission not found");

  db.submissions[index].followUpAnswers = answers || [];
  
  let leveledUp = false;
  const user = db.users.find(u => u.id === userId);
  if (user) {
    const reward = await awardXp(userId, 15, `Answered interview follow-ups for ${submissionId}`, db);
    leveledUp = reward?.leveledUp || false;
    await saveDb(db);
    
    // Sync state
    await updateUserState(userId, { xp: user.xp, level: user.level });
  } else {
    await saveDb(db);
  }

  return { success: true, leveledUp };
}

// ================= ONLINE ASSESSMENTS =================

/**
 * Generates and initializes an Online Assessment (OA) session.
 */
export async function startOaSession(userId) {
  const problems = await codingRepository.getProblemsList();
  
  const easyProbs = problems.filter(p => p.difficulty === 'Easy');
  const mediumProbs = problems.filter(p => p.difficulty === 'Medium');
  const hardProbs = problems.filter(p => p.difficulty === 'Hard');

  const selectedEasy = easyProbs.length > 0 ? easyProbs[Math.floor(Math.random() * easyProbs.length)] : null;
  const selectedMedium = mediumProbs.length > 0 ? mediumProbs[Math.floor(Math.random() * mediumProbs.length)] : null;
  const selectedHard = hardProbs.length > 0 ? hardProbs[Math.floor(Math.random() * hardProbs.length)] : null;

  const sessionProblems = [selectedEasy, selectedMedium, selectedHard].filter(Boolean);

  const session = {
    id: "oa-" + Math.random().toString(36).substring(2, 9),
    userId,
    problems: sessionProblems.map(p => ({
      id: p.id,
      title: p.title,
      difficulty: p.difficulty,
      category: p.category,
      description: p.description,
      examples: p.examples,
      constraints: p.constraints,
      starterCode: p.starterCode
    })),
    startedAt: new Date().toISOString(),
    status: "active",
    submissions: []
  };

  await codingRepository.saveOaSession(session);
  eventBus.emit('oa_started', { userId, sessionId: session.id });

  return session;
}

/**
 * Submits solution during online assessment.
 */
export async function submitOaProblem(userId, { sessionId, problemId, code, language }) {
  const session = await codingRepository.getOaSessionById(userId, sessionId);
  if (!session) throw new Error("OA Session not found");
  if (session.status !== 'active') throw new Error("Assessment is already closed");

  const problem = await codingRepository.getProblemById(problemId);
  if (!problem) throw new Error("Problem not found");

  const runResult = await runSandboxCode(code, language, problemId, problem.testCases);
  
  const existingSub = session.submissions.find(s => s.problemId === problemId);
  if (existingSub) {
    existingSub.code = code;
    existingSub.success = runResult.success;
    existingSub.passedCount = runResult.passedCount;
    existingSub.totalCount = runResult.totalCount;
  } else {
    session.submissions.push({
      problemId,
      code,
      language,
      success: runResult.success,
      passedCount: runResult.passedCount,
      totalCount: runResult.totalCount
    });
  }

  await codingRepository.saveOaSession(session);
  return runResult;
}

/**
 * Finalizes assessment session, computing scores and awarding XP.
 */
export async function endOaSession(userId, sessionId) {
  const session = await codingRepository.getOaSessionById(userId, sessionId);
  if (!session) throw new Error("OA Session not found");

  session.status = "completed";
  session.endedAt = new Date().toISOString();

  let totalPassed = 0;
  let totalTests = 0;
  session.submissions.forEach(sub => {
    totalPassed += sub.passedCount || 0;
    totalTests += sub.totalCount || 0;
  });

  const scorePercentage = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
  session.score = scorePercentage;

  await codingRepository.saveOaSession(session);

  const db = await getDb();
  const user = db.users.find(u => u.id === userId);
  let leveledUp = false;
  
  if (user) {
    const reward = await awardXp(userId, 200, `Completed Online Assessment simulator ${sessionId}`, db);
    leveledUp = reward?.leveledUp || false;
    await saveDb(db);
    
    // Sync state
    await updateUserState(userId, { xp: user.xp, level: user.level });
  }

  eventBus.emit('oa_completed', { userId, sessionId, score: scorePercentage });

  return { session, score: scorePercentage, leveledUp };
}

// ================= COMPANY TRACKS =================

export function getCompanyTracksList() {
  const { companyMeta } = codingRepository.getCompanyTracks();
  return Object.values(companyMeta);
}

export function getCompanyMeta(companyName) {
  const { companyMeta } = codingRepository.getCompanyTracks();
  const meta = companyMeta[companyName];
  if (!meta) throw new Error(`Company "${companyName}" not found.`);
  return meta;
}

export function getCompanyQuestions(companyName, filters) {
  const { companyQuestions } = codingRepository.getCompanyTracks();
  let questions = companyQuestions[companyName];
  if (!questions) throw new Error(`Company "${companyName}" not found.`);

  const { difficulty, topic, search, oaRound } = filters;
  if (difficulty) questions = questions.filter(q => q.difficulty.toLowerCase() === difficulty.toLowerCase());
  if (topic) questions = questions.filter(q => q.topic.toLowerCase() === topic.toLowerCase());
  if (search) questions = questions.filter(q => q.title.toLowerCase().includes(search.toLowerCase()));
  if (oaRound === 'true') questions = questions.filter(q => q.oaRound);

  return questions;
}

export async function getCompanyAnalytics(userId, companyName) {
  const { companyQuestions, companyMeta } = codingRepository.getCompanyTracks();
  const questions = companyQuestions[companyName];
  const meta = companyMeta[companyName];
  if (!questions) throw new Error(`Company "${companyName}" not found.`);

  const subs = await codingRepository.getSubmissions(userId);
  const userSubs = subs.filter(s => s.success);

  const topicStats = {};
  questions.forEach(q => {
    if (!topicStats[q.topic]) topicStats[q.topic] = { total: 0, solved: 0 };
    topicStats[q.topic].total++;
    if (userSubs.some(s => s.problemId && q.title.toLowerCase().includes(s.problemId.toLowerCase()))) {
      topicStats[q.topic].solved++;
    }
  });

  const topicArr = Object.entries(topicStats).map(([t, s]) => ({ topic: t, ...s, pct: Math.round((s.solved/s.total)*100) }));
  const strongest = topicArr.sort((a,b) => b.pct - a.pct)[0]?.topic || meta.primaryTopics[0];
  const weakest = topicArr.sort((a,b) => a.pct - b.pct)[0]?.topic || meta.primaryTopics[meta.primaryTopics.length-1];

  return {
    company: companyName,
    totalQuestions: questions.length,
    solvedQuestions: Math.min(userSubs.length, questions.length),
    progressPct: Math.min(Math.round((userSubs.length / questions.length) * 100), 100),
    companyReadinessPct: Math.min(Math.round((userSubs.length / questions.length) * 100 * 1.2), 100),
    difficultyRatio: meta.difficultyRatio,
    topicDistribution: topicArr,
    strongestTopic: strongest,
    weakestTopic: weakest,
    aiCoachTip: `You are preparing for ${companyName}. Focus on ${meta.primaryTopics.slice(0,3).join(', ')} — these are the highest-frequency topics in their interviews.`
  };
}

export async function getCompanyAiGuide(companyName) {
  const db = await getDb();
  if (!db.companyAiGuides) db.companyAiGuides = {};
  
  if (db.companyAiGuides[companyName]) {
    return db.companyAiGuides[companyName];
  }

  let guideText = null;
  try {
    const systemPrompt = getPrompt('company_guide', 'v1', { company: companyName });
    guideText = await callAI(systemPrompt, `Generate a preparation guide for candidate preparing for ${companyName}.`);
  } catch (err) {
    logger.warn("Failed to generate AI company guide, executing fallback text:", { error: err.message });
  }

  if (guideText) {
    db.companyAiGuides[companyName] = guideText;
    await saveDb(db);
    return guideText;
  }

  const fallbackGuide = `### ${companyName} Preparation Guide
Standard placement pipeline includes an online coding assessment (1-2 medium problems), followed by 2-3 rounds of live technical interviews focusing on system efficiency and coding clarity.`;
  
  return fallbackGuide;
}
