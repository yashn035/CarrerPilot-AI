import crypto from 'crypto';
import cache from '../cache/redis.js';
import logger from '../../shared/logger/logger.js';
import { getCachedResponse, storeResponse, warmupCache } from '../cache/semantic.cache.js';
import { cacheHits, costSavings } from '../../middlewares/metrics.js';
import { routeAIRequest } from './llm.router.js';

let cacheWarmed = false;
async function ensureCacheWarm() {
  if (!cacheWarmed && process.env.SEMANTIC_CACHE_ENABLED === 'true') {
    await warmupCache();
    cacheWarmed = true;
  }
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Clean markdown blocks from JSON replies
 * @param {string} text 
 * @returns {Object}
 */
export function parseCleanJson(text) {
  if (!text) throw new Error("Empty input text received for JSON parsing");
  try {
    const cleanJson = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    logger.error("Failed to parse cleaned JSON content:", { text, error: err.message });
    throw new Error("Failed to parse cleaned JSON content: " + err.message);
  }
}

/**
 * Orchestrates calls to the Gemini API, applying rate checks, security audits, and SHA-256 caching.
 * @param {string} systemPrompt 
 * @param {string} userPrompt 
 * @param {boolean} useCache 
 * @returns {Promise<string|null>}
 */
export async function callAI(systemPrompt, userPrompt, useCache = true) {
  if (!GEMINI_API_KEY) {
    logger.warn("Skipping AI call: GEMINI_API_KEY is not defined in environment variables. Falling back to local mock modes.");
    return null;
  }

  // Rate Limit / Request Guard
  const rateLimitKey = "ai:ratelimit:global";
  const rateCheck = await cache.slidingWindowRateLimit(rateLimitKey, 10, 60); // Max 10 requests per minute
  if (!rateCheck.allowed) {
    logger.warn("AI Global API rate limit exceeded.", { resetMs: rateCheck.resetMs });
    throw new Error("AI requests rate limit reached. Please try again in a moment.");
  }

  // 1. Check Semantic Cache
  if (useCache && process.env.SEMANTIC_CACHE_ENABLED === 'true') {
    await ensureCacheWarm();
    try {
      const fullPrompt = `${systemPrompt}\n\nUser request:\n${userPrompt}`;
      const cached = await getCachedResponse(fullPrompt);
      if (cached) {
        cacheHits.inc();
        costSavings.inc(0.0005);
        logger.info(`[AI] Cache HIT (similarity: ${cached.similarity.toFixed(3)})`);
        return cached.response;
      }
    } catch (err) {
      logger.warn("Semantic Cache lookup failed, proceeding to query API.", { error: err.message });
    }
  }
  
  logger.info("[AI] Cache MISS. Routing to LLM Router...");

  // 2. Use the router
  try {
    const { provider, response } = await routeAIRequest(userPrompt, systemPrompt);
    logger.info(`[AI] Responded via ${provider}.`);

    // 3. Store in Semantic Cache
    if (useCache && process.env.SEMANTIC_CACHE_ENABLED === 'true') {
      try {
        const fullPrompt = `${systemPrompt}\n\nUser request:\n${userPrompt}`;
        await storeResponse(fullPrompt, response);
      } catch (err) {
        logger.warn("Semantic Cache write failed:", { error: err.message });
      }
    }

    return response;
  } catch (error) {
    logger.error('[AI] All providers failed:', error.message);
    // Fallback to local heuristic if available, or just throw/return null
    return null;
  }
}

export default {
  callAI,
  parseCleanJson
};
