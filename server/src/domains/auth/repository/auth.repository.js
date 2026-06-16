import { getDb, saveDb } from '../../../infrastructure/db/mongo.js';

export async function findUserByEmail(email) {
  const db = await getDb();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export async function createUser(user) {
  const db = await getDb();
  db.users.push(user);
  await saveDb(db);
  return user;
}

export async function findUserById(id) {
  const db = await getDb();
  return db.users.find(u => u.id === id);
}

export async function updateUser(id, updates) {
  const db = await getDb();
  const index = db.users.findIndex(u => u.id === id);
  if (index !== -1) {
    db.users[index] = { ...db.users[index], ...updates };
    await saveDb(db);
    return db.users[index];
  }
  return null;
}

export default {
  findUserByEmail,
  createUser,
  findUserById,
  updateUser
};
