import { getDb, saveDb } from '../../../infrastructure/db/mongo.js';

export async function getAdminDb() {
  return await getDb();
}

export async function saveAdminDb(db) {
  return await saveDb(db);
}

export default {
  getAdminDb,
  saveAdminDb
};
