import * as codingService from '../service/coding.service.js';
import logger from '../../../shared/logger/logger.js';

export async function handleGetProblems(req, res) {
  try {
    const filters = req.query || {};
    const problems = await codingService.getProblems(filters);
    return res.status(200).json(problems);
  } catch (err) {
    logger.error('Error fetching problems:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch problems' });
  }
}

export async function handleGetProblemById(req, res) {
  try {
    const { id } = req.params;
    const problem = await codingService.getProblemById(id);
    return res.status(200).json(problem);
  } catch (err) {
    return res.status(404).json({ message: err.message || 'Problem not found' });
  }
}

export async function handleRunCode(req, res) {
  try {
    const userId = req.user?.id || 'demo-user-123';
    const { id } = req.params;
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ message: 'Code and language parameters are required' });
    }

    const result = await codingService.runCode(userId, id, code, language);
    return res.status(200).json(result);
  } catch (err) {
    logger.error('Error running code:', err);
    return res.status(500).json({ message: err.message || 'Code execution failed' });
  }
}

export async function handleSubmitSolution(req, res) {
  try {
    const userId = req.user?.id || 'demo-user-123';
    const id = req.params.id || req.body.problemId;
    const { code, language } = req.body;

    if (!id || !code || !language) {
      return res.status(400).json({ message: 'problemId, code, and language are required' });
    }

    const result = await codingService.submitCode(userId, id, code, language);
    return res.status(200).json(result);
  } catch (err) {
    logger.error('Error submitting code:', err);
    return res.status(500).json({ message: err.message || 'Submission failed' });
  }
}

export async function handleGetUserProgress(req, res) {
  try {
    const userId = req.user?.id || 'demo-user-123';
    const progress = await codingService.getUserProgressSummary(userId);
    return res.status(200).json(progress);
  } catch (err) {
    logger.error('Error fetching progress:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch progress' });
  }
}

export async function handleGetCompanyTracks(req, res) {
  try {
    const tracks = codingService.getCompanyTracks();
    return res.status(200).json(tracks);
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to fetch company tracks' });
  }
}
