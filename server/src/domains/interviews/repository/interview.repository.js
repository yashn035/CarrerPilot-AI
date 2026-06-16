import { getDb, saveDb } from '../../../infrastructure/db/mongo.js';

export async function getUserInterviews(userId) {
  const db = await getDb();
  return (db.interviews || []).filter(i => i.userId === userId);
}

export async function getInterviewById(id, userId) {
  const db = await getDb();
  return (db.interviews || []).find(i => i.id === id && i.userId === userId);
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
