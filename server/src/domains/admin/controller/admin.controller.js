import * as adminService from '../service/admin.service.js';

export async function handleGetStats(req, res) {
  try {
    const stats = await adminService.getAdminStats();
    return res.json(stats);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleGetUsers(req, res) {
  try {
    const users = await adminService.getAdminUsersList();
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function handleAddProblem(req, res) {
  try {
    const newProblem = await adminService.addCodingProblem(req.body);
    return res.status(201).json(newProblem);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
