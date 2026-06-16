import { getDb, saveDb } from '../../../infrastructure/db/mongo.js';
import { awardXp } from '../../../shared/services/xp.service.js';
import { updateUserState } from '../../../shared/state/user.state.js';
import { generateNextQuestion } from './question.generator.service.js';
import { evaluateAnswer } from './evaluation.service.js';
import { compileFinalScoreReport } from './scoring.engine.js';
import eventBus from '../../../shared/events/eventBus.js';
import logger from '../../../shared/logger/logger.js';

/**
 * Initializes a new mock interview session based on user resume profile.
 */
export async function startInterview(userId, profileId, { type, difficulty, company }) {
  const db = await getDb();
  if (!db.interviewSessions) db.interviewSessions = [];
  if (!db.userProfiles) db.userProfiles = [];

  // Fetch parsed user profile
  let profile = db.userProfiles.find(p => p.userId === userId);
  if (!profile && profileId) {
    profile = db.userProfiles.find(p => p.id === profileId);
  }

  // Fallback profile if none exists
  if (!profile) {
    profile = {
      userId,
      name: "Candidate Profile",
      skills: ["JavaScript", "Node.js", "React"],
      projects: ["Task Dashboard"],
      experience: ["Software Intern"],
      strengths: ["Clean Code"],
      weak_areas: ["System Design Scale"]
    };
  }

  const session = {
    id: "intsess-" + Math.random().toString(36).substring(2, 11),
    userId,
    profileId: profile.id || "default",
    type: type || "Technical",
    difficulty: difficulty || "Medium",
    company: company || "FAANG Group",
    status: "active",
    startedAt: new Date().toISOString(),
    history: [], // Interview Q&A log
    evaluatedAnswers: [], // Answers with grades
    createdAt: new Date().toISOString()
  };

  // Generate opening question
  const nextQ = await generateNextQuestion(session, profile);
  
  session.history.push({
    role: "interviewer",
    content: nextQ.question,
    intro: nextQ.intro,
    hint: nextQ.hint,
    timestamp: new Date().toISOString()
  });

  db.interviewSessions.push(session);
  await saveDb(db);

  return {
    sessionId: session.id,
    intro: nextQ.intro,
    question: nextQ.question,
    hint: nextQ.hint,
    progress: 0
  };
}

/**
 * Submits the candidate's answer and evaluates it, then generates next question.
 */
export async function submitAnswer(userId, sessionId, answer) {
  const db = await getDb();
  if (!db.interviewSessions) db.interviewSessions = [];
  if (!db.userProfiles) db.userProfiles = [];

  const session = db.interviewSessions.find(s => s.id === sessionId && s.userId === userId);
  if (!session) throw new Error("Interview session not found");
  if (session.status !== "active") throw new Error("Interview already finished");

  // Get current active question (last interviewer turn)
  const lastInterviewerTurn = [...session.history].reverse().find(t => t.role === 'interviewer');
  if (!lastInterviewerTurn) throw new Error("No active question found in history");

  // 1. Evaluate answer
  const evaluation = await evaluateAnswer(lastInterviewerTurn.content, answer);

  // 2. Log turns
  session.history.push({
    role: "candidate",
    content: answer,
    timestamp: new Date().toISOString()
  });

  session.evaluatedAnswers.push({
    question: lastInterviewerTurn.content,
    answer,
    score: evaluation.score,
    feedback: evaluation.feedback,
    correctness: evaluation.correctness,
    timestamp: new Date().toISOString()
  });

  const answersCount = session.evaluatedAnswers.length;
  const maxTurns = 4; // Complete interview length

  if (answersCount >= maxTurns) {
    // End interview session
    session.status = "completed";
    await saveDb(db);
    return {
      finished: true,
      progress: 100,
      evaluation
    };
  }

  // 3. Generate next question
  const profile = db.userProfiles.find(p => p.userId === userId) || {};
  const nextQ = await generateNextQuestion(session, profile);

  session.history.push({
    role: "interviewer",
    content: nextQ.question,
    intro: nextQ.intro,
    hint: nextQ.hint,
    timestamp: new Date().toISOString()
  });

  await saveDb(db);

  return {
    finished: false,
    intro: nextQ.intro,
    question: nextQ.question,
    hint: nextQ.hint,
    progress: Math.round((answersCount / maxTurns) * 100),
    evaluation
  };
}

/**
 * Ends session and compiles final report
 */
export async function endInterview(userId, sessionId) {
  const db = await getDb();
  if (!db.interviewSessions) db.interviewSessions = [];
  if (!db.interviewResults) db.interviewResults = [];

  const session = db.interviewSessions.find(s => s.id === sessionId && s.userId === userId);
  if (!session) throw new Error("Interview session not found");

  session.status = "completed";
  session.endedAt = new Date().toISOString();

  // Compile final scorecard report
  const report = await compileFinalScoreReport(session.history, session.evaluatedAnswers);

  const resultRecord = {
    id: "result-" + Math.random().toString(36).substring(2, 11),
    sessionId,
    userId,
    overallScore: report.overallScore,
    communicationScore: report.communicationScore,
    technicalScore: report.technicalScore,
    problemSolvingScore: report.problemSolvingScore,
    confidenceScore: report.confidenceScore,
    strengths: report.strengths,
    weaknesses: report.weaknesses,
    detailedFeedback: report.detailedFeedback,
    finalRecommendation: report.finalRecommendation,
    createdAt: new Date().toISOString()
  };

  db.interviewResults.push(resultRecord);

  // Gamification: claim mock-interview quest
  let leveledUp = false;
  const user = db.users.find(u => u.id === userId);
  if (user) {
    const questCompleted = user.completedQuests.includes("mock-interview");
    if (!questCompleted) {
      user.completedQuests.push("mock-interview");
      const quest = db.quests.find(q => q.id === "mock-interview");
      if (quest) {
        const reward = await awardXp(userId, quest.xp, `Completed Quest: ${quest.title}`, db);
        leveledUp = reward?.leveledUp || false;
      }
    }

    // Award bonus participation points
    const rewardBonus = await awardXp(userId, 50, "Resume Mock Interview Loop Completion", db);
    leveledUp = leveledUp || (rewardBonus?.leveledUp || false);

    // Sync state
    await updateUserState(userId, {
      xp: user.xp,
      level: user.level,
      scores: {
        interview: report.overallScore,
        communication: report.communicationScore
      }
    });
  }

  await saveDb(db);

  // Broadcast event
  eventBus.emit('interview_completed', {
    userId,
    interviewId: sessionId,
    score: report.overallScore,
    company: session.company
  });

  return {
    report,
    leveledUp
  };
}

/**
 * Retrieves interview session details.
 */
export async function getSessionStatus(userId, sessionId) {
  const db = await getDb();
  if (!db.interviewSessions) db.interviewSessions = [];
  
  const session = db.interviewSessions.find(s => s.id === sessionId && s.userId === userId);
  if (!session) throw new Error("Session not found");
  
  return {
    sessionId: session.id,
    type: session.type,
    difficulty: session.difficulty,
    company: session.company,
    status: session.status,
    turnsCount: session.evaluatedAnswers.length,
    history: session.history
  };
}

/**
 * Retrieves compiled interview result scorecard.
 */
export async function getSessionResult(userId, sessionId) {
  const db = await getDb();
  if (!db.interviewResults) db.interviewResults = [];
  
  const result = db.interviewResults.find(r => r.sessionId === sessionId && r.userId === userId);
  if (!result) throw new Error("Result scorecard not available for this session");
  
  return result;
}
