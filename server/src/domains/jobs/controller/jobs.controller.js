import * as jobsService from '../service/jobs.service.js';

export async function handleGetJobs(req, res) {
  try {
    const jobs = await jobsService.getJobsList();
    return res.json(jobs);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleGetApplications(req, res) {
  try {
    const apps = await jobsService.getJobApplications(req.userId);
    return res.json(apps);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleCreateApplication(req, res) {
  try {
    const result = await jobsService.createJobApplication(req.userId, req.body);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleUpdateApplication(req, res) {
  const { id } = req.params;
  try {
    const app = await jobsService.updateJobApplication(req.userId, id, req.body);
    return res.json({ application: app });
  } catch (err) {
    const statusCode = err.message === "Application not found" ? 404 : 500;
    return res.status(statusCode).json({ message: err.message });
  }
}

export async function handleDeleteApplication(req, res) {
  const { id } = req.params;
  try {
    await jobsService.deleteJobApplication(req.userId, id);
    return res.json({ success: true });
  } catch (err) {
    const statusCode = err.message === "Application not found" ? 404 : 500;
    return res.status(statusCode).json({ message: err.message });
  }
}
