import CircuitBreaker from 'opossum';
import { callGemini } from './providers/gemini.js';
import { callClaude } from './providers/claude.js';
import { callOpenAI } from './providers/openai.js';

// Provider configuration with priority order and circuit‑breaker options
const PROVIDERS = [
  {
    name: 'gemini',
    call: callGemini,
    priority: 1,
    breakerOptions: { timeout: 10000, errorThresholdPercentage: 50, resetTimeout: 30000 }
  },
  {
    name: 'claude',
    call: callClaude,
    priority: 2,
    breakerOptions: { timeout: 15000, errorThresholdPercentage: 50, resetTimeout: 60000 }
  },
  {
    name: 'openai',
    call: callOpenAI,
    priority: 3,
    breakerOptions: { timeout: 15000, errorThresholdPercentage: 50, resetTimeout: 60000 }
  }
];

// Create circuit‑breakers for each provider
const breakers = new Map();
for (const provider of PROVIDERS) {
  const breaker = new CircuitBreaker(provider.call, provider.breakerOptions);
  // Log events for monitoring
  breaker.on('open', () => console.warn(`[LLM Router] ${provider.name} circuit opened.`));
  breaker.on('halfOpen', () => console.warn(`[LLM Router] ${provider.name} circuit half‑open.`));
  breaker.on('close', () => console.info(`[LLM Router] ${provider.name} circuit closed.`));
  breaker.on('fallback', () => console.warn(`[LLM Router] ${provider.name} fallback used.`));
  breakers.set(provider.name, { breaker, provider });
}

// Main router function
export async function routeAIRequest(prompt, systemPrompt = '') {
  // Load‑shedding: if too many pending requests, reject early
  const pendingCount = Array.from(breakers.values())
    .reduce((sum, { breaker }) => sum + breaker.pendingCount, 0);
  const MAX_PENDING = 100;
  if (pendingCount > MAX_PENDING) {
    throw new Error('Too many pending AI requests. Please try again later.');
  }

  // Sort providers by priority (lowest number = highest priority)
  const sorted = [...breakers.entries()]
    .sort((a, b) => a[1].provider.priority - b[1].provider.priority);

  // Attempt each provider in order
  for (const [name, { breaker }] of sorted) {
    try {
      // Check if circuit is open – skip
      if (breaker.opened) continue;

      // Fire the request with retry (opossum handles retries via `breakerOptions`)
      const result = await breaker.fire(prompt, systemPrompt);
      // If we get a response, return it immediately
      return { provider: name, response: result };
    } catch (error) {
      console.error(`[LLM Router] Provider ${name} failed:`, error.message);
      // Continue to next provider
    }
  }

  // If all providers fail, throw a final error
  throw new Error('All AI providers are currently unavailable.');
}

// Expose circuit states for monitoring
export function getCircuitStates() {
  const states = {};
  for (const [name, { breaker }] of breakers) {
    states[name] = {
      opened: breaker.opened,
      pendingCount: breaker.pendingCount,
      successCount: breaker.successes,
      failureCount: breaker.failures,
    };
  }
  return states;
}
