import cache from '../infrastructure/cache/redis.js';

// Default limit: 100 requests per 15 minutes per IP
export function rateLimiter(limit = 100, windowMs = 15 * 60 * 1000) {
  return async (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `ratelimit:${ip}:${req.path}`;
    const windowSeconds = Math.ceil(windowMs / 1000);
    
    try {
      const result = await cache.slidingWindowRateLimit(key, limit, windowSeconds);
      if (!result.allowed) {
        return res.status(429).json({
          message: "Too many requests from this IP, please try again later."
        });
      }
      next();
    } catch (err) {
      // Graceful fallback to continue if rate limiting cache fails
      next();
    }
  };
}
