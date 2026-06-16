import { getDb, saveDb } from '../../../infrastructure/db/mongo.js';

export async function getUserResumes(userId) {
  const db = await getDb();
  return db.resumes.filter(r => r.userId === userId);
}

export async function getResumeById(resumeId, userId) {
  const db = await getDb();
  return db.resumes.find(r => r.id === resumeId && r.userId === userId);
}

export async function createResume(userId, resume) {
  const db = await getDb();
  db.resumes.push(resume);
  await saveDb(db);
  return resume;
}

export async function updateResume(userId, resumeId, updatedResume) {
  const db = await getDb();
  const index = db.resumes.findIndex(r => r.id === resumeId && r.userId === userId);
  if (index !== -1) {
    db.resumes[index] = updatedResume;
    await saveDb(db);
    return updatedResume;
  }
  return null;
}

export async function getAtsReport(userId, resumeId) {
  const db = await getDb();
  return db.atsReports.find(r => r.resumeId === resumeId && r.userId === userId);
}

export async function saveAtsReport(report) {
  const db = await getDb();
  db.atsReports = db.atsReports.filter(r => r.resumeId !== report.resumeId);
  db.atsReports.push(report);
  await saveDb(db);
  return report;
}

export default {
  getUserResumes,
  getResumeById,
  createResume,
  updateResume,
  getAtsReport,
  saveAtsReport
};
