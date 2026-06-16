import * as profileService from '../service/profile.service.js';

export async function handleGetProfile(req, res) {
  try {
    const user = await profileService.getUserProfile(req.userId);
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleClaimQuest(req, res) {
  const { questId } = req.body;
  if (!questId) {
    return res.status(400).json({ message: "Quest ID is required" });
  }
  try {
    const result = await profileService.claimQuestReward(req.userId, questId);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function handleMentorChat(req, res) {
  const { message, chatHistory } = req.body;
  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }
  try {
    const result = await profileService.getMentorResponse(req.userId, message, chatHistory);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
