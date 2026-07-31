import * as aiMentorService from '../service/ai-mentor.service.js';

export async function handleStartSession(req, res) {
  const { mode } = req.body;
  try {
    const session = await aiMentorService.startMentorSession(req.userId, mode || 'mentor');
    return res.status(201).json(session);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleChat(req, res) {
  // Support both new /ai-mentor/chat and legacy /mentor/chat
  const { message, sessionId, mode, chatHistory } = req.body;
  if (!message) {
    return res.status(400).json({ message: "Message query parameter is required" });
  }
  
  try {
    const result = await aiMentorService.processChat(req.userId, sessionId, message, mode);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleGetHistory(req, res) {
  try {
    const result = await aiMentorService.getHistoryAndMemory(req.userId);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleEndSession(req, res) {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ message: "Session ID is required to end session" });
  }
  
  try {
    const result = await aiMentorService.endMentorSession(req.userId, sessionId);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleGetRoadmap(req, res) {
  const { company } = req.query;
  try {
    const roadmap = await aiMentorService.generateRoadmap(req.userId, company);
    return res.json(roadmap);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleGetReadiness(req, res) {
  try {
    const readiness = await aiMentorService.predictPlacementReadiness(req.userId);
    return res.json(readiness);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleGetMissions(req, res) {
  try {
    const missions = await aiMentorService.getDailyMissions(req.userId);
    return res.json(missions);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleClaimMission(req, res) {
  const { missionId } = req.body;
  if (!missionId) {
    return res.status(400).json({ message: "Mission ID is required" });
  }
  try {
    const result = await aiMentorService.claimDailyMission(req.userId, missionId);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export default {
  handleStartSession,
  handleChat,
  handleGetHistory,
  handleEndSession,
  handleGetRoadmap,
  handleGetReadiness,
  handleGetMissions,
  handleClaimMission
};
