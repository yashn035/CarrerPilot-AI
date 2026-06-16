import * as interviewService from '../service/interview.service.js';

export async function handleGetInterviews(req, res) {
  try {
    const list = await interviewService.getUserInterviews(req.userId);
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleStartInterview(req, res) {
  try {
    const result = await interviewService.startInterview(req.userId, req.body);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleRespondInterview(req, res) {
  const { id } = req.params;
  const { answer } = req.body;
  try {
    const result = await interviewService.respondToInterview(req.userId, id, answer);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleEndInterview(req, res) {
  const { id } = req.params;
  try {
    const result = await interviewService.endInterviewSession(req.userId, id);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
