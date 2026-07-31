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
  const user = db.users ? db.users.find(u => u.id === userId) : null;
  
  if (!mem) {
    mem = {
      userId,
      targetRole: user ? user.targetRole : "Software Engineer",
      targetCompanies: ["Google", "Amazon", "Stripe"],
      weaknesses: [],
      strengths: user && user.skills ? user.skills.filter(s => s.level >= 4).map(s => s.name) : [],
      topicsDiscussed: [],
      lastAtsScore: null,
      lastInterviewScore: null,
      dailyMissions: [
        { id: "mission-dsa", title: "Solve 1 Array or String problem in Coding Arena", type: "dsa", completed: false, claimed: false, xpReward: 50 },
        { id: "mission-resume", title: "Optimize 1 bullet point or scan resume", type: "resume", completed: false, claimed: false, xpReward: 50 },
        { id: "mission-mock", title: "Run 1 Mock Interview in interview mode", type: "interview", completed: false, claimed: false, xpReward: 50 }
      ],
      updatedAt: new Date().toISOString()
    };
  }
  
  if (user) {
    mem.targetRole = user.targetRole || mem.targetRole || "Software Engineer";
    mem.streak = user.streak || 0;
    mem.level = user.level || 1;
    mem.xp = user.xp || 0;
    mem.name = user.name || "Alex Mercer";
  }
  
  if (!mem.dailyMissions || mem.dailyMissions.length === 0) {
    mem.dailyMissions = [
      { id: "mission-dsa", title: "Solve 1 Array or String problem in Coding Arena", type: "dsa", completed: false, claimed: false, xpReward: 50 },
      { id: "mission-resume", title: "Optimize 1 bullet point or scan resume", type: "resume", completed: false, claimed: false, xpReward: 50 },
      { id: "mission-mock", title: "Run 1 Mock Interview in interview mode", type: "interview", completed: false, claimed: false, xpReward: 50 }
    ];
  }

  if (!mem.targetCompanies) {
    mem.targetCompanies = ["Google", "Amazon", "Stripe"];
  }

  return mem;
}

export async function saveUserMemory(userId, memoryUpdates) {
  const db = await getDb();
  if (!db.aiMentorMemory) db.aiMentorMemory = [];
  const idx = db.aiMentorMemory.findIndex(m => m.userId === userId);
  const now = new Date().toISOString();
  
  const user = db.users ? db.users.find(u => u.id === userId) : null;
  const targetRole = memoryUpdates.targetRole || (user ? user.targetRole : "Software Engineer");
  const targetCompanies = memoryUpdates.targetCompanies || ["Google", "Amazon", "Stripe"];

  if (idx !== -1) {
    db.aiMentorMemory[idx] = { 
      ...db.aiMentorMemory[idx], 
      ...memoryUpdates, 
      targetRole,
      targetCompanies,
      updatedAt: now 
    };
    await saveDb(db);
    return db.aiMentorMemory[idx];
  } else {
    const newMem = {
      userId,
      targetRole,
      targetCompanies,
      weaknesses: memoryUpdates.weaknesses || [],
      strengths: memoryUpdates.strengths || [],
      topicsDiscussed: memoryUpdates.topicsDiscussed || [],
      lastAtsScore: memoryUpdates.lastAtsScore || null,
      lastInterviewScore: memoryUpdates.lastInterviewScore || null,
      dailyMissions: memoryUpdates.dailyMissions || [
        { id: "mission-dsa", title: "Solve 1 Array or String problem in Coding Arena", type: "dsa", completed: false, claimed: false, xpReward: 50 },
        { id: "mission-resume", title: "Optimize 1 bullet point or scan resume", type: "resume", completed: false, claimed: false, xpReward: 50 },
        { id: "mission-mock", title: "Run 1 Mock Interview in interview mode", type: "interview", completed: false, claimed: false, xpReward: 50 }
      ],
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
  const resumeIds = resumes.map(r => r.id);
  const reports = db.atsReports ? db.atsReports.filter(r => resumeIds.includes(r.resumeId) || r.userId === userId) : [];
  
  const latestReport = reports.length > 0 
    ? reports.reduce((prev, current) => (prev.score > current.score ? prev : current), reports[0])
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
