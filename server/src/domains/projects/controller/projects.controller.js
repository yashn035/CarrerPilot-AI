import * as projectsService from '../service/projects.service.js';

export async function handleGetProjects(req, res) {
  try {
    const list = await projectsService.getUserProjects(req.userId);
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleEvaluateRepo(req, res) {
  try {
    const result = await projectsService.evaluateRepo(req.userId, req.body);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}


