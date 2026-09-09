import { OASession } from '../models/OASession.js';
import { getProblemsBank, getDb, saveDb } from '../../../infrastructure/db/mongo.js';
import { executeCode } from './execution.service.js';
import logger from '../../../shared/logger/logger.js';

export async function startOASession(userId, company = 'Google') {
  const problemsBank = await getProblemsBank();
  
  // Pick 3 problems for OA session (1 Easy, 1 Medium, 1 Hard)
  const easy = problemsBank.filter(p => p.difficulty === 'Easy');
  const medium = problemsBank.filter(p => p.difficulty === 'Medium');
  const hard = problemsBank.filter(p => p.difficulty === 'Hard');

  const pickedEasy = easy[Math.floor(Math.random() * easy.length)] || problemsBank[0];
  const pickedMed = medium[Math.floor(Math.random() * medium.length)] || problemsBank[1] || problemsBank[0];
  const pickedHard = hard[Math.floor(Math.random() * hard.length)] || problemsBank[2] || problemsBank[0];

  const selectedProblems = [pickedEasy, pickedMed, pickedHard].map(p => ({
    id: p.id || p.titleSlug,
    title: p.title,
    titleSlug: p.titleSlug,
    difficulty: p.difficulty,
    category: p.category,
    description: p.description,
    examples: p.examples || [],
    constraints: p.constraints || [],
    starterCode: p.starterCode || {},
    testCases: p.testCases || []
  }));

  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 60 minutes session

  const sessionId = `oa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newSession = {
    id: sessionId,
    userId,
    company,
    problems: selectedProblems,
    startTime,
    endTime,
    answers: {},
    warnings: 0,
    score: 0,
    completed: false
  };

  try {
    const mongoSession = new OASession(newSession);
    await mongoSession.save();
  } catch (e) {
    const db = await getDb();
    if (!db.oaSessions) db.oaSessions = [];
    db.oaSessions.push(newSession);
    await saveDb(db);
  }

  return newSession;
}

export async function recordOAWarning(userId, sessionId) {
  let session = null;
  try {
    session = await OASession.findOne({ id: sessionId, userId });
    if (session) {
      session.warnings += 1;
      await session.save();
      return session;
    }
  } catch (e) {}

  const db = await getDb();
  const idx = (db.oaSessions || []).findIndex(s => s.id === sessionId && s.userId === userId);
  if (idx !== -1) {
    db.oaSessions[idx].warnings = (db.oaSessions[idx].warnings || 0) + 1;
    await saveDb(db);
    return db.oaSessions[idx];
  }
  return null;
}

export async function submitOAAnswer(userId, sessionId, problemId, code, language) {
  let session = null;
  try {
    session = await OASession.findOne({ id: sessionId, userId });
    if (session) {
      if (!session.answers) session.answers = {};
      session.answers[problemId] = { code, language, updatedAt: new Date() };
      session.markModified('answers');
      await session.save();
      return session;
    }
  } catch (e) {}

  const db = await getDb();
  const idx = (db.oaSessions || []).findIndex(s => s.id === sessionId && s.userId === userId);
  if (idx !== -1) {
    if (!db.oaSessions[idx].answers) db.oaSessions[idx].answers = {};
    db.oaSessions[idx].answers[problemId] = { code, language, updatedAt: new Date() };
    await saveDb(db);
    return db.oaSessions[idx];
  }
  return null;
}

export async function endOASession(userId, sessionId) {
  let session = null;
  try {
    session = await OASession.findOne({ id: sessionId, userId });
  } catch (e) {}

  if (!session) {
    const db = await getDb();
    session = (db.oaSessions || []).find(s => s.id === sessionId && s.userId === userId);
  }

  if (!session) {
    throw new Error('OA Session not found');
  }

  let totalPassed = 0;
  let totalProblems = session.problems.length;
  const evaluationResults = [];

  for (const prob of session.problems) {
    const probId = prob.id || prob.titleSlug;
    const answer = (session.answers && session.answers[probId]) || {};
    const userCode = answer.code || '';
    const userLang = answer.language || 'javascript';

    if (!userCode.trim()) {
      evaluationResults.push({ problemId: probId, passed: false, score: 0 });
      continue;
    }

    const testCases = prob.testCases && prob.testCases.length > 0 
      ? prob.testCases 
      : [{ input: "test", expectedOutput: "", isHidden: false }];

    const execRes = await executeCode({
      language: userLang,
      code: userCode,
      testCases
    });

    if (execRes.success) totalPassed++;
    evaluationResults.push({
      problemId: probId,
      passed: execRes.success,
      score: execRes.success ? 100 : Math.round((execRes.passedCount / execRes.totalCount) * 100)
    });
  }

  const finalScore = Math.round((totalPassed / totalProblems) * 100);
  const report = {
    passedProblemsCount: totalPassed,
    totalProblemsCount: totalProblems,
    score: finalScore,
    evaluationResults,
    warnings: session.warnings || 0,
    feedback: finalScore >= 66 
      ? 'Great job! You passed the Online Assessment session.' 
      : 'Keep practicing! Review weak areas and retry company tracks.'
  };

  try {
    if (session.save) {
      session.completed = true;
      session.score = finalScore;
      session.report = report;
      await session.save();
    }
  } catch (e) {}

  const db = await getDb();
  const idx = (db.oaSessions || []).findIndex(s => s.id === sessionId);
  if (idx !== -1) {
    db.oaSessions[idx].completed = true;
    db.oaSessions[idx].score = finalScore;
    db.oaSessions[idx].report = report;
    await saveDb(db);
  }

  return { session, report };
}

export default { startOASession, recordOAWarning, submitOAAnswer, endOASession };
