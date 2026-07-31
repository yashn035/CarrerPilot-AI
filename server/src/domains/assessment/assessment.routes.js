import express from 'express';
import { getNextQuestion, updateSkills } from './adaptive.engine.js';
// We'll mock the authenticateToken since we don't have the full auth middleware handy
// import { authenticateToken } from '../../middlewares/auth.js';
const authenticateToken = (req, res, next) => {
  req.userId = 'mock-user-123';
  next();
};

const router = express.Router();

// Get the next adaptive question
router.get('/next', authenticateToken, async (req, res) => {
  try {
    const { problem, topic, difficulty } = await getNextQuestion(req.userId);
    res.json({ problem, topic, difficulty });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit an answer and update skills
router.post('/submit', authenticateToken, async (req, res) => {
  const { topic, correct, timeSpent } = req.body;
  try {
    const skillDoc = await updateSkills(req.userId, topic, correct, timeSpent);
    res.json({ success: true, skill: skillDoc.skills.get(topic) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
