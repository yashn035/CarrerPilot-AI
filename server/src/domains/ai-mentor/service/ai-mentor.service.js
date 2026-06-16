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
export async function startMentorSession(userId, initialMode = 'mentor') {
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
  } else if (initialMode === 'reviewer') {
    welcomeText = "Reviewer Mode active. Send over a resume description or code block to receive a full critique.";
  } else if (initialMode === 'planner') {
    welcomeText = "Planner Mode active. Tell me about your target timeline or standard tracks, and I will output a step-by-step prep roadmap.";
  } else {
    welcomeText = "Hello! I am your Career Mentor. Ask me any technical or placement preparation questions.";
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

  // Sync memory inputs
  const combinedWeaknesses = Array.from(new Set([
    ...memory.weaknesses,
    ...(resumeDetails.missingKeywords.slice(0, 3)),
    ...(codingHistory.failedLanguages)
  ]));

  const combinedStrengths = Array.from(new Set([
    ...memory.strengths,
    ...(user.skills ? user.skills.filter(s => s.level >= 4).map(s => s.name) : [])
  ]));

  // 3. Retrieve or Create Chat Session
  let session;
  if (sessionId) {
    session = await aiMentorRepository.getSessionById(sessionId, userId);
  }

  // If session doesn't exist, start a new one automatically
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
    targetRole: user.targetRole || "Software Engineer",
    mode,
    weaknesses: combinedWeaknesses.join(', ') || "None recorded yet",
    strengths: combinedStrengths.join(', ') || "None recorded yet",
    topicsDiscussed: memory.topicsDiscussed.slice(-5).join(', ') || "None yet",
    lastAtsScore: resumeDetails.latestAtsScore || "Not analyzed yet",
    solvedCount: codingHistory.solvedCount
  };

  const systemPrompt = promptEngine.getPrompt('ai_mentor_unified', 'v1', variables);
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
    content: parsedReply.message || "I'm processing your request.",
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
      memory.strengths = Array.from(new Set([...memory.strengths, discussedTopic]));
      memory.weaknesses = memory.weaknesses.filter(w => w !== discussedTopic);
    } else if (scoreVal < 6 && discussedTopic) {
      memory.weaknesses = Array.from(new Set([...memory.weaknesses, discussedTopic]));
      memory.strengths = memory.strengths.filter(s => s !== discussedTopic);
    }
  }

  await aiMentorRepository.saveUserMemory(userId, {
    weaknesses: memory.weaknesses,
    strengths: memory.strengths,
    topicsDiscussed: memory.topicsDiscussed,
    lastInterviewScore: mentorMsg.score !== null ? parseInt(mentorMsg.score, 10) * 10 : memory.lastInterviewScore
  });

  // 8. Award XP & Sync profile level
  const reward = await awardXp(userId, 10, `AI Mentor Engagement (${mode})`, db);
  await saveDb(db);
  await updateUserState(userId, { xp: user.xp, level: user.level });

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

  // Compute final summary statistics
  const interviewMsgs = session.messages.filter(m => m.mode === 'interview' && m.role === 'mentor' && m.score !== null);
  const totalScore = interviewMsgs.reduce((acc, current) => acc + parseInt(current.score, 10), 0);
  const averageScore = interviewMsgs.length > 0 ? (totalScore / interviewMsgs.length) * 10 : null; // Out of 100

  // Log timeline dashboard updates
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
 * Helper to auto-detect operation mode.
 */
function detectMode(message) {
  const msg = message.toLowerCase();
  if (msg.includes("interview") || msg.includes("mock") || msg.includes("question") || msg.includes("interviewer")) {
    return "interview";
  }
  if (msg.includes("review") || msg.includes("resume") || msg.includes("audit") || msg.includes("code quality") || msg.includes("function") || msg.includes("class ")) {
    return "reviewer";
  }
  if (msg.includes("roadmap") || msg.includes("plan") || msg.includes("study") || msg.includes("schedule") || msg.includes("week")) {
    return "planner";
  }
  return "mentor";
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
