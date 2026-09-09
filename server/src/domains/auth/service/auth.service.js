import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { 
  findUserByEmail, 
  createUser,
  findUserById 
} from '../repository/auth.repository.js';
import { getDb, saveDb } from '../../../infrastructure/db/mongo.js';
import { awardXp } from '../../../shared/services/xp.service.js';
import otpGenerator from 'otp-generator';
import { OTP } from '../otp.model.js';
import { sendOTP } from '../../../infrastructure/email/sender.js';
import mongoose from 'mongoose';

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || "careerpilot-super-secret-key-123456";

// In-memory fallback for OTPs when MongoDB is not connected
const localOTPs = new Map();

/**
 * Registers a new user with standard defaults and initial gamification status.
 * @param {Object} userData 
 * @returns {Promise<Object>}
 */
export async function registerUser({ name, email, password }) {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error("Email is already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: "user-" + Math.random().toString(36).substring(2, 11),
    email,
    password: hashedPassword,
    name,
    title: "New CareerPilot Student",
    targetRole: "Full-Stack Developer",
    xp: 0,
    level: 1,
    streak: 1,
    readinessScore: 35,
    streakHistory: [new Date().toISOString().split('T')[0]],
    skills: [],
    completedQuests: [],
    achievements: [],
    scores: {
      resume: 10,
      dsa: 10,
      projects: 10,
      communication: 10,
      interview: 10
    },
    onboarded: false
  };

  await createUser(newUser);

  const token = jwt.sign({ id: newUser.id }, SECRET_KEY, { expiresIn: '7d' });
  return {
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      onboarded: false
    }
  };
}

/**
 * Validates login credentials, generates OTP, and sends email.
 * @param {Object} credentials 
 * @returns {Promise<Object>}
 */
export async function initiateLogin({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  // Bypass OTP for all local testing to allow instant sign in
  const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '7d' });
  
  // Track streak
  const db = await getDb();
  const dbUser = db.users.find(u => u.id === user.id);
  const today = new Date().toISOString().split('T')[0];
  
  if (dbUser && !dbUser.streakHistory.includes(today)) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (dbUser.streakHistory.includes(yesterdayStr)) {
      dbUser.streak += 1;
    } else {
      dbUser.streak = 1;
    }
    dbUser.streakHistory.push(today);
    await saveDb(db);
  }

  return { 
    token, 
    user: { 
      id: dbUser ? dbUser.id : user.id, 
      name: dbUser ? dbUser.name : user.name, 
      email: dbUser ? dbUser.email : user.email, 
      level: dbUser ? dbUser.level : user.level, 
      xp: dbUser ? dbUser.xp : user.xp, 
      streak: dbUser ? dbUser.streak : user.streak,
      readinessScore: dbUser ? dbUser.readinessScore : user.readinessScore,
      onboarded: dbUser ? dbUser.onboarded : user.onboarded 
    } 
  };
}

/**
 * Verifies OTP and logs the user in.
 */
export async function verifyOTP({ email, otp }) {
  let isValid = false;

  if (mongoose.connection.readyState === 1) {
    const record = await OTP.findOne({ email, otp });
    if (record) {
      isValid = true;
      await OTP.deleteOne({ _id: record._id });
    }
  } else {
    if (localOTPs.get(email) === otp) {
      isValid = true;
      localOTPs.delete(email);
    }
  }

  if (!isValid) {
    throw new Error("Invalid or expired OTP");
  }

  const user = await findUserByEmail(email);
  if (!user) throw new Error("User not found");

  const db = await getDb();
  const dbUser = db.users.find(u => u.id === user.id);
  const today = new Date().toISOString().split('T')[0];
  
  if (dbUser && !dbUser.streakHistory.includes(today)) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (dbUser.streakHistory.includes(yesterdayStr)) {
      dbUser.streak += 1;
    } else {
      dbUser.streak = 1;
    }
    dbUser.streakHistory.push(today);
    await saveDb(db);
  }

  const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '7d' });
  return { 
    token, 
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      level: user.level, 
      xp: user.xp, 
      streak: user.streak,
      readinessScore: user.readinessScore,
      onboarded: user.onboarded 
    } 
  };
}

/**
 * Updates profile fields for onboarding checklist and awards XP.
 * @param {string} userId 
 * @param {Object} onboardingDetails 
 * @returns {Promise<Object>}
 */
export async function onboardUser(userId, { name, title, targetRole, skills, experienceLevel, college, branch, graduationYear }) {
  const db = await getDb();
  const user = db.users.find(u => u.id === userId);

  if (!user) {
    throw new Error("User not found");
  }

  user.name = name || user.name;
  user.title = title !== undefined ? title : (user.title || "");
  user.targetRole = targetRole || user.targetRole;
  user.college = college || user.college || "";
  user.branch = branch || user.branch || "";
  user.graduationYear = graduationYear || user.graduationYear || "";
  user.onboarded = true;
  
  if (skills && Array.isArray(skills)) {
    user.skills = skills.map(s => ({ name: s, level: 3, category: "Core" }));
  }

  user.readinessScore = 40 + Math.min((skills?.length || 0) * 5, 25);
  user.scores = {
    resume: 30,
    dsa: 25,
    projects: 30,
    communication: 20,
    interview: 20
  };

  await awardXp(userId, 100, "Completed Onboarding Setup", db);
  await saveDb(db);
  
  return user;
}

export default {
  registerUser,
  initiateLogin,
  verifyOTP,
  onboardUser
};
