import { getDb, saveDb } from '../../../infrastructure/db/mongo.js';
import * as resumeParserService from '../service/resume.parser.service.js';
import * as interviewEngineService from '../service/interview.engine.service.js';
import logger from '../../../shared/logger/logger.js';

/**
 * Handles resume file uploads (sent via base64 JSON payload) or text pastes.
 */
export async function handleUploadResume(req, res) {
  const { fileName, fileData, mimeType, text } = req.body;

  try {
    let profile;
    if (text && text.trim().length > 0) {
      const buffer = Buffer.from(text, 'utf-8');
      profile = await resumeParserService.parseResume(buffer, 'text/plain');
    } else if (fileData) {
      const buffer = Buffer.from(fileData, 'base64');
      profile = await resumeParserService.parseResume(buffer, mimeType || 'application/pdf');
    } else {
      return res.status(400).json({ message: "Either resume text paste or file upload data is required." });
    }

    const db = await getDb();
    if (!db.userProfiles) db.userProfiles = [];

    // Clear old profiles
    db.userProfiles = db.userProfiles.filter(p => p.userId !== req.userId);

    const profileRecord = {
      id: "prof-" + Math.random().toString(36).substring(2, 11),
      userId: req.userId,
      ...profile,
      fileName: fileName || "Pasted text",
      createdAt: new Date().toISOString()
    };

    db.userProfiles.push(profileRecord);
    await saveDb(db);

    return res.status(201).json(profileRecord);
  } catch (err) {
    logger.error("Error handling resume parsing:", err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * Starts mock interview session.
 */
export async function handleStartInterview(req, res) {
  const { profileId, type, difficulty, company } = req.body;

  try {
    const session = await interviewEngineService.startInterview(req.userId, profileId, { type, difficulty, company });
    return res.status(201).json(session);
  } catch (err) {
    logger.error("Error starting mock interview session:", err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * Logs candidate answer turn, evaluates it, and generates next question.
 */
export async function handleSubmitAnswer(req, res) {
  const { sessionId, answer } = req.body;
  if (!sessionId || !answer) {
    return res.status(400).json({ message: "Session ID and Answer text are required parameters." });
  }

  try {
    const result = await interviewEngineService.submitAnswer(req.userId, sessionId, answer);
    return res.json(result);
  } catch (err) {
    logger.error("Error logging answer turn:", err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * Retrieves progress metrics and conversation details.
 */
export async function handleGetStatus(req, res) {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ message: "Session ID query parameter is required." });
  }

  try {
    const status = await interviewEngineService.getSessionStatus(req.userId, sessionId);
    return res.json(status);
  } catch (err) {
    logger.error("Error retrieving interview status:", err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * Ends interview session and compiles final report scorecard.
 */
export async function handleEndInterview(req, res) {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ message: "Session ID parameters are required to end sessions." });
  }

  try {
    const result = await interviewEngineService.endInterview(req.userId, sessionId);
    return res.json(result);
  } catch (err) {
    logger.error("Error ending mock session:", err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * Retrieves finalized scorecard results.
 */
export async function handleGetResult(req, res) {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ message: "Session ID query parameter is required." });
  }

  try {
    const result = await interviewEngineService.getSessionResult(req.userId, sessionId);
    return res.json(result);
  } catch (err) {
    logger.error("Error fetching results scorecard:", err);
    return res.status(500).json({ message: err.message });
  }
}

export default {
  handleUploadResume,
  handleStartInterview,
  handleSubmitAnswer,
  handleGetStatus,
  handleEndInterview,
  handleGetResult
};
