const requestTimestamps = new Map();

// Default limit: 100 requests per 15 minutes per IP
export function rateLimiter(limit = 100, windowMs = 15 * 60 * 1000) {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    if (!requestTimestamps.has(ip)) {
      requestTimestamps.set(ip, []);
    }
    
    let timestamps = requestTimestamps.get(ip);
    
    // Clean up timestamps outside window
    timestamps = timestamps.filter(time => now - time < windowMs);
    requestTimestamps.set(ip, timestamps);
    
    if (timestamps.length >= limit) {
      return res.status(429).json({
        message: "Too many requests from this IP, please try again later."
      });
    }
    
    timestamps.push(now);
    next();
  };
}
