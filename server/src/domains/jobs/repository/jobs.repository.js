import { getDb, saveDb } from '../../../infrastructure/db/mongo.js';

export async function getJobsList() {
  const db = await getDb();
  return db.jobs || [];
}

export async function getJobApplications(userId) {
  const db = await getDb();
  return (db.jobApplications || []).filter(a => a.userId === userId);
}

export async function getJobApplicationById(appId, userId) {
  const db = await getDb();
  return (db.jobApplications || []).find(a => a.id === appId && a.userId === userId);
}

export async function saveJobApplication(application) {
  const db = await getDb();
  if (!db.jobApplications) db.jobApplications = [];
  
  const existingIndex = db.jobApplications.findIndex(a => a.id === application.id);
  if (existingIndex !== -1) {
    db.jobApplications[existingIndex] = application;
  } else {
    db.jobApplications.push(application);
  }
  await saveDb(db);
  return application;
}

export async function deleteJobApplication(userId, appId) {
  const db = await getDb();
  if (!db.jobApplications) db.jobApplications = [];

  const initialLen = db.jobApplications.length;
  db.jobApplications = db.jobApplications.filter(a => !(a.id === appId && a.userId === userId));

  if (db.jobApplications.length === initialLen) {
    return false;
  }

  await saveDb(db);
  return true;
}

export default {
  getJobsList,
  getJobApplications,
  getJobApplicationById,
  saveJobApplication,
  deleteJobApplication
};
