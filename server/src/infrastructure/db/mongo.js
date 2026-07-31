import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import logger from '../../shared/logger/logger.js';
import { 
  DB_DIR, 
  DB_PATH, 
  PROBLEMS_BANK_PATH 
} from './paths.js';
import {
  UserModel, ResumeModel, AtsReportModel, SubmissionModel, InterviewModel,
  QuestModel, JobModel, XpHistoryModel, DailyProblemModel, OaSessionModel,
  JobApplicationModel, ProjectModel, NotificationModel, AiMentorMemoryModel,
  AiMentorSessionModel
} from './models.js';

const MODEL_MAPPING = {
  users: UserModel,
  resumes: ResumeModel,
  atsReports: AtsReportModel,
  submissions: SubmissionModel,
  interviews: InterviewModel,
  quests: QuestModel,
  jobs: JobModel,
  xpHistory: XpHistoryModel,
  dailyProblems: DailyProblemModel,
  oaSessions: OaSessionModel,
  jobApplications: JobApplicationModel,
  projects: ProjectModel,
  notifications: NotificationModel,
  aiMentorMemory: AiMentorMemoryModel,
  aiMentorSessions: AiMentorSessionModel
};

const COLLECTIONS = [
  'users',
  'resumes',
  'atsReports',
  'submissions',
  'interviews',
  'quests',
  'jobs',
  'xpHistory',
  'dailyProblems',
  'oaSessions',
  'jobApplications',
  'projects',
  'notifications',
  'aiMentorSessions',
  'aiMentorMemory',
  'userProfiles',
  'interviewSessions',
  'interviewQuestions',
  'interviewResults',
  'resumeUploads'
];

const datastoreSchema = new mongoose.Schema({
  key: { type: String, default: 'main' },
  data: Object
}, { minimize: false, timestamps: true });

let DatastoreModel;
try {
  DatastoreModel = mongoose.model('Datastore');
} catch {
  DatastoreModel = mongoose.model('Datastore', datastoreSchema);
}

let isMongoConnected = false;
let connectionPromise = null;

async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return false;
  
  if (mongoose.connection.readyState === 1) {
    isMongoConnected = true;
    return true;
  }
  
  if (mongoose.connection.readyState === 2) {
    if (connectionPromise) {
      try {
        await connectionPromise;
        isMongoConnected = mongoose.connection.readyState === 1;
        return isMongoConnected;
      } catch {
        return false;
      }
    }
  }

  try {
    mongoose.set('bufferCommands', false);
    connectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    await connectionPromise;
    isMongoConnected = true;
    logger.info("Successfully connected to cloud MongoDB Atlas database.");
    
    try {
      const { ensureIndexes } = await import('./indexes.js');
      await ensureIndexes(mongoose);
    } catch (indexErr) {
      logger.error("Failed to run index checks:", indexErr);
    }

    // Seed empty collections with DEFAULT_DATA
    try {
      const userCount = await UserModel.countDocuments();
      if (userCount === 0) {
        logger.info("MongoDB collections empty. Seeding initial normalized data...");
        await Promise.all(
          Object.entries(MODEL_MAPPING).map(async ([key, model]) => {
            const dataArray = DEFAULT_DATA[key] || [];
            if (dataArray.length > 0) {
              await model.insertMany(dataArray);
            }
          })
        );
        logger.info("Successfully seeded all normalized collections in MongoDB Atlas.");
      }
    } catch (seedErr) {
      logger.error("Failed to seed MongoDB collections:", seedErr);
    }
    
    return true;
  } catch (err) {
    logger.warn("Failed to connect to cloud MongoDB Atlas. Falling back to local JSON datastore.", { error: err.message });
    isMongoConnected = false;
    connectionPromise = null;
    return false;
  }
}

const DEFAULT_DATA = {
  users: [
    {
      id: "demo-user-123",
      email: "demouser@careerpilot.ai",
      password: "$2a$10$Kn43zioJydoEVx1bSEGgNuRZe9uGsuvg2DfpzhcTnLW8IHnA2fyP.",
      name: "Alex Mercer",
      title: "Aspiring Full-Stack Developer",
      targetRole: "Frontend Engineer",
      xp: 450,
      level: 3,
      streak: 5,
      readinessScore: 68,
      streakHistory: ["2026-06-06", "2026-06-07", "2026-06-08", "2026-06-09", "2026-06-10"],
      skills: [
        { name: "React", level: 4, category: "Frontend" },
        { name: "JavaScript", level: 4, category: "Frontend" },
        { name: "HTML5/CSS3", level: 5, category: "Frontend" },
        { name: "Node.js", level: 3, category: "Backend" },
        { name: "Express", level: 3, category: "Backend" },
        { name: "Git", level: 4, category: "Tools" }
      ],
      completedQuests: ["first-login"],
      achievements: ["ats-builder"],
      scores: {
        resume: 72,
        dsa: 65,
        projects: 70,
        communication: 60,
        interview: 65
      },
      onboarded: true
    }
  ],
  resumes: [
    {
      id: "res-1",
      userId: "demo-user-123",
      version: 1,
      title: "Full Stack Developer Resume v1",
      updatedAt: "2026-06-09T18:30:00.000Z",
      personalInfo: {
        name: "Alex Mercer",
        email: "alex.mercer@gmail.com",
        phone: "+1 (555) 019-2834",
        linkedin: "linkedin.com/in/alexmercer",
        github: "github.com/alexmercer",
        portfolio: "alexmercer.dev"
      },
      education: [
        {
          id: "edu-1",
          school: "Tech Institute of Technology",
          degree: "B.S. in Computer Science",
          location: "San Francisco, CA",
          date: "2022 - 2026",
          gpa: "3.8/4.0"
        }
      ],
      experience: [
        {
          id: "exp-1",
          company: "ByteCraft Solutions",
          role: "Frontend Developer Intern",
          location: "Remote",
          date: "Summer 2025",
          description: "Worked in a team to build UI elements.\nFixed responsiveness bugs across 15+ pages.\nCollaborated on REST API integration using React."
        }
      ],
      projects: [
        {
          id: "proj-1",
          title: "DevRank - Developer Portfolio Engine",
          date: "Fall 2025",
          technologies: "React, Express, Tailwind CSS",
          description: "Created an open-source tool for developer statistics.\nIntegrated GitHub GraphQL API to fetch user profile data.\nBuilt dynamic charts and graphs displaying language distributions."
        }
      ],
      skills: ["React", "JavaScript", "HTML5", "CSS3", "Node.js", "Express", "Tailwind CSS", "Git"],
      certifications: ["AWS Certified Cloud Practitioner", "Meta Front-End Developer Certificate"]
    }
  ],
  atsReports: [
    {
      id: "report-1",
      resumeId: "res-1",
      score: 72,
      grade: "B",
      sections: {
        contact: 100,
        experience: 65,
        projects: 70,
        skills: 80,
        education: 90
      },
      keywords: {
        found: ["React", "JavaScript", "Node.js", "Express", "Git", "Tailwind CSS"],
        missing: ["Redux", "TypeScript", "Docker", "REST APIs", "Unit Testing"]
      },
      grammarIssues: [
        { line: "Fixed responsiveness bugs", issue: "Passive tone. Suggest starting with action verbs like 'Resolved' or 'Engineered'.", suggestion: "Resolved 15+ complex responsive styling anomalies across core dashboards." }
      ],
      suggestions: [
        "Include more concrete metrics in experience descriptions (e.g., 'improved performance by 15%').",
        "Add TypeScript to your projects section to show type-safety proficiency.",
        "Add Docker and REST APIs as keywords to rank higher for Full Stack roles.",
        "Rewrite experience bullets to follow the Action + Context + Metric format."
      ]
    }
  ],
  codingProblems: [
    {
      id: "two-sum",
      title: "Two Sum",
      difficulty: "Easy",
      category: "Arrays",
      tags: ["Arrays", "Hash Table"],
      description: "Given an array of integers `nums` and an integer `target`, return *indices of the two numbers such that they add up to `target`*.\n\nYou may assume that each input would have ***exactly* one solution**, and you may not use the *same* element twice.\n\nYou can return the answer in any order.",
      examples: [
        {
          input: "nums = [2,7,11,15], target = 9",
          output: "[0,1]",
          explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
        },
        {
          input: "nums = [3,2,4], target = 6",
          output: "[1,2]"
        }
      ],
      constraints: [
        "`2 <= nums.length <= 10^4`",
        "`-10^9 <= nums[i] <= 10^9`",
        "`-10^9 <= target <= 10^9`",
        "**Only one valid answer exists.**"
      ],
      starterCode: {
        javascript: "function twoSum(nums, target) {\n  // Write your code here\n  \n}",
        python: "class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass",
        cpp: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};"
      },
      testCases: [
        { input: [[2, 7, 11, 15], 9], output: [0, 1] },
        { input: [[3, 2, 4], 6], output: [1, 2] },
        { input: [[3, 3], 6], output: [0, 1] }
      ]
    },
    {
      id: "valid-parentheses",
      title: "Valid Parentheses",
      difficulty: "Easy",
      category: "Strings",
      tags: ["Stack", "Strings"],
      description: "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
      examples: [
        {
          input: "s = \"()\"",
          output: "true"
        },
        {
          input: "s = \"()[]{}\"",
          output: "true"
        },
        {
          input: "s = \"(]\"",
          output: "false"
        }
      ],
      constraints: [
        "`1 <= s.length <= 10^4`",
        "`s` consists of parentheses only `'()[]{}'`."
      ],
      starterCode: {
        javascript: "function isValid(s) {\n  // Write your code here\n  \n}",
        python: "class Solution:\n    def isValid(self, s: str) -> bool:\n        pass",
        cpp: "class Solution {\npublic:\n    bool isValid(string s) {\n        \n    }\n};"
      },
      testCases: [
        { input: ["()"], output: true },
        { input: ["()[]{}"], output: true },
        { input: ["(]"], output: false },
        { input: ["([)]"], output: false },
        { input: ["{[]}"], output: true }
      ]
    },
    {
      id: "merge-intervals",
      title: "Merge Intervals",
      difficulty: "Medium",
      category: "Arrays",
      tags: ["Arrays", "Sorting"],
      description: "Given an array of `intervals` where `intervals[i] = [starti, endi]`, merge all overlapping intervals, and return *an array of the non-overlapping intervals that cover all the intervals in the input*.",
      examples: [
        {
          input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
          output: "[[1,6],[8,10],[15,18]]",
          explanation: "Since intervals [1,3] and [2,6] overlap, merge them into [1,6]."
        }
      ],
      constraints: [
        "`1 <= intervals.length <= 10^4`",
        "`intervals[i].length == 2`",
        "`0 <= starti <= endi <= 10^4`"
      ],
      starterCode: {
        javascript: "function merge(intervals) {\n  // Write your code here\n  \n}",
        python: "class Solution:\n    def merge(self, intervals: List[List[int]]) -> List[List[int]]:\n        pass"
      },
      testCases: [
        { input: [[[1, 3], [2, 6], [8, 10], [15, 18]]], output: [[1, 6], [8, 10], [15, 18]] },
        { input: [[[1, 4], [4, 5]]], output: [[1, 5]] }
      ]
    }
  ],
  submissions: [],
  interviews: [],
  quests: [
    { id: "first-login", title: "Welcome Pilot", description: "Successfully log in and setup your profile.", xp: 100 },
    { id: "ats-analyzer", title: "ATS Checkup", description: "Analyze your resume with the AI Resume Analyzer.", xp: 150 },
    { id: "solve-dsa", title: "Code Warrior", description: "Solve at least one DSA problem in the Coding Arena.", xp: 200 },
    { id: "mock-interview", title: "Ready for Action", description: "Complete a full AI Mock Interview session.", xp: 300 },
    { id: "run-simulation", title: "Future Seer", description: "Run a skill simulation in the Career Simulation Engine.", xp: 100 }
  ],
  jobs: [
    {
      id: "job-1",
      company: "Google",
      role: "Frontend Engineer",
      requiredSkills: ["React", "JavaScript", "TypeScript", "HTML5/CSS3", "Git", "System Design"],
      salaryEstimate: "$120,000 - $160,000"
    },
    {
      id: "job-2",
      company: "Stripe",
      role: "Full Stack Engineer",
      requiredSkills: ["Ruby", "Node.js", "React", "TypeScript", "Docker", "REST APIs", "PostgreSQL"],
      salaryEstimate: "$130,000 - $175,000"
    },
    {
      id: "job-3",
      company: "Amazon",
      role: "Software Development Engineer (SDE I)",
      requiredSkills: ["Java", "C++", "DSA", "AWS", "Git", "Unit Testing"],
      salaryEstimate: "$110,000 - $145,000"
    }
  ],
  jobApplications: [
    {
      id: "app-1",
      userId: "demo-user-123",
      company: "Google",
      role: "Frontend Engineer",
      stage: "Interview",
      salary: "$140,000",
      location: "Mountain View, CA (Hybrid)",
      notes: "Prepared System Design. Coding session scheduled on 15th June.",
      reminderDate: "2026-06-15",
      updatedAt: "2026-06-10T12:00:00.000Z"
    },
    {
      id: "app-2",
      userId: "demo-user-123",
      company: "Stripe",
      role: "Full Stack Engineer",
      stage: "Applied",
      salary: "$150,000",
      location: "San Francisco, CA (Remote)",
      notes: "Submitted application through referral. Awaiting response.",
      reminderDate: "",
      updatedAt: "2026-06-09T18:00:00.000Z"
    }
  ],
  projects: [
    {
      id: "proj-eval-1",
      userId: "demo-user-123",
      title: "DevRank - Developer Portfolio Engine",
      repoUrl: "https://github.com/alexmercer/devrank",
      evaluatedAt: "2026-06-09T19:00:00.000Z",
      scores: {
        architecture: 75,
        codeQuality: 80,
        scalability: 70,
        placementValue: 85,
        resumeValue: 80
      },
      report: {
        strengths: ["Clear layered architecture", "Good usage of environment variables", "Integrated test suites check"],
        weaknesses: ["Hardcoded secrets in package configurations", "Lacks detailed README instructions"],
        recommendations: ["Migrate config keys to secret manager", "Setup automated Jest validation workflows"]
      }
    }
  ],
  notifications: [
    { id: "notif-1", userId: "demo-user-123", title: "Welcome Pilot", message: "Successfully log in and setup your profile.", time: "1 hour ago", read: false },
    { id: "notif-2", userId: "demo-user-123", title: "ATS Checkup complete", message: "AI Resume Analyzer recommendation computed.", time: "2 hours ago", read: true }
  ],
  aiMentorMemory: [
    {
      userId: "demo-user-123",
      targetRole: "Frontend Engineer",
      targetCompanies: ["Google", "Amazon", "Stripe"],
      weaknesses: ["Dynamic Programming", "Recursion", "System Design"],
      strengths: ["React", "JavaScript", "CSS3"],
      topicsDiscussed: ["arrays", "react", "caching"],
      lastAtsScore: 72,
      lastInterviewScore: 65,
      dailyMissions: [
        { id: "mission-dsa", title: "Solve 1 Array or String problem in Coding Arena", type: "dsa", completed: false, claimed: false, xpReward: 50 },
        { id: "mission-resume", title: "Optimize 1 bullet point or scan resume", type: "resume", completed: false, claimed: false, xpReward: 50 },
        { id: "mission-mock", title: "Run 1 Mock Interview in interview mode", type: "interview", completed: false, claimed: false, xpReward: 50 }
      ],
      updatedAt: "2026-06-16T11:00:00.000Z"
    }
  ],
  aiMentorSessions: []
};

export async function initDb() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });

    let oldDbData = null;
    try {
      await fs.access(DB_PATH);
      const content = await fs.readFile(DB_PATH, 'utf-8');
      oldDbData = JSON.parse(content);
      logger.info("Found legacy db.json file. Migrating to file folder structure...");
    } catch {}

    for (const collection of COLLECTIONS) {
      const filePath = path.join(DB_DIR, `${collection}.json`);
      try {
        await fs.access(filePath);
      } catch {
        let initialData = [];
        if (oldDbData && oldDbData[collection]) {
          initialData = oldDbData[collection];
        } else if (DEFAULT_DATA[collection]) {
          initialData = DEFAULT_DATA[collection];
        }
        await fs.writeFile(filePath, JSON.stringify(initialData, null, 2), 'utf-8');
        logger.info(`Database collection file initialized: ${collection}.json`);
      }
    }

    if (oldDbData) {
      const backupPath = path.join(path.dirname(DB_PATH), 'db.json.bak');
      try {
        await fs.rename(DB_PATH, backupPath);
        logger.info(`Legacy db.json migrated and renamed to db.json.bak`);
      } catch (err) {
        logger.error("Failed to rename legacy db.json to db.json.bak:", err);
      }
    }
  } catch (err) {
    logger.error("Database initialization error:", err);
  }

  await connectMongo();
}

let cachedProblems = null;

export async function getProblemsBank() {
  if (cachedProblems) return cachedProblems;
  try {
    const data = await fs.readFile(PROBLEMS_BANK_PATH, 'utf-8');
    cachedProblems = JSON.parse(data);
    return cachedProblems;
  } catch (err) {
    logger.error("Failed to read problems bank from disk, using defaults:", err);
    return DEFAULT_DATA.codingProblems || [];
  }
}

export async function getDb() {
  let dbData = null;
  const mongoConnected = await connectMongo();
  if (mongoConnected) {
    try {
      dbData = {};
      const entries = Object.entries(MODEL_MAPPING);
      const results = await Promise.all(
        entries.map(([_, model]) => model.find({}).lean())
      );
      entries.forEach(([key, _], idx) => {
        dbData[key] = results[idx];
      });
    } catch (err) {
      logger.error("Error reading from MongoDB normalized collections, falling back to local files:", err);
      dbData = null;
    }
  }

  if (!dbData) {
    try {
      dbData = {};
      for (const collection of COLLECTIONS) {
        const filePath = path.join(DB_DIR, `${collection}.json`);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          dbData[collection] = JSON.parse(content);
        } catch {
          dbData[collection] = DEFAULT_DATA[collection] || [];
        }
      }
    } catch (err) {
      logger.error("Failed to read from database folder, initializing defaults:", err);
      dbData = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  }

  const problems = await getProblemsBank();
  if (problems && problems.length > 0) {
    dbData.codingProblems = problems;
  }

  return dbData;
}

export async function saveDb(data) {
  const { codingProblems, ...strippedData } = data;

  const mongoConnected = await connectMongo();
  if (mongoConnected) {
    try {
      await Promise.all(
        Object.entries(MODEL_MAPPING).map(async ([key, model]) => {
          const collectionData = strippedData[key] || [];
          
          let identifierField = 'id';
          if (key === 'aiMentorMemory' || key === 'dailyProblems') {
            identifierField = 'userId';
          } else if (key === 'xpHistory') {
            await model.deleteMany({});
            if (collectionData.length > 0) {
              await model.insertMany(collectionData);
            }
            return;
          }

          const bulkOps = collectionData.map(item => ({
            updateOne: {
              filter: { [identifierField]: item[identifierField] },
              update: { $set: item },
              upsert: true
            }
          }));

          if (bulkOps.length > 0) {
            await model.bulkWrite(bulkOps);
          }

          const currentIds = collectionData.map(item => item[identifierField]);
          await model.deleteMany({ [identifierField]: { $nin: currentIds } });
        })
      );
    } catch (err) {
      logger.error("Error saving normalized collections to MongoDB:", err);
    }
  }

  try {
    for (const collection of COLLECTIONS) {
      const filePath = path.join(DB_DIR, `${collection}.json`);
      const collectionData = strippedData[collection] || [];
      await fs.writeFile(filePath, JSON.stringify(collectionData, null, 2), 'utf-8');
    }
    return true;
  } catch (err) {
    logger.error("Database write error:", err);
    return false;
  }
}

export async function findUserByEmail(email) {
  const db = await getDb();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export async function findUserById(id) {
  const db = await getDb();
  return db.users.find(u => u.id === id);
}

export async function createUser(user) {
  const db = await getDb();
  db.users.push(user);
  await saveDb(db);
  return user;
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
