import * as codingService from '../service/coding.service.js';

export async function handleGetProblems(req, res) {
  try {
    const problems = await codingService.getProblems(req.query);
    return res.json(problems);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleGetProblemById(req, res) {
  const { id } = req.params;
  try {
    const problem = await codingService.getProblemById(id);
    return res.json(problem);
  } catch (err) {
    const statusCode = err.message === 'Problem not found' ? 404 : 500;
    return res.status(statusCode).json({ message: err.message });
  }
}

export async function handleGetApproaches(req, res) {
  const { id } = req.params;
  try {
    const approaches = await codingService.getProblemApproaches(id);
    return res.json(approaches);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleGetDailyPrescription(req, res) {
  try {
    const result = await codingService.getDailyPrescriptionFromService(req.userId);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleReplaceDaily(req, res) {
  try {
    const result = await codingService.replaceDailyProblem(req.userId);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleSubmitSolution(req, res) {
  try {
    const payload = { ...req.body };
    if (req.params.id && !payload.problemId) {
      payload.problemId = req.params.id;
    }
    const result = await codingService.submitProblemSolution(req.userId, payload);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleGetHistory(req, res) {
  try {
    const history = await codingService.getSolvingHistory(req.userId);
    return res.json(history);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleSaveFollowUps(req, res) {
  const targetId = req.params.id || req.body.submissionId;
  const { answers } = req.body;
  try {
    const result = await codingService.saveFollowUpAnswers(req.userId, targetId, answers);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// OA Handlers
export async function handleStartOa(req, res) {
  try {
    const session = await codingService.startOaSession(req.userId);
    return res.json(session);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleSubmitOaProblem(req, res) {
  try {
    const runResult = await codingService.submitOaProblem(req.userId, req.body);
    return res.json({ runResult });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleEndOa(req, res) {
  const { sessionId } = req.body;
  try {
    const result = await codingService.endOaSession(req.userId, sessionId);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Company Tracks Handlers
export async function handleGetCompanyTracks(req, res) {
  try {
    const list = codingService.getCompanyTracksList();
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleGetCompanyMeta(req, res) {
  try {
    const companyName = decodeURIComponent(req.params.company);
    const meta = codingService.getCompanyMeta(companyName);
    return res.json(meta);
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
}

export async function handleGetCompanyQuestions(req, res) {
  try {
    const companyName = decodeURIComponent(req.params.company);
    const questions = codingService.getCompanyQuestions(companyName, req.query);
    return res.json(questions);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleGetCompanyAnalytics(req, res) {
  try {
    const companyName = decodeURIComponent(req.params.company);
    const analytics = await codingService.getCompanyAnalytics(req.userId, companyName);
    return res.json(analytics);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleGetCompanyAiGuide(req, res) {
  try {
    const companyName = decodeURIComponent(req.params.company);
    const guideText = await codingService.getCompanyAiGuide(companyName);
    return res.json({ guide: guideText });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
