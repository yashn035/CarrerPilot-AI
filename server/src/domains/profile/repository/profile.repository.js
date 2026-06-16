import { getDb, saveDb } from '../../../infrastructure/db/mongo.js';

export async function getUserById(userId) {
  const db = await getDb();
  return db.users.find(u => u.id === userId);
}

export async function getQuestById(questId) {
  const db = await getDb();
  return db.quests.find(q => q.id === questId);
}

export default {
  getUserById,
  getQuestById
};
