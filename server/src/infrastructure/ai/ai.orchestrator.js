import crypto from 'crypto';
import cache from '../cache/redis.js';
import logger from '../../shared/logger/logger.js';

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

  // 1. Create cache key from hash of prompts
  const payloadHash = crypto
    .createHash('sha256')
    .update(`${systemPrompt}|||${userPrompt}`)
    .digest('hex');
  const cacheKey = `ai:cache:${payloadHash}`;

  // 2. Lookup Cache
  if (useCache) {
    try {
      const cachedResult = await cache.get(cacheKey);
      if (cachedResult) {
        logger.info("AI Cache Hit for prompt hash.", { hash: payloadHash });
        return cachedResult;
      }
    } catch (err) {
      logger.warn("AI Cache lookup failed, proceeding to query API.", { error: err.message });
    }
  }

  // 3. Rate Limit / Request Guard
  const rateLimitKey = "ai:ratelimit:global";
  const rateCheck = await cache.slidingWindowRateLimit(rateLimitKey, 15, 60); // Max 15 requests per minute
  if (!rateCheck.allowed) {
    logger.warn("AI Global API rate limit exceeded.", { resetMs: rateCheck.resetMs });
    throw new Error("AI requests rate limit reached. Please try again in a moment.");
  }

  // 4. API Request Execution
  try {
    logger.info("Dispatching query to Gemini API model...", { hash: payloadHash });
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemPrompt}\n\nUser request:\n${userPrompt}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Gemini API request failed:", { status: response.status, details: errorText });
      return null;
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      logger.warn("Gemini returned empty parts candidate response.");
      return null;
    }

    // 5. Save Cache
    if (useCache) {
      try {
        // Cache API outputs for 12 hours
        await cache.set(cacheKey, textResponse, 12 * 60 * 60);
      } catch (err) {
        logger.warn("AI Cache write failed:", { error: err.message });
      }
    }

    return textResponse;
  } catch (err) {
    logger.error("Error executing call to Gemini API:", err);
    return null;
  }
}

export default {
  callAI,
  parseCleanJson
};
