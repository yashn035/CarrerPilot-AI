import fs from 'fs';
import path from 'path';

// A lightweight, local semantic caching module acting as a drop-in replacement for FAISS.
// It computes basic TF-IDF / Cosine Similarity embeddings of text to find >95% matches.
// In a full production environment, this interfaces with a proper vector database (Pinecone/FAISS).

const CACHE_FILE = path.join(process.cwd(), '.semantic_cache.json');
const THRESHOLD = 0.95;

let cacheStore = [];

try {
  if (fs.existsSync(CACHE_FILE)) {
    cacheStore = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  }
} catch (e) {
  console.warn('[Semantic Cache] Could not load local cache store.');
}

function getWordFrequencies(str) {
  const words = str.toLowerCase().match(/\b\w+\b/g) || [];
  const freq = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }
  return freq;
}

function computeCosineSimilarity(strA, strB) {
  const freqA = getWordFrequencies(strA);
  const freqB = getWordFrequencies(strB);

  const uniqueWords = new Set([...Object.keys(freqA), ...Object.keys(freqB)]);
  
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (const word of uniqueWords) {
    const valA = freqA[word] || 0;
    const valB = freqB[word] || 0;
    dotProduct += valA * valB;
    magA += valA * valA;
    magB += valB * valB;
  }

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
}

export const SemanticCache = {
  /**
   * Search for a highly similar prompt in the cache.
   * @param {string} prompt 
   * @returns {string|null} Cached response or null
   */
  get: (prompt) => {
    if (!prompt) return null;
    
    let bestMatch = null;
    let highestSim = 0;

    for (const entry of cacheStore) {
      const sim = computeCosineSimilarity(prompt, entry.prompt);
      if (sim > highestSim) {
        highestSim = sim;
        bestMatch = entry;
      }
    }

    if (highestSim >= THRESHOLD && bestMatch) {
      console.log(`[Semantic Cache] HIT! Similarity: ${(highestSim * 100).toFixed(2)}%`);
      return bestMatch.response;
    }

    console.log(`[Semantic Cache] MISS. Highest similarity was ${(highestSim * 100).toFixed(2)}%`);
    return null;
  },

  /**
   * Store a successful LLM response in the cache.
   * @param {string} prompt 
   * @param {string} response 
   */
  set: (prompt, response) => {
    if (!prompt || !response) return;

    // Check if it already exists to avoid duplicates
    const existingSim = SemanticCache.get(prompt);
    if (existingSim) return;

    cacheStore.push({
      prompt,
      response,
      timestamp: Date.now()
    });

    // Keep cache size manageable
    if (cacheStore.length > 1000) {
      cacheStore.shift();
    }

    // Persist to disk asynchronously
    fs.writeFile(CACHE_FILE, JSON.stringify(cacheStore), (err) => {
      if (err) console.error('[Semantic Cache] Failed to persist cache:', err.message);
    });
  }
};
