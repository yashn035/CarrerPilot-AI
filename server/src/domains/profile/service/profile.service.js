import { getDb, saveDb } from '../../../infrastructure/db/mongo.js';
import { awardXp } from '../../../shared/services/xp.service.js';
import { getPrompt } from '../../../infrastructure/ai/prompt.engine.js';
import { callAI } from '../../../infrastructure/ai/ai.orchestrator.js';
import { getUserState, updateUserState } from '../../../shared/state/user.state.js';
import profileRepository from '../repository/profile.repository.js';
import eventBus from '../../../shared/events/eventBus.js';
import logger from '../../../shared/logger/logger.js';

/**
 * Gets user profile state.
 */
export async function getUserProfile(userId) {
  const user = await getUserState(userId);
  if (!user) throw new Error("User not found");
  return user;
}

/**
 * Validates quest eligibility, adds quest completion logs, 
 * updates streaks/levels, and dispatches events.
 */
export async function claimQuestReward(userId, questId) {
  const db = await getDb();
  const user = db.users.find(u => u.id === userId);
  const quest = db.quests.find(q => q.id === questId);

  if (!user || !quest) throw new Error("User or Quest not found");
  if (user.completedQuests.includes(questId)) {
    throw new Error("Quest already claimed");
  }

  user.completedQuests.push(questId);
  const { leveledUp } = await awardXp(userId, quest.xp, `Completed Quest: ${quest.title}`, db);
  
  user.readinessScore = Math.min(user.readinessScore + 1, 100);
  await saveDb(db);

  // Sync to state system
  const updatedState = await updateUserState(userId, {
    xp: user.xp,
    level: user.level,
    completedQuests: user.completedQuests
  });

  // Publish to Event Bus
  eventBus.emit('quest_claimed', {
    userId,
    questId,
    title: quest.title,
    xpGained: quest.xp
  });

  return { user: updatedState, leveledUp, xpGained: quest.xp };
}

/**
 * Dispatches query conversations to AI Career Coach.
 */
export async function getMentorResponse(userId, message, chatHistory) {
  const db = await getDb();
  const user = db.users.find(u => u.id === userId);

  let category = "Career guidance";
  const msgLower = message.toLowerCase();
  
  if (msgLower.includes("dsa") || msgLower.includes("leetcode") || msgLower.includes("coding")) {
    category = "DSA / Coding";
  } else if (msgLower.includes("resume") || msgLower.includes("ats")) {
    category = "Resume / ATS";
  } else if (msgLower.includes("interview") || msgLower.includes("mock")) {
    category = "Interview prep";
  }

  let level = "Intermediate";
  const userLevelNum = user?.level || 1;
  if (userLevelNum >= 4) {
    level = "Advanced";
  } else if (userLevelNum <= 1) {
    level = "Beginner";
  }

  let mentorReply = null;
  try {
    const systemPrompt = getPrompt('mentor_chat', 'v1');
    const historyStr = (chatHistory || []).map(h => `${h.role === 'user' ? 'Candidate' : 'Mentor'}: ${h.content}`).join('\n');
    const userPrompt = `Category: ${category} | Level: ${level} | Target Role: ${user?.targetRole || 'Software Engineer'}\n${historyStr}\nCandidate: ${message}`;
    
    mentorReply = await callAI(systemPrompt, userPrompt);
  } catch (err) {
    logger.warn("AI Career Mentor failed, utilizing local advisors:", { error: err.message });
  }

  // Fallback Mock Mentor Advice
  if (!mentorReply) {
    const targetRole = user?.targetRole || "Software Engineer";
    const response = {
      answer: `Technical guidance for **${targetRole}** candidate.`,
      dos: ["Speak aloud while testing code.", "Audit complexities of trees."],
      donts: ["Avoid infinite loops Recursion.", "Do not write passive experience bullets."],
      explanation: "Preparing for tech hiring loops requires solid code design validation.",
      example: "Use hash maps for O(1) time lookups.",
      nextStep: "Practice today's daily prescriptive roadmap task."
    };

    mentorReply = `### AI Career Mentor Strategy\n\n${response.answer}\n\n* **DO**: ${response.dos.join(' · ')}\n* **DON'T**: ${response.donts.join(' · ')}\n\n${response.explanation}\n\nFor example:\n> ${response.example}\n\n**Next step:** ${response.nextStep}`;
  }

  let leveledUp = false;
  if (user) {
    const reward = await awardXp(userId, 10, "Engaged with AI Career Mentor", db);
    leveledUp = reward?.leveledUp || false;
    await saveDb(db);

    // Sync state
    await updateUserState(userId, { xp: user.xp, level: user.level });
  }

  return { reply: mentorReply, leveledUp };
}
