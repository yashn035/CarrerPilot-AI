import { getDb, saveDb } from '../../../infrastructure/db/mongo.js';
import { awardXp } from '../../../shared/services/xp.service.js';
import { updateUserState } from '../../../shared/state/user.state.js';
import { getPrompt } from '../../../infrastructure/ai/prompt.engine.js';
import { callAI, parseCleanJson } from '../../../infrastructure/ai/ai.orchestrator.js';
import eventBus from '../../../shared/events/eventBus.js';
import interviewRepository from '../repository/interview.repository.js';
import logger from '../../../shared/logger/logger.js';

/**
 * Gets user interview logs list.
 */
export async function getUserInterviews(userId) {
  return await interviewRepository.getUserInterviews(userId);
}

/**
 * Starts a new interview loop, generating the opening question.
 */
export async function startInterview(userId, { type, difficulty, company }) {
  let mockQuestion = null;
  try {
    const systemPrompt = getPrompt('interview_question', 'v1', { company: company || 'Tech Firm', type, difficulty });
    const aiResponse = await callAI(systemPrompt, "History: []");
    if (aiResponse) {
      mockQuestion = parseCleanJson(aiResponse);
    }
  } catch (err) {
    logger.warn("AI mock interview starter failed, using fallbacks:", { error: err.message });
  }

  // Fallback if AI fails
  if (!mockQuestion) {
    mockQuestion = {
      intro: `Welcome to the ${company || "Tech Group"} ${type} interview room. I'm your AI recruiter today. Let's start.`,
      question: type === "Technical" 
        ? "Could you explain the difference between processes and threads, and how they share memory?"
        : "Tell me about a challenging project you engineered, a roadblock you hit, and how you resolved it.",
      hint: "STAR method or basic process/thread stack allocations."
    };
  }

  const newSession = {
    id: "int-" + Math.random().toString(36).substring(2, 11),
    userId,
    type,
    difficulty,
    company,
    startedAt: new Date().toISOString(),
    history: [
      { role: "interviewer", content: mockQuestion.question, intro: mockQuestion.intro, hint: mockQuestion.hint }
    ],
    status: "active"
  };

  await interviewRepository.createInterview(newSession);
  
  return { 
    sessionId: newSession.id, 
    intro: mockQuestion.intro, 
    question: mockQuestion.question, 
    hint: mockQuestion.hint 
  };
}

/**
 * Feeds candidate answer and returns the next follow-up question.
 */
export async function respondToInterview(userId, interviewId, answer) {
  const session = await interviewRepository.getInterviewById(interviewId, userId);
  if (!session) throw new Error("Interview session not found");
  if (session.status !== "active") throw new Error("Interview already finished");

  session.history.push({ role: "candidate", content: answer });

  const userTurns = session.history.filter(h => h.role === "candidate").length;
  if (userTurns >= 4) {
    session.status = "completed";
    await interviewRepository.saveInterview(session);
    return { finished: true };
  }

  const formattedHistory = session.history.map(h => ({
    role: h.role,
    content: h.content
  }));

  let nextQuestion = null;
  try {
    const systemPrompt = getPrompt('interview_question', 'v1', { company: session.company || 'Tech Firm', type: session.type, difficulty: session.difficulty });
    const aiResponse = await callAI(systemPrompt, `History:\n${JSON.stringify(formattedHistory)}`);
    if (aiResponse) {
      nextQuestion = parseCleanJson(aiResponse);
    }
  } catch (err) {
    logger.warn("AI mock interview turn failed, using fallbacks:", { error: err.message });
  }

  if (!nextQuestion) {
    nextQuestion = {
      intro: "Thanks for explaining that.",
      question: `Based on your response: "${answer.substring(0, 40)}...", how would you address performance or scaling constraints under load?`,
      hint: "Analyze databases locks or network latency profiles."
    };
  }

  session.history.push({ 
    role: "interviewer", 
    content: nextQuestion.question, 
    intro: nextQuestion.intro, 
    hint: nextQuestion.hint 
  });

  await interviewRepository.saveInterview(session);

  return { 
    finished: false, 
    question: nextQuestion.question, 
    intro: nextQuestion.intro, 
    hint: nextQuestion.hint 
  };
}

/**
 * Ends interview session, calculates grades via AI, updates gamification, 
 * syncs states, and dispatches Events.
 */
export async function endInterviewSession(userId, interviewId) {
  const session = await interviewRepository.getInterviewById(interviewId, userId);
  if (!session) throw new Error("Interview session not found");

  session.status = "completed";

  const evaluationHistory = [];
  for (let idx = 0; idx < session.history.length; idx += 2) {
    const qNode = session.history[idx];
    const aNode = session.history[idx + 1];
    evaluationHistory.push({
      question: qNode?.content || "",
      answer: aNode?.content || ""
    });
  }

  let feedback = null;
  try {
    const systemPrompt = getPrompt('interview_evaluate', 'v1');
    const aiResponse = await callAI(systemPrompt, `Transcript:\n${JSON.stringify(evaluationHistory)}`);
    if (aiResponse) {
      feedback = parseCleanJson(aiResponse);
    }
  } catch (err) {
    logger.warn("AI mock interview grading failed, utilizing fallback metrics:", { error: err.message });
  }

  // Heuristic grading fallback
  if (!feedback) {
    feedback = {
      overallScore: 75,
      communicationScore: 80,
      technicalScore: 70,
      strengths: ["Clear thought process.", "Professional vocabulary."],
      weaknesses: ["Needs deeper metric focus.", "Missed unit-testing strategies."],
      detailedFeedback: "The candidate shows high competency. Focus on highlighting data design options and exact latencies.",
      questionReviews: evaluationHistory.map(q => ({
        question: q.question,
        answer: q.answer,
        score: 75,
        feedback: "Good response. Try adding numerical metrics."
      }))
    };
  }

  session.feedback = feedback;
  session.finishedAt = new Date().toISOString();

  await interviewRepository.saveInterview(session);

  // Gamification & state updates
  const db = await getDb();
  const user = db.users.find(u => u.id === userId);
  let leveledUp = false;

  if (user) {
    const interviewQuestDone = user.completedQuests.includes("mock-interview");
    if (!interviewQuestDone) {
      user.completedQuests.push("mock-interview");
      const quest = db.quests.find(q => q.id === "mock-interview");
      const qReward = await awardXp(userId, quest.xp, `Completed Quest: ${quest.title}`, db);
      leveledUp = qReward?.leveledUp || false;
      await saveDb(db);
    }

    // Sync user state scores
    await updateUserState(userId, {
      xp: user.xp,
      level: user.level,
      scores: {
        interview: feedback.overallScore,
        communication: feedback.communicationScore
      }
    });
  }

  // Publish telemetry to Event Bus
  eventBus.emit('interview_completed', {
    userId,
    interviewId,
    score: feedback.overallScore,
    company: session.company
  });

  return { feedback, leveledUp };
}
