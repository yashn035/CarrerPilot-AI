import mongoose from 'mongoose';

// 1. User Schema
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  title: { type: String, default: 'New CareerPilot Student' },
  targetRole: { type: String, default: 'Full-Stack Developer' },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 1 },
  readinessScore: { type: Number, default: 35 },
  streakHistory: [String],
  skills: [{
    name: String,
    level: Number,
    category: String
  }],
  completedQuests: [String],
  achievements: [String],
  scores: {
    resume: { type: Number, default: 10 },
    dsa: { type: Number, default: 10 },
    projects: { type: Number, default: 10 },
    communication: { type: Number, default: 10 },
    interview: { type: Number, default: 10 }
  },
  onboarded: { type: Boolean, default: false }
}, { timestamps: true });

// 2. Resume Schema
const ResumeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  version: { type: Number, default: 1 },
  title: { type: String, default: 'My Career Resume' },
  layout: { type: String, default: 'chronological' },
  template: { type: String, default: 'classic' },
  personalInfo: {
    name: String,
    email: String,
    phone: String,
    linkedin: String,
    github: String,
    portfolio: String
  },
  education: [{
    id: String,
    school: String,
    degree: String,
    location: String,
    date: String,
    gpa: String
  }],
  experience: [{
    id: String,
    company: String,
    role: String,
    location: String,
    date: String,
    description: String
  }],
  projects: [{
    id: String,
    title: String,
    date: String,
    technologies: String,
    description: String
  }],
  skills: [String],
  certifications: [String]
}, { timestamps: true });

// 3. ATS Report Schema
const AtsReportSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  resumeId: { type: String, required: true, index: true },
  score: Number,
  grade: String,
  sections: {
    contact: Number,
    experience: Number,
    projects: Number,
    skills: Number,
    education: Number
  },
  keywords: {
    found: [String],
    missing: [String]
  },
  grammarIssues: [{
    line: String,
    issue: String,
    suggestion: String
  }],
  suggestions: [String]
}, { timestamps: true });

// 4. Submission Schema
const SubmissionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  problemId: { type: String, required: true, index: true },
  code: String,
  language: String,
  success: Boolean,
  chosenApproach: String,
  blindMode: Boolean,
  peeksUsed: Number,
  timeSpentSeconds: Number,
  recallScore: Number,
  runtimePct: Number,
  memoryPct: Number,
  autopsy: {
    timeComplexity: String,
    spaceComplexity: String,
    risks: [String],
    tips: [String]
  },
  followUpQuestions: [String],
  followUpAnswers: [String],
  submittedAt: String
}, { timestamps: true });

// 5. Interview Schema
const InterviewSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  mode: String,
  difficulty: String,
  transcript: [{
    speaker: String,
    text: String,
    timestamp: String
  }],
  scores: {
    communication: Number,
    technical: Number,
    overall: Number
  },
  hireDecision: Boolean,
  startedAt: Date,
  completedAt: Date
}, { timestamps: true });

// 6. Quest Schema
const QuestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  title: String,
  description: String,
  xp: Number
});

// 7. Job Schema
const JobSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  company: String,
  role: String,
  requiredSkills: [String],
  salaryEstimate: String
});

// 8. XP History Schema
const XpHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  amount: Number,
  reason: String,
  timestamp: String,
  levelAfter: Number
});

// 9. Daily Problem Schema
const DailyProblemSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  problemId: String,
  date: String
});

// 10. OA Session Schema
const OaSessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  problems: [String],
  scores: [Number],
  startedAt: String,
  endedAt: String,
  completed: Boolean,
  warningCount: Number
});

// 11. Job Application Schema
const JobApplicationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  company: String,
  role: String,
  stage: String,
  salary: String,
  location: String,
  notes: String,
  reminderDate: String,
  updatedAt: String
});

// 12. Project Schema
const ProjectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  title: String,
  repoUrl: String,
  evaluatedAt: String,
  scores: {
    architecture: Number,
    codeQuality: Number,
    scalability: Number,
    placementValue: Number,
    resumeValue: Number
  },
  report: {
    strengths: [String],
    weaknesses: [String],
    recommendations: [String]
  }
});

// 13. Notification Schema
const NotificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  title: String,
  message: String,
  time: String,
  read: Boolean
});

// 14. AI Mentor Memory Schema
const AiMentorMemorySchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  targetRole: String,
  targetCompanies: [String],
  weaknesses: [String],
  strengths: [String],
  topicsDiscussed: [String],
  lastAtsScore: Number,
  lastInterviewScore: Number,
  dailyMissions: [{
    id: String,
    title: String,
    type: { type: String },
    completed: Boolean,
    claimed: Boolean,
    xpReward: Number
  }],
  updatedAt: String
});

// 15. AI Mentor Session Schema
const AiMentorSessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  mode: String,
  status: String,
  createdAt: String,
  updatedAt: String,
  messages: [{
    role: String,
    content: String,
    mode: String,
    score: Number,
    feedback: String,
    nextAction: String,
    timestamp: String
  }]
});

// Export Mongoose Models
export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const ResumeModel = mongoose.models.Resume || mongoose.model('Resume', ResumeSchema);
export const AtsReportModel = mongoose.models.AtsReport || mongoose.model('AtsReport', AtsReportSchema);
export const SubmissionModel = mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);
export const InterviewModel = mongoose.models.Interview || mongoose.model('Interview', InterviewSchema);
export const QuestModel = mongoose.models.Quest || mongoose.model('Quest', QuestSchema);
export const JobModel = mongoose.models.Job || mongoose.model('Job', JobSchema);
export const XpHistoryModel = mongoose.models.XpHistory || mongoose.model('XpHistory', XpHistorySchema);
export const DailyProblemModel = mongoose.models.DailyProblem || mongoose.model('DailyProblem', DailyProblemSchema);
export const OaSessionModel = mongoose.models.OaSession || mongoose.model('OaSession', OaSessionSchema);
export const JobApplicationModel = mongoose.models.JobApplication || mongoose.model('JobApplication', JobApplicationSchema);
export const ProjectModel = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
export const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
export const AiMentorMemoryModel = mongoose.models.AiMentorMemory || mongoose.model('AiMentorMemory', AiMentorMemorySchema);
export const AiMentorSessionModel = mongoose.models.AiMentorSession || mongoose.model('AiMentorSession', AiMentorSessionSchema);
