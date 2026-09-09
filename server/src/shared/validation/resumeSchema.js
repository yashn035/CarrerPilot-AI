import { z } from 'zod';

export const ResumeDataSchema = z.object({
  personal: z.object({
    name: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
  }).optional(),
  summary: z.string().optional(),
  experience: z.array(z.object({
    company: z.string().optional(),
    role: z.string().optional(),
    date: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  education: z.array(z.object({
    school: z.string().optional(),
    degree: z.string().optional(),
    date: z.string().optional(),
  })).optional(),
  projects: z.array(z.object({
    title: z.string().optional(),
    date: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  skills: z.array(z.string()).optional(),
});
