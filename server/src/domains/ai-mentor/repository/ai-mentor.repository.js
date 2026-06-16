import { getDb, saveDb } from '../../../infrastructure/db/mongo.js';

export async function getUserSessions(userId) {
  const db = await getDb();
  if (!db.aiMentorSessions) db.aiMentorSessions = [];
  return db.aiMentorSessions.filter(s => s.userId === userId);
}

export async function getSessionById(sessionId, userId) {
  const db = await getDb();
  if (!db.aiMentorSessions) db.aiMentorSessions = [];
  return db.aiMentorSessions.find(s => s.id === sessionId && s.userId === userId);
}

export async function createSession(session) {
  const db = await getDb();
  if (!db.aiMentorSessions) db.aiMentorSessions = [];
  db.aiMentorSessions.push(session);
  await saveDb(db);
  return session;
}

export async function updateSession(sessionId, sessionData) {
  const db = await getDb();
  if (!db.aiMentorSessions) db.aiMentorSessions = [];
  const idx = db.aiMentorSessions.findIndex(s => s.id === sessionId);
  if (idx !== -1) {
    db.aiMentorSessions[idx] = { ...db.aiMentorSessions[idx], ...sessionData, updatedAt: new Date().toISOString() };
    await saveDb(db);
    return db.aiMentorSessions[idx];
  }
  return null;
}

export async function getUserMemory(userId) {
  const db = await getDb();
  if (!db.aiMentorMemory) db.aiMentorMemory = [];
  let mem = db.aiMentorMemory.find(m => m.userId === userId);
  if (!mem) {
    // Return empty model fallback
    mem = {
      userId,
      weaknesses: [],
      strengths: [],
      topicsDiscussed: [],
      lastAtsScore: null,
      lastInterviewScore: null,
      updatedAt: new Date().toISOString()
    };
  }
  return mem;
}

export async function saveUserMemory(userId, memoryUpdates) {
  const db = await getDb();
  if (!db.aiMentorMemory) db.aiMentorMemory = [];
  const idx = db.aiMentorMemory.findIndex(m => m.userId === userId);
  const now = new Date().toISOString();
  
  if (idx !== -1) {
    db.aiMentorMemory[idx] = { ...db.aiMentorMemory[idx], ...memoryUpdates, updatedAt: now };
    await saveDb(db);
    return db.aiMentorMemory[idx];
  } else {
    const newMem = {
      userId,
      weaknesses: memoryUpdates.weaknesses || [],
      strengths: memoryUpdates.strengths || [],
      topicsDiscussed: memoryUpdates.topicsDiscussed || [],
      lastAtsScore: memoryUpdates.lastAtsScore || null,
      lastInterviewScore: memoryUpdates.lastInterviewScore || null,
      updatedAt: now
    };
    db.aiMentorMemory.push(newMem);
    await saveDb(db);
    return newMem;
  }
}

export async function getUserResumeDetails(userId) {
  const db = await getDb();
  const resumes = db.resumes ? db.resumes.filter(r => r.userId === userId) : [];
  const reports = db.atsReports ? db.atsReports.filter(r => r.userId === userId) : [];
  
  const latestReport = reports.length > 0 
    ? reports.reduce((prev, current) => (prev.score > current.score ? prev : current))
    : null;

  return {
    hasResume: resumes.length > 0,
    resumeCount: resumes.length,
    latestAtsScore: latestReport ? latestReport.score : null,
    latestGrade: latestReport ? latestReport.grade : null,
    missingKeywords: latestReport ? latestReport.keywords?.missing || [] : []
  };
}

export async function getUserCodingHistory(userId) {
  const db = await getDb();
  const subs = db.submissions ? db.submissions.filter(s => s.userId === userId) : [];
  const solvedCount = subs.filter(s => s.success === true).length;
  
  const failedLanguages = new Set();
  subs.forEach(s => {
    if (!s.success) {
      failedLanguages.add(s.language);
    }
  });

  return {
    submissionsCount: subs.length,
    solvedCount,
    failedLanguages: Array.from(failedLanguages)
  };
}

export default {
  getUserSessions,
  getSessionById,
  createSession,
  updateSession,
  getUserMemory,
  saveUserMemory,
  getUserResumeDetails,
  getUserCodingHistory
};
