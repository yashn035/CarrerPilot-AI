import { getDb, saveDb } from '../../../infrastructure/db/mongo.js';
import adminRepository from '../repository/admin.repository.js';

export async function getAdminStats() {
  const db = await adminRepository.getAdminDb();
  
  const totalUsers = db.users.length;
  const totalSubmissions = (db.submissions || []).length;
  const totalInterviews = (db.interviews || []).length;
  const totalOaSessions = (db.oaSessions || []).length;
  const revenue = totalUsers * 12.5;

  return {
    totalUsers,
    totalSubmissions,
    totalInterviews,
    totalOaSessions,
    revenue,
    aiModelCallsCount: totalSubmissions + totalInterviews + (db.atsReports || []).length,
    systemUptime: "99.98%"
  };
}

export async function getAdminUsersList() {
  const db = await adminRepository.getAdminDb();
  return db.users.map(u => ({ 
    id: u.id, 
    name: u.name, 
    email: u.email, 
    level: u.level, 
    readinessScore: u.readinessScore, 
    onboarded: u.onboarded 
  }));
}

export async function addCodingProblem({ id, title, difficulty, category, tags, description, examples, constraints }) {
  if (!id || !title || !difficulty) throw new Error("ID, Title, and Difficulty are required");

  const db = await adminRepository.getAdminDb();
  if (!db.codingProblems) db.codingProblems = [];

  const existing = db.codingProblems.find(p => p.id === id);
  if (existing) throw new Error("Problem with this ID already exists");

  const newProblem = {
    id,
    title,
    difficulty,
    category: category || "General",
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
    description: description || "",
    examples: examples || [],
    constraints: constraints || [],
    starterCode: {
      javascript: `function ${id.replace(/-([a-z])/g, (g) => g[1].toUpperCase())}() {\n  // Write your code here\n}`,
      python: `class Solution:\n    def ${id.replace(/-([a-z])/g, (g) => g[1].toUpperCase())}(self):\n        pass`
    },
    testCases: [{ input: [], output: "" }]
  };

  db.codingProblems.push(newProblem);
  await adminRepository.saveAdminDb(db);
  return newProblem;
}
