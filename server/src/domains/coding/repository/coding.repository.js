import fs from 'fs';
import { getDb, saveDb } from '../../../infrastructure/db/mongo.js';
import { COMPANY_TRACKS_PATH } from '../../../infrastructure/db/paths.js';
import logger from '../../../shared/logger/logger.js';

let _companyTracksData = null;

export function getCompanyTracks() {
  if (!_companyTracksData) {
    try {
      const content = fs.readFileSync(COMPANY_TRACKS_PATH, 'utf8');
      _companyTracksData = JSON.parse(content);
    } catch (e) {
      logger.error('Failed to load company_tracks.json:', e.message);
      _companyTracksData = { companyMeta: {}, companyQuestions: {} };
    }
  }
  return _companyTracksData;
}

export async function getProblemsList() {
  const db = await getDb();
  return db.codingProblems || [];
}

export async function getProblemById(id) {
  const db = await getDb();
  return db.codingProblems.find(p => p.id === id);
}

export async function getSubmissions(userId) {
  const db = await getDb();
  return (db.submissions || []).filter(s => s.userId === userId);
}

export async function saveSubmission(submission) {
  const db = await getDb();
  if (!db.submissions) db.submissions = [];
  db.submissions.push(submission);
  await saveDb(db);
  return submission;
}

export async function updateSubmission(submissionId, updates) {
  const db = await getDb();
  const index = (db.submissions || []).findIndex(s => s.id === submissionId);
  if (index !== -1) {
    db.submissions[index] = { ...db.submissions[index], ...updates };
    await saveDb(db);
    return db.submissions[index];
  }
  return null;
}

export async function saveOaSession(session) {
  const db = await getDb();
  if (!db.oaSessions) db.oaSessions = [];
  
  const existingIndex = db.oaSessions.findIndex(s => s.id === session.id);
  if (existingIndex !== -1) {
    db.oaSessions[existingIndex] = session;
  } else {
    db.oaSessions.push(session);
  }
  await saveDb(db);
  return session;
}

export async function getOaSessionById(userId, sessionId) {
  const db = await getDb();
  return (db.oaSessions || []).find(s => s.id === sessionId && s.userId === userId);
}

export default {
  getCompanyTracks,
  getProblemsList,
  getProblemById,
  getSubmissions,
  saveSubmission,
  updateSubmission,
  saveOaSession,
  getOaSessionById
};
