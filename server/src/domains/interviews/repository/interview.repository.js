import { getDb, saveDb } from '../../../infrastructure/db/mongo.js';

export async function getUserInterviews(userId) {
  const db = await getDb();
  
  // 1. Fetch legacy interviews
  const legacyInterviews = (db.interviews || []).filter(i => i.userId === userId);
  
  // 2. Fetch new mock-interview sessions and their result reports
  const sessions = (db.interviewSessions || []).filter(s => s.userId === userId);
  const results = (db.interviewResults || []).filter(r => r.userId === userId);
  
  const mappedSessions = sessions.map(session => {
    const result = results.find(r => r.sessionId === session.id);
    return {
      id: session.id,
      userId: session.userId,
      type: session.type,
      difficulty: session.difficulty,
      company: session.company,
      status: session.status,
      startedAt: session.startedAt,
      finishedAt: session.endedAt || session.finishedAt || session.createdAt,
      feedback: result ? {
        overallScore: result.overallScore,
        communicationScore: result.communicationScore,
        technicalScore: result.technicalScore,
        detailedFeedback: result.detailedFeedback,
        strengths: result.strengths,
        weaknesses: result.weaknesses
      } : session.feedback
    };
  });
  
  // 3. Merge and deduplicate by id
  const combined = [...legacyInterviews, ...mappedSessions];
  const unique = [];
  const seenIds = new Set();
  for (const item of combined) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      unique.push(item);
    }
  }
  return unique;
}

export async function getInterviewById(id, userId) {
  const db = await getDb();
  const legacy = (db.interviews || []).find(i => i.id === id && i.userId === userId);
  if (legacy) return legacy;
  
  const session = (db.interviewSessions || []).find(s => s.id === id && s.userId === userId);
  if (session) {
    const result = (db.interviewResults || []).find(r => r.sessionId === session.id && r.userId === userId);
    return {
      ...session,
      finishedAt: session.endedAt || session.finishedAt || session.createdAt,
      feedback: result ? {
        overallScore: result.overallScore,
        communicationScore: result.communicationScore,
        technicalScore: result.technicalScore,
        detailedFeedback: result.detailedFeedback,
        strengths: result.strengths,
        weaknesses: result.weaknesses
      } : session.feedback
    };
  }
  return null;
}

export async function createInterview(interview) {
  const db = await getDb();
  if (!db.interviews) db.interviews = [];
  db.interviews.push(interview);
  await saveDb(db);
  return interview;
}

export async function saveInterview(interview) {
  const db = await getDb();
  const index = (db.interviews || []).findIndex(i => i.id === interview.id);
  if (index !== -1) {
    db.interviews[index] = interview;
  } else {
    db.interviews.push(interview);
  }
  await saveDb(db);
  return interview;
}

export default {
  getUserInterviews,
  getInterviewById,
  createInterview,
  saveInterview
};
