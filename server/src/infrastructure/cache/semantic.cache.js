import { pipeline } from '@xenova/transformers';
import { HierarchicalNSW } from 'hnswlib-node';
import Redis from 'ioredis';
import { cacheHits, costSavings } from '../../middlewares/metrics.js';

const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');

const EMBEDDING_KEY = 'semantic:embeddings';
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 604800; // 7 days
const SIMILARITY_THRESHOLD = parseFloat(process.env.SIMILARITY_THRESHOLD) || 0.92;
const EMBEDDING_DIM = 384; // all-MiniLM-L6-v2

let embedder = null;
let index = null;
let idMap = {}; // hnswlib internal id → Redis key
let isReady = false;

// Lazy‑load embedder
async function getEmbedder() {
  if (!embedder) {
    console.log('[SemanticCache] Loading embedding model...');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('[SemanticCache] Embedding model ready.');
  }
  return embedder;
}

// Initialize HNSW index and load from Redis
export async function initCache() {
  if (isReady) return;
  try {
    // Create index
    index = new HierarchicalNSW(EMBEDDING_DIM);
    index.initIndex(1000); // grows automatically

    // Load existing embeddings from Redis
    const keys = await redis.smembers(`${EMBEDDING_KEY}:keys`);
    if (keys.length === 0) {
      console.log('[SemanticCache] No cached embeddings found.');
      isReady = true;
      return;
    }

    // Rebuild index from stored vectors
    for (const key of keys) {
      const data = await redis.hgetall(key);
      if (data && data.embedding) {
        const vector = data.embedding.split(',').map(Number);
        const id = index.addPoint(vector);
        idMap[id] = key;
      }
    }
    console.log(`[SemanticCache] Loaded ${keys.length} embeddings.`);
    isReady = true;
  } catch (err) {
    console.error('[SemanticCache] Init failed:', err);
    // Still mark ready so we don't keep retrying
    isReady = true;
  }
}

// Compute embedding for text
async function embedText(text) {
  const embedderFn = await getEmbedder();
  const output = await embedderFn(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

// Get cached response if similar enough
export async function getCachedResponse(userPrompt) {
  if (!isReady) await initCache();
  if (!index || index.getCurrentCount() === 0) return null;

  const embedding = await embedText(userPrompt);
  const result = index.searchKnn(embedding, 1);
  if (result.neighbors.length === 0) return null;

  const [nearestId, distance] = [result.neighbors[0], result.distances[0]];
  const similarity = 1 - distance; // HNSW distance = 1 - cosine for normalized vectors

  if (similarity < SIMILARITY_THRESHOLD) return null;

  const redisKey = idMap[nearestId];
  if (!redisKey) return null;

  const data = await redis.hgetall(redisKey);
  if (!data || !data.response) return null;

  // Refresh TTL on access
  await redis.expire(redisKey, CACHE_TTL);

  return {
    response: data.response,
    similarity,
  };
}

// Store new embedding+response
export async function storeResponse(userPrompt, response) {
  if (!isReady) await initCache();
  const embedding = await embedText(userPrompt);
  const id = index.addPoint(embedding);
  const redisKey = `${EMBEDDING_KEY}:${Date.now()}:${Math.random().toString(36).substr(2, 6)}`;
  idMap[id] = redisKey;

  await redis.hset(redisKey, {
    embedding: embedding.join(','),
    response,
    prompt: userPrompt,
    createdAt: new Date().toISOString()
  });
  await redis.expire(redisKey, CACHE_TTL);
  await redis.sadd(`${EMBEDDING_KEY}:keys`, redisKey);

  return redisKey;
}

// Warm up cache on startup (call from server.js)
export async function warmupCache() {
  await initCache();
  console.log('[SemanticCache] Warmup complete.');
}
