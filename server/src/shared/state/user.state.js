import { getDb, saveDb } from '../../infrastructure/db/mongo.js';
import eventBus from '../events/eventBus.js';
import logger from '../logger/logger.js';

/**
 * Retrieves the safe (non-sensitive) user state profile.
 * @param {string} userId 
 * @returns {Promise<Object|null>}
 */
export async function getUserState(userId) {
  const db = await getDb();
  const user = db.users.find(u => u.id === userId);
  if (!user) return null;
  
  const { password, ...safeUser } = user;
  return safeUser;
}

/**
 * Performs atomic state updates, automatically updates readiness scores, 
 * persists writes to DB, and triggers EventBus synchronizations.
 * @param {string} userId 
 * @param {Object} updates 
 * @returns {Promise<Object>} Mapped state data
 */
export async function updateUserState(userId, updates) {
  const db = await getDb();
  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    logger.error(`User state update failed: User not found: ${userId}`);
    throw new Error(`User not found: ${userId}`);
  }

  const user = db.users[userIndex];
  
  const oldXp = user.xp || 0;
  const oldLevel = user.level || 1;
  const oldReadiness = user.readinessScore || 35;

  // Merge updates selectively
  Object.keys(updates).forEach(key => {
    if (key === 'scores' && updates.scores) {
      user.scores = { ...user.scores, ...updates.scores };
    } else if (key === 'skills' && Array.isArray(updates.skills)) {
      user.skills = updates.skills;
    } else if (key !== 'id' && key !== 'password') {
      user[key] = updates[key];
    }
  });

  // Calculate dynamic weighted Placement Readiness Score
  const dsa = user.scores?.dsa || 0;
  const projects = user.scores?.projects || 0;
  const resume = user.scores?.resume || 0;
  const interview = user.scores?.interview || 0;
  const communication = user.scores?.communication || 0;

  user.readinessScore = Math.min(
    Math.round(
      (resume * 0.20) +
      (dsa * 0.25) +
      (projects * 0.20) +
      (communication * 0.15) +
      (interview * 0.20)
    ),
    100
  );

  // Persist to database files or MongoDB
  await saveDb(db);

  const stateData = {
    userId,
    xp: user.xp,
    level: user.level,
    readinessScore: user.readinessScore,
    streak: user.streak,
    scores: user.scores,
    skills: user.skills,
    completedQuests: user.completedQuests
  };

  // Broadcast XP progress changes
  if (user.xp !== oldXp || user.level !== oldLevel) {
    eventBus.emit('xp_updated', {
      userId,
      xp: user.xp,
      level: user.level,
      xpGained: user.xp - oldXp,
      leveledUp: user.level > oldLevel
    });
  }

  // Broadcast readiness score changes
  if (user.readinessScore !== oldReadiness) {
    eventBus.emit('readiness_updated', {
      userId,
      readinessScore: user.readinessScore,
      oldReadiness
    });
  }

  // Emit a unified state update event
  eventBus.emit('state_updated', stateData);

  return stateData;
}

export default {
  getUserState,
  updateUserState
};
