import * as oaService from '../services/oa.service.js';
import logger from '../../../shared/logger/logger.js';

export async function handleStartOa(req, res) {
  try {
    const userId = req.user?.id || 'demo-user-123';
    const { company } = req.body || {};
    const session = await oaService.startOASession(userId, company);
    return res.status(201).json(session);
  } catch (err) {
    logger.error('Error starting OA session:', err);
    return res.status(500).json({ message: err.message || 'Failed to start OA session' });
  }
}

export async function handleSubmitOaAnswer(req, res) {
  try {
    const userId = req.user?.id || 'demo-user-123';
    const { sessionId, problemId, code, language } = req.body;
    if (!sessionId || !problemId) {
      return res.status(400).json({ message: 'sessionId and problemId are required' });
    }
    const session = await oaService.submitOAAnswer(userId, sessionId, problemId, code, language);
    return res.status(200).json(session);
  } catch (err) {
    logger.error('Error submitting OA answer:', err);
    return res.status(500).json({ message: err.message || 'Failed to save OA answer' });
  }
}

export async function handleRecordWarning(req, res) {
  try {
    const userId = req.user?.id || 'demo-user-123';
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }
    const session = await oaService.recordOAWarning(userId, sessionId);
    return res.status(200).json(session);
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to record warning' });
  }
}

export async function handleEndOa(req, res) {
  try {
    const userId = req.user?.id || 'demo-user-123';
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }
    const result = await oaService.endOASession(userId, sessionId);
    return res.status(200).json(result);
  } catch (err) {
    logger.error('Error ending OA session:', err);
    return res.status(500).json({ message: err.message || 'Failed to finish OA session' });
  }
}
