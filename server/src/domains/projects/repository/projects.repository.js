import { getDb, saveDb } from '../../../infrastructure/db/mongo.js';

export async function getUserProjects(userId) {
  const db = await getDb();
  return (db.projects || []).filter(p => p.userId === userId);
}

export async function saveProject(project) {
  const db = await getDb();
  if (!db.projects) db.projects = [];
  
  const existingIndex = db.projects.findIndex(p => p.id === project.id);
  if (existingIndex !== -1) {
    db.projects[existingIndex] = project;
  } else {
    db.projects.push(project);
  }
  await saveDb(db);
  return project;
}

export default {
  getUserProjects,
  saveProject
};
