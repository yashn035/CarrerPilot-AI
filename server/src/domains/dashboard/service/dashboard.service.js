import eventBus from '../../../shared/events/eventBus.js';
import logger from '../../../shared/logger/logger.js';
import { getDb, saveDb } from '../../../infrastructure/db/mongo.js';

/**
 * Initializes listeners for dashboard-specific system telemetry events.
 */
export function initDashboardListeners() {
  logger.info("Registering Dashboard Event telemetry system listeners...");

  eventBus.on('coding_submitted', async (data) => {
    logger.info("Dashboard consumed event: 'coding_submitted'", { userId: data.userId });
    await logTimelineEvent(
      data.userId, 
      "Solved DSA Problem", 
      `You solved problem "${data.problemTitle}" using ${data.language}. Result: ${data.success ? 'PASSED' : 'FAILED'}.`
    );
  });

  eventBus.on('resume_analyzed', async (data) => {
    logger.info("Dashboard consumed event: 'resume_analyzed'", { userId: data.userId });
    await logTimelineEvent(
      data.userId, 
      "Resume ATS Scan", 
      `ATS Resume optimization completed. Current score: ${data.score}/100. Grade Tier: ${data.grade}.`
    );
  });

  eventBus.on('interview_completed', async (data) => {
    logger.info("Dashboard consumed event: 'interview_completed'", { userId: data.userId });
    await logTimelineEvent(
      data.userId, 
      "Mock Interview Finished", 
      `Completed a simulated interview for ${data.company || 'Tech group'}. Score parsed at ${data.score}%.`
    );
  });

  eventBus.on('job_stage_changed', async (data) => {
    logger.info("Dashboard consumed event: 'job_stage_changed'", { userId: data.userId });
    await logTimelineEvent(
      data.userId, 
      "Job Pipeline Updated", 
      `Application tracker status for ${data.company} (${data.role}) moved to stage: "${data.stage}".`
    );
  });

  eventBus.on('project_evaluated', async (data) => {
    logger.info("Dashboard consumed event: 'project_evaluated'", { userId: data.userId });
    await logTimelineEvent(
      data.userId, 
      "Project Evaluated", 
      `Project "${data.title}" successfully indexed. Quality evaluation parsed at ${data.score || 80}/100.`
    );
  });
}

/**
 * Appends a formatted item to the user's smart activity and notifications log.
 * @param {string} userId 
 * @param {string} title 
 * @param {string} message 
 */
async function logTimelineEvent(userId, title, message) {
  try {
    const db = await getDb();
    if (!db.notifications) db.notifications = [];

    const newNotif = {
      id: "notif-" + Math.random().toString(36).substring(2, 11),
      userId,
      title,
      message,
      time: "Just now",
      createdAt: new Date().toISOString(),
      read: false
    };

    db.notifications.unshift(newNotif);

    // Keep notifications cap at 30 items per user
    const userNotifs = db.notifications.filter(n => n.userId === userId).slice(0, 30);
    const otherNotifs = db.notifications.filter(n => n.userId !== userId);
    db.notifications = [...userNotifs, ...otherNotifs];

    await saveDb(db);
    logger.info(`Recorded timeline event for user ${userId}: ${title}`);
  } catch (err) {
    logger.error("Failed to write timeline notification event:", err);
  }
}

export default {
  initDashboardListeners
};
