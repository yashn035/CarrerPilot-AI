import { registerUser, initiateLogin, verifyOTP, onboardUser } from '../service/auth.service.js';

export async function handleRegister(req, res) {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const result = await registerUser({ name, email, password });
    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function handleLogin(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const result = await initiateLogin({ email, password });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function handleVerifyOTP(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    const result = await verifyOTP({ email, otp });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function handleOnboarding(req, res) {
  try {
    const user = await onboardUser(req.userId, req.body);
    return res.json({ user });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
