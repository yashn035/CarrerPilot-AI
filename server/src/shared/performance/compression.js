import logger from '../logger/logger.js';

/**
 * Returns a compression middleware using Brotli/Gzip dynamically.
 * Falls back cleanly to a pass-through middleware if the 'compression' library is not present.
 * @returns {Promise<Function>}
 */
export async function getCompressionMiddleware() {
  try {
    const { default: compression } = await import('compression');
    logger.info("Payload compression module successfully loaded.");
    return compression({
      level: 6,
      threshold: 1024, // Compress responses that are greater than 1KB
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        // Compress standard text content types
        return true;
      }
    });
  } catch (err) {
    logger.warn("Dependency 'compression' not found in package.json. Running server without Brotli payload compression.", { error: err.message });
    return (req, res, next) => next();
  }
}

export default {
  getCompressionMiddleware
};
