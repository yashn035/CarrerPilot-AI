import crypto from 'crypto';
import aiMentorRepository from '../repository/ai-mentor.repository.js';
import fallbackService from './fallback.service.js';
import promptEngine from '../../../infrastructure/ai/prompt.engine.js';
import aiOrchestrator from '../../../infrastructure/ai/ai.orchestrator.js';
import { awardXp } from '../../../shared/services/xp.service.js';
import { getDb, saveDb } from '../../../infrastructure/db/mongo.js';
import { updateUserState } from '../../../shared/state/user.state.js';
import eventBus from '../../../shared/events/eventBus.js';
import logger from '../../../shared/logger/logger.js';

/**
 * Starts a new AI Mentor session for a user.
 */
export async function startMentorSession(userId, initialMode = 'placement') {
  const newSession = {
    id: "session-" + Math.random().toString(36).substring(2, 11),
    userId,
    mode: initialMode,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: []
  };

  // Pre-populate system or welcome message based on mode
  let welcomeText = "";
  if (initialMode === 'interview') {
    welcomeText = "Welcome to your mock interview simulation! I'll act as your interviewer. Let's start: **Can you explain prototype inheritance in JavaScript?**";
  } else if (initialMode === 'resume') {
    welcomeText = "Resume Mode active. Paste your bullet points or ask for an ATS keyword audit.";
  } else if (initialMode === 'dsa') {
    welcomeText = "DSA Mentor active. Send me an algorithmic query or code snippet to review and optimize.";
  } else if (initialMode === 'system_design') {
    welcomeText = "System Design Mentor active. Tell me what service you want to design (e.g. Rate Limiter, TinyURL).";
  } else if (initialMode === 'behavioral') {
    welcomeText = "Behavioral Coach active. Let's practice. **Tell me about a time you handled a tight deadline.**";
  } else if (initialMode === 'project') {
    welcomeText = "Project Mentor active. Describe your project tech stack or paste a GitHub link for reviews.";
  } else if (initialMode === 'career') {
    welcomeText = "Career Coach active. Ask me about job switches, negotiation strategies, or general growth.";
  } else {
    welcomeText = "Hello! I am your Placement Mentor. Select your target company to generate a structured 4-week roadmap.";
  }

  newSession.messages.push({
    role: "mentor",
    content: welcomeText,
    mode: initialMode,
    score: null,
    feedback: "Session initialized",
    nextAction: "Provide candidate response",
    timestamp: new Date().toISOString()
  });

  await aiMentorRepository.createSession(newSession);
  return newSession;
}

/**
 * Handles chat requests through the AI pipeline.
 */
export async function processChat(userId, sessionId, message, explicitMode = null) {
  const db = await getDb();
  const user = db.users.find(u => u.id === userId);
  if (!user) throw new Error("User not found");

  // 1. Resolve or Auto-detect Mode
  let mode = explicitMode;
  if (!mode) {
    mode = detectMode(message);
  }

  // 2. Fetch User Memory & Context
  const memory = await aiMentorRepository.getUserMemory(userId);
  const resumeDetails = await aiMentorRepository.getUserResumeDetails(userId);
  const codingHistory = await aiMentorRepository.getUserCodingHistory(userId);

  // Sync memory weaknesses
  const combinedWeaknesses = Array.from(new Set([
    ...(memory.weaknesses || []),
    ...(resumeDetails.missingKeywords.slice(0, 3)),
    ...(codingHistory.failedLanguages || [])
  ]));

  const combinedStrengths = Array.from(new Set([
    ...(memory.strengths || []),
    ...(user.skills ? user.skills.filter(s => s.level >= 4).map(s => s.name) : [])
  ]));

  // 3. Retrieve or Create Chat Session
  let session;
  if (sessionId) {
    session = await aiMentorRepository.getSessionById(sessionId, userId);
  }

  if (!session) {
    session = await startMentorSession(userId, mode);
  }

  // Append user message
  const userMsg = {
    role: "user",
    content: message,
    mode,
    timestamp: new Date().toISOString()
  };
  session.messages.push(userMsg);

  // Format message history for AI context
  const historyLimit = session.messages.slice(-8); // Limit history turns
  const historyStr = historyLimit
    .map(h => `${h.role === 'user' ? 'Candidate' : 'Mentor'}: ${h.content || h.message}`)
    .join('\n');

  // 4. Construct Prompt
  const variables = {
    targetRole: memory.targetRole || user.targetRole || "Software Engineer",
    targetCompanies: (memory.targetCompanies || []).join(', ') || "Google, Amazon, Stripe",
    mode,
    weaknesses: combinedWeaknesses.join(', ') || "None recorded yet",
    strengths: combinedStrengths.join(', ') || "None recorded yet",
    topicsDiscussed: (memory.topicsDiscussed || []).slice(-5).join(', ') || "None yet",
    lastAtsScore: resumeDetails.latestAtsScore || "Not analyzed yet",
    solvedCount: codingHistory.solvedCount || 0
  };

  const systemPrompt = promptEngine.getPrompt('ai_mentor_unified', 'v2', variables);
  const userPrompt = `Conversation History:\n${historyStr}\n\nCandidate response/input:\n${message}\n\nProvide your JSON reply:`;

  // 5. Call AI Engine
  let aiReplyStr = null;
  let parsedReply = null;

  try {
    aiReplyStr = await aiOrchestrator.callAI(systemPrompt, userPrompt, false);
    if (aiReplyStr) {
      parsedReply = aiOrchestrator.parseCleanJson(aiReplyStr);
    }
  } catch (err) {
    logger.warn("Gemini AI Mentor call failed, switching to Fallback Engine.", { error: err.message });
  }

  // 6. Fallback Activation if AI output is invalid or empty
  if (!parsedReply) {
    parsedReply = fallbackService.generateFallbackResponse(mode, message, user, session.messages);
  }

  // Normalize parsed fields
  const mentorMsg = {
    role: "mentor",
    content: parsedReply.message || parsedReply.reply || "I'm processing your request.",
    mode: parsedReply.mode || mode,
    score: parsedReply.score !== undefined ? parsedReply.score : null,
    feedback: parsedReply.feedback || "",
    nextAction: parsedReply.next_action || parsedReply.nextAction || "",
    timestamp: new Date().toISOString()
  };

  // 7. Update Session and Memory maps
  session.messages.push(mentorMsg);
  session.mode = mentorMsg.mode; // Update current session mode if changed
  await aiMentorRepository.updateSession(session.id, {
    mode: session.mode,
    messages: session.messages
  });

  // Extract discussed topic
  let discussedTopic = extractTopic(message);
  if (discussedTopic && !memory.topicsDiscussed.includes(discussedTopic)) {
    memory.topicsDiscussed.push(discussedTopic);
  }

  // Update strengths/weaknesses dynamically based on scores
  if (mentorMsg.score !== null) {
    const scoreVal = parseInt(mentorMsg.score, 10);
    if (scoreVal >= 8 && discussedTopic) {
      memory.strengths = Array.from(new Set([...(memory.strengths || []), discussedTopic]));
      memory.weaknesses = (memory.weaknesses || []).filter(w => w !== discussedTopic);
    } else if (scoreVal < 6 && discussedTopic) {
      memory.weaknesses = Array.from(new Set([...(memory.weaknesses || []), discussedTopic]));
      memory.strengths = (memory.strengths || []).filter(s => s !== discussedTopic);
    }
  }

  // Automatically update daily mission status
  if (mode === 'dsa') {
    const dsaMission = (memory.dailyMissions || []).find(m => m.id === 'mission-dsa');
    if (dsaMission) dsaMission.completed = true;
  } else if (mode === 'interview' || mode === 'behavioral') {
    const mockMission = (memory.dailyMissions || []).find(m => m.id === 'mission-mock');
    if (mockMission) mockMission.completed = true;
  } else if (mode === 'resume') {
    const resumeMission = (memory.dailyMissions || []).find(m => m.id === 'mission-resume');
    if (resumeMission) resumeMission.completed = true;
  }

  await aiMentorRepository.saveUserMemory(userId, {
    weaknesses: memory.weaknesses || [],
    strengths: memory.strengths || [],
    topicsDiscussed: memory.topicsDiscussed || [],
    dailyMissions: memory.dailyMissions || [],
    lastInterviewScore: mentorMsg.score !== null ? parseInt(mentorMsg.score, 10) * 10 : memory.lastInterviewScore
  });

  // 8. Award XP & Sync profile level
  const freshDb = await getDb();
  const reward = await awardXp(userId, 10, `AI Mentor Engagement (${mode})`, freshDb);
  await saveDb(freshDb);
  const updatedUser = freshDb.users.find(u => u.id === userId);
  await updateUserState(userId, { xp: updatedUser.xp, level: updatedUser.level });

  // Broadcast event to timeline
  eventBus.emit('ai_mentor_chat_completed', {
    userId,
    sessionId: session.id,
    mode,
    score: mentorMsg.score
  });

  return {
    sessionId: session.id,
    mode: session.mode,
    reply: mentorMsg.content,
    score: mentorMsg.score,
    feedback: mentorMsg.feedback,
    nextAction: mentorMsg.nextAction,
    leveledUp: reward?.leveledUp || false,
    xpGained: 10
  };
}

/**
 * End session and return a comprehensive feedback summary.
 */
export async function endMentorSession(userId, sessionId) {
  const session = await aiMentorRepository.getSessionById(sessionId, userId);
  if (!session) throw new Error("Session not found");

  session.status = "completed";
  await aiMentorRepository.updateSession(sessionId, { status: "completed" });

  const interviewMsgs = session.messages.filter(m => (m.mode === 'interview' || m.mode === 'behavioral') && m.role === 'mentor' && m.score !== null);
  const totalScore = interviewMsgs.reduce((acc, current) => acc + parseInt(current.score, 10), 0);
  const averageScore = interviewMsgs.length > 0 ? (totalScore / interviewMsgs.length) * 10 : null; // Out of 100

  if (averageScore !== null) {
    eventBus.emit('interview_completed', {
      userId,
      company: "AI Mentor Simulated Loop",
      score: averageScore
    });
  }

  return {
    sessionId,
    status: "completed",
    averageScore,
    message: "Mentor Session successfully ended and archived. Your stats and strengths have been synchronized with your dashboard timeline."
  };
}

/**
 * Retrieves full session history and current memory stats.
 */
export async function getHistoryAndMemory(userId) {
  const sessions = await aiMentorRepository.getUserSessions(userId);
  const memory = await aiMentorRepository.getUserMemory(userId);
  return {
    sessions: sessions.map(s => ({
      id: s.id,
      mode: s.mode,
      status: s.status,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      messageCount: s.messages.length
    })),
    memory
  };
}

/**
 * Generates personalized roadmap.
 */
export async function generateRoadmap(userId, targetCompany) {
  const memory = await aiMentorRepository.getUserMemory(userId);
  const company = targetCompany || (memory.targetCompanies && memory.targetCompanies[0]) || "Google";
  const targetRole = memory.targetRole || "Software Engineer";
  const weaknesses = (memory.weaknesses || []).join(', ') || "none specified";
  const strengths = (memory.strengths || []).join(', ') || "none specified";

  const systemPrompt = `You are a placement training coach. Generate a personalized week-by-week DSA/Placement preparation roadmap for a ${targetRole} targeting ${company}.
The candidate's current strengths are: ${strengths}. Weaknesses to focus on: ${weaknesses}.
You MUST return ONLY a valid JSON array of exactly 4 weeks. Do not wrap in markdown or write any conversational text outside the JSON block.
Conform to this schema:
[
  {
    "week": "Week 1",
    "topics": ["topic1", "topic2"],
    "problems": ["problem1", "problem2"],
    "tips": ["tip1", "tip2"]
  }
]`;

  const userPrompt = `Generate the 4-week roadmap JSON array.`;

  try {
    const aiReplyStr = await aiOrchestrator.callAI(systemPrompt, userPrompt, false);
    if (aiReplyStr) {
      const parsed = aiOrchestrator.parseCleanJson(aiReplyStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    logger.warn("Gemini roadmap generation failed, using fallback roadmap.", { error: err.message });
  }

  // Fallback map
  const fallbackRoadmaps = {
    Google: [
      { week: "Week 1: Foundations & Arrays", topics: ["Arrays & Sliding Window", "Hash Tables"], problems: ["Two Sum", "Fruit Into Baskets"], tips: ["Focus on optimal time complexity O(N).", "Ask clarifying questions first."] },
      { week: "Week 2: Advanced Searching", topics: ["Trees & BFS/DFS", "Binary Search"], problems: ["Invert Binary Tree", "Search in Rotated Sorted Array"], tips: ["Google heavily tests tree traversals.", "Practice recursive dry runs."] },
      { week: "Week 3: Connections & Sorting", topics: ["Graphs & Topological Sort", "Union Find"], problems: ["Number of Islands", "Course Schedule"], tips: ["Focus on cycles and edge list conversions.", "Explain space complexity clearly."] },
      { week: "Week 4: Optimization", topics: ["Dynamic Programming", "Tries"], problems: ["Climbing Stairs", "Implement Trie"], tips: ["Memoization is preferred for speed during interviews.", "Understand time/space tradeoffs."] }
    ],
    Amazon: [
      { week: "Week 1: LP & Coding Base", topics: ["Leadership Principles", "Arrays & Hashing"], problems: ["Two Sum", "Group Anagrams"], tips: ["Amazon LP is 50% of the interview score.", "Use the STAR method for stories."] },
      { week: "Week 2: Structure Manipulation", topics: ["Linked Lists & Two Pointers", "Stacks"], problems: ["Reverse Linked List", "Valid Parentheses"], tips: ["Understand pointer manipulation clearly.", "Keep space complexity at O(1) where possible."] },
      { week: "Week 3: Heaps & Search", topics: ["Trees & Heap Priority Queue", "BFS"], problems: ["K Closest Points to Origin", "Binary Tree Level Order Traversal"], tips: ["Practice heaps for high performance sorting.", "Prepare runtime analysis."] },
      { week: "Week 4: Architecture & Optimizations", topics: ["System Design Basic", "DP"], problems: ["Design Rate Limiter", "Coin Change"], tips: ["Amazon system design requires scale considerations.", "Prepare HLD block diagrams."] }
    ],
    Stripe: [
      { week: "Week 1: Clean Code & Strings", topics: ["API Design & JSON parsing Parsing", "Strings"], problems: ["Valid Parentheses", "String to Integer"], tips: ["Stripe focuses on clean production-ready code.", "Write tests for your functions."] },
      { week: "Week 2: Performance & Caching", topics: ["Concurrency & Rate Limiting", "Hash Maps"], problems: ["Design Hit Counter", "Logger Rate Limiter"], tips: ["Understand token bucket algorithms.", "Write modular, clean code structures."] },
      { week: "Week 3: Practical OOP Design", topics: ["Refactoring & Error Handling", "Data Structures"], problems: ["Design Parking System"], tips: ["Stripe interviews are highly practical, not just DSA puzzles.", "Ensure edge cases are caught."] },
      { week: "Week 4: Full System APIs", topics: ["Integrations & OOP Design", "System Architecture"], problems: ["Design Stripe API Checkout Webhook"], tips: ["Prepare error retry logic.", "Keep idempotency in mind."] }
    ],
    Generic: [
      { week: "Week 1: Complexity & Linear DS", topics: ["Arrays & Strings", "Complexity Analysis"], problems: ["Two Sum", "Valid Anagram"], tips: ["Understand O(N) vs O(N^2).", "Practice writing clean variable names."] },
      { week: "Week 2: Linear Data Structures", topics: ["Linked Lists & Stacks", "Queues"], problems: ["Reverse Linked List", "Min Stack"], tips: ["Focus on pointer states.", "Understand stack push/pop overhead."] },
      { week: "Week 3: Hierarchies & Graphs", topics: ["Trees & Graphs", "Recursion"], problems: ["Maximum Depth of Tree", "Flood Fill"], tips: ["Recursion base cases are critical.", "Practice DFS traversals."] },
      { week: "Week 4: Soft Skills & Final Polish", topics: ["Behavioral Prep & Projects", "Resume Audit"], problems: ["Self Intro Prep", "Project Walkthrough"], tips: ["Explain project metrics in ATS format.", "Practice speaking confidently."] }
    ]
  };

  return fallbackRoadmaps[company] || fallbackRoadmaps.Generic;
}

/**
 * Predict overall readiness score.
 */
export async function predictPlacementReadiness(userId) {
  const resumeDetails = await aiMentorRepository.getUserResumeDetails(userId);
  const codingHistory = await aiMentorRepository.getUserCodingHistory(userId);
  const memory = await aiMentorRepository.getUserMemory(userId);

  const resumeScore = resumeDetails.latestAtsScore || memory.lastAtsScore || 70;
  
  const dsaCount = codingHistory.solvedCount || 0;
  const dsaScore = Math.min(100, Math.max(50, 50 + dsaCount * 5));

  const db = await getDb();
  const projects = db.projects ? db.projects.filter(p => p.userId === userId) : [];
  const latestProject = projects.length > 0 ? projects[projects.length - 1] : null;
  const projectsScore = latestProject && latestProject.scores ? latestProject.scores.architecture : 75;

  const interviewScore = memory.lastInterviewScore || 65;

  const overallScore = Math.round(0.3 * resumeScore + 0.3 * dsaScore + 0.2 * projectsScore + 0.2 * interviewScore);

  const chanceProduct = Math.min(99, Math.max(10, overallScore - 2));
  const chanceService = Math.min(99, Math.max(30, overallScore + 15));

  return {
    breakdown: {
      resume: resumeScore,
      dsa: dsaScore,
      projects: projectsScore,
      interview: interviewScore
    },
    overallScore,
    predictions: {
      chanceProduct,
      chanceService
    }
  };
}

/**
 * Fetch and complete daily missions.
 */
export async function getDailyMissions(userId) {
  const memory = await aiMentorRepository.getUserMemory(userId);
  const resumeDetails = await aiMentorRepository.getUserResumeDetails(userId);
  const codingHistory = await aiMentorRepository.getUserCodingHistory(userId);

  if (!memory.dailyMissions || memory.dailyMissions.length === 0) {
    memory.dailyMissions = [
      { id: "mission-dsa", title: "Solve 1 Array or String problem in Coding Arena", type: "dsa", completed: false, claimed: false, xpReward: 50 },
      { id: "mission-resume", title: "Optimize 1 bullet point or scan resume", type: "resume", completed: false, claimed: false, xpReward: 50 },
      { id: "mission-mock", title: "Run 1 Mock Interview in interview mode", type: "interview", completed: false, claimed: false, xpReward: 50 }
    ];
  }

  const dsaComplete = (codingHistory.solvedCount || 0) > 0;
  const resumeComplete = resumeDetails.hasResume || (resumeDetails.latestAtsScore !== null);
  const mockComplete = (memory.lastInterviewScore !== null) || (memory.topicsDiscussed.length > 0);

  memory.dailyMissions.forEach(m => {
    if (m.id === 'mission-dsa' && dsaComplete) m.completed = true;
    if (m.id === 'mission-resume' && resumeComplete) m.completed = true;
    if (m.id === 'mission-mock' && mockComplete) m.completed = true;
  });

  await aiMentorRepository.saveUserMemory(userId, { dailyMissions: memory.dailyMissions });

  return memory.dailyMissions;
}

/**
 * Claims reward for completed mission.
 */
export async function claimDailyMission(userId, missionId) {
  const db = await getDb();
  const user = db.users.find(u => u.id === userId);
  if (!user) throw new Error("User not found");

  const memory = await aiMentorRepository.getUserMemory(userId);
  const mission = (memory.dailyMissions || []).find(m => m.id === missionId);

  if (!mission) {
    throw new Error("Mission not found");
  }

  if (mission.claimed) {
    return { success: false, message: "Mission reward already claimed." };
  }

  const resumeDetails = await aiMentorRepository.getUserResumeDetails(userId);
  const codingHistory = await aiMentorRepository.getUserCodingHistory(userId);
  const dsaComplete = (codingHistory.solvedCount || 0) > 0;
  const resumeComplete = resumeDetails.hasResume || (resumeDetails.latestAtsScore !== null);
  const mockComplete = (memory.lastInterviewScore !== null) || (memory.topicsDiscussed.length > 0);

  if (mission.id === 'mission-dsa' && dsaComplete) mission.completed = true;
  if (mission.id === 'mission-resume' && resumeComplete) mission.completed = true;
  if (mission.id === 'mission-mock' && mockComplete) mission.completed = true;

  if (!mission.completed) {
    return { success: false, message: "Mission is not completed yet." };
  }

  mission.claimed = true;
  await aiMentorRepository.saveUserMemory(userId, { dailyMissions: memory.dailyMissions });

  const freshDb = await getDb();
  const reward = await awardXp(userId, mission.xpReward || 50, `Daily Quest: ${mission.title}`, freshDb);
  await saveDb(freshDb);
  const updatedUser = freshDb.users.find(u => u.id === userId);
  await updateUserState(userId, { xp: updatedUser.xp, level: updatedUser.level });

  return {
    success: true,
    claimedMission: missionId,
    xpGained: mission.xpReward || 50,
    leveledUp: reward?.leveledUp || false,
    newLevel: updatedUser.level,
    newXp: updatedUser.xp
  };
}

/**
 * Helper to auto-detect operation mode.
 */
function detectMode(message) {
  const msg = message.toLowerCase();
  if (msg.includes("interview") || msg.includes("mock") || msg.includes("question") || msg.includes("interviewer")) {
    return "interview";
  }
  if (msg.includes("resume") || msg.includes("ats") || msg.includes("bullet") || msg.includes("keywords")) {
    return "resume";
  }
  if (msg.includes("dsa") || msg.includes("algorithm") || msg.includes("complexity") || msg.includes("leetcode") || msg.includes("tree") || msg.includes("array") || msg.includes("graph")) {
    return "dsa";
  }
  if (msg.includes("system design") || msg.includes("hld") || msg.includes("lld") || msg.includes("architecture") || msg.includes("database scaling")) {
    return "system_design";
  }
  if (msg.includes("career") || msg.includes("switch") || msg.includes("salary") || msg.includes("growth") || msg.includes("promotion")) {
    return "career";
  }
  if (msg.includes("behavioral") || msg.includes("star method") || msg.includes("conflict") || msg.includes("hr")) {
    return "behavioral";
  }
  if (msg.includes("project") || msg.includes("repository") || msg.includes("tech stack") || msg.includes("code review")) {
    return "project";
  }
  return "placement";
}

/**
 * Helper to extract main keyword topic.
 */
function extractTopic(message) {
  const msg = message.toLowerCase();
  const topics = [
    "javascript", "python", "typescript", "react", "express", "node", "mongodb", "redis",
    "binary search", "arrays", "trees", "graphs", "dynamic programming", "closures",
    "promises", "prototype", "rate limiter", "caching", "indexing", "system design", "ats"
  ];
  for (const t of topics) {
    if (msg.includes(t)) return t;
  }
  return null;
}
