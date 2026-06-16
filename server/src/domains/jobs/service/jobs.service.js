import { getDb, saveDb } from '../../../infrastructure/db/mongo.js';
import { awardXp } from '../../../shared/services/xp.service.js';
import { updateUserState } from '../../../shared/state/user.state.js';
import eventBus from '../../../shared/events/eventBus.js';
import jobsRepository from '../repository/jobs.repository.js';

/**
 * Retrieves general job search listings.
 */
export async function getJobsList() {
  return await jobsRepository.getJobsList();
}

/**
 * Gets candidate's application backlog tracker stages.
 */
export async function getJobApplications(userId) {
  return await jobsRepository.getJobApplications(userId);
}

/**
 * Appends a new application entry to tracker, awards XP, and publishes events.
 */
export async function createJobApplication(userId, { company, role, stage, salary, location, notes, reminderDate }) {
  if (!company || !role) throw new Error("Company and Role are required");

  const newApp = {
    id: "app-" + Math.random().toString(36).substring(2, 11),
    userId,
    company,
    role,
    stage: stage || "Applied",
    salary: salary || "",
    location: location || "",
    notes: notes || "",
    reminderDate: reminderDate || "",
    updatedAt: new Date().toISOString()
  };

  await jobsRepository.saveJobApplication(newApp);

  const db = await getDb();
  const user = db.users.find(u => u.id === userId);
  let leveledUp = false;

  if (user) {
    const reward = await awardXp(userId, 20, `Created application for ${company}`, db);
    leveledUp = reward?.leveledUp || false;
    await saveDb(db);
    
    // Sync state
    await updateUserState(userId, { xp: user.xp, level: user.level });
  }

  // Publish to Event Bus
  eventBus.emit('job_stage_changed', {
    userId,
    company,
    role,
    stage: newApp.stage
  });

  return { application: newApp, leveledUp };
}

/**
 * Updates application tracker stage.
 */
export async function updateJobApplication(userId, appId, { stage, salary, location, notes, reminderDate }) {
  const app = await jobsRepository.getJobApplicationById(appId, userId);
  if (!app) throw new Error("Application not found");

  const updatedApp = {
    ...app,
    stage: stage || app.stage,
    salary: salary !== undefined ? salary : app.salary,
    location: location !== undefined ? location : app.location,
    notes: notes !== undefined ? notes : app.notes,
    reminderDate: reminderDate !== undefined ? reminderDate : app.reminderDate,
    updatedAt: new Date().toISOString()
  };

  await jobsRepository.saveJobApplication(updatedApp);

  // Publish stage changed event if changed
  if (stage && stage !== app.stage) {
    eventBus.emit('job_stage_changed', {
      userId,
      company: app.company,
      role: app.role,
      stage
    });
  }

  return updatedApp;
}

/**
 * Deletes application.
 */
export async function deleteJobApplication(userId, appId) {
  const success = await jobsRepository.deleteJobApplication(userId, appId);
  if (!success) {
    throw new Error("Application not found");
  }
  return true;
}
