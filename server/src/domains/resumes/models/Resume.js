import mongoose from 'mongoose';

const EducationSchema = new mongoose.Schema({
  id: { type: String, required: true },
  institution: { type: String, default: '' },
  degree: { type: String, default: '' },
  fieldOfStudy: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  gpa: { type: String, default: '' },
  description: { type: String, default: '' }
}, { _id: false });

const ExperienceSchema = new mongoose.Schema({
  id: { type: String, required: true },
  company: { type: String, default: '' },
  position: { type: String, default: '' },
  location: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  current: { type: Boolean, default: false },
  bullets: [{ type: String }]
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  link: { type: String, default: '' },
  technologies: [{ type: String }],
  bullets: [{ type: String }]
}, { _id: false });

const CertificationSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, default: '' },
  issuer: { type: String, default: '' },
  date: { type: String, default: '' },
  url: { type: String, default: '' }
}, { _id: false });

const AchievementSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  date: { type: String, default: '' }
}, { _id: false });

const ResumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'Untitled Resume'
  },
  targetRole: {
    type: String,
    default: 'Software Engineer'
  },
  templateId: {
    type: String,
    enum: ['modern', 'professional', 'minimal', 'creative'],
    default: 'modern'
  },
  personalInfo: {
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    portfolio: { type: String, default: '' }
  },
  summary: {
    type: String,
    default: ''
  },
  education: [EducationSchema],
  experience: [ExperienceSchema],
  projects: [ProjectSchema],
  skills: {
    technical: [{ type: String }],
    frameworks: [{ type: String }],
    tools: [{ type: String }],
    soft: [{ type: String }]
  },
  certifications: [CertificationSchema],
  achievements: [AchievementSchema]
}, {
  timestamps: true
});

export const Resume = mongoose.models.Resume || mongoose.model('Resume', ResumeSchema);
export default Resume;
