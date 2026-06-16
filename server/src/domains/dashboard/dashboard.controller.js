import { compileDashboardStats, generateDailyPrescription } from './service/dashboard.analytics.js';
import logger from '../../shared/logger/logger.js';

/**
 * Handles fetching general statistics and timeline feeds.
 */
export async function handleGetStats(req, res) {
  try {
    const data = await compileDashboardStats(req.userId);
    return res.json(data);
  } catch (err) {
    logger.error("Error retrieving dashboard stats:", err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * Handles retrieving the AI daily plan prescription problem.
 */
export async function handleGetDailyProblem(req, res) {
  try {
    const data = await generateDailyPrescription(req.userId);
    return res.json(data);
  } catch (err) {
    logger.error("Error retrieving AI daily prescription:", err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * Replaces and recalculates the daily problem prescription.
 */
export async function handleReplaceDailyProblem(req, res) {
  try {
    const data = await generateDailyPrescription(req.userId, true);
    return res.json(data);
  } catch (err) {
    logger.error("Error recalculating AI daily prescription:", err);
    return res.status(500).json({ message: err.message });
  }
}

export default {
  handleGetStats,
  handleGetDailyProblem,
  handleReplaceDailyProblem
};
