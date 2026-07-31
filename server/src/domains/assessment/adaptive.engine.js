import { Skill } from './skill.model.js';
import { adaptationEfficiency } from '../../middlewares/metrics.js';
// We'll mock the getProblemBank or getProblemByTopic function for now since we don't have the full coding service
// import { getProblemBank } from '../coding/service/coding.service.js'; 

const TOPICS = ['arrays', 'strings', 'linked-lists', 'trees', 'graphs', 'dp', 'greedy', 'recursion', 'sorting', 'searching'];

/**
 * Get the user's current skill estimates.
 * Returns a map of topic -> { mean, variance }
 */
async function getUserSkills(userId) {
  let skillDoc = await Skill.findOne({ userId });
  if (!skillDoc) {
    // Initialize with default skills
    const defaultSkills = new Map();
    for (const topic of TOPICS) {
      defaultSkills.set(topic, { mean: 0.5, variance: 0.1, trials: 0, successes: 0 });
    }
    skillDoc = new Skill({ userId, skills: defaultSkills });
    await skillDoc.save();
  }
  return skillDoc;
}

/**
 * Update skill estimates after a user attempts a question.
 * Uses a simple Bayesian update (Beta distribution).
 */
export async function updateSkills(userId, topic, correct, timeSpent) {
  const skillDoc = await getUserSkills(userId);
  const skill = skillDoc.skills.get(topic) || { mean: 0.5, variance: 0.1, trials: 0, successes: 0 };

  // Update: Beta(a, b) where a = successes+1, b = failures+1 (for uniform prior)
  const a = skill.successes + 1;
  const b = (skill.trials - skill.successes) + 1;
  // New posterior: a' = a + (correct ? 1 : 0), b' = b + (correct ? 0 : 1)
  const newSuccesses = skill.successes + (correct ? 1 : 0);
  const newTrials = skill.trials + 1;
  // New mean = a' / (a' + b')
  const alpha = newSuccesses + 1;
  const beta = (newTrials - newSuccesses) + 1;
  const newMean = alpha / (alpha + beta);
  const newVariance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));

  skillDoc.skills.set(topic, {
    mean: newMean,
    variance: newVariance,
    trials: newTrials,
    successes: newSuccesses
  });
  skillDoc.updatedAt = new Date();
  await skillDoc.save();

  // Record delta
  const delta = newMean - skill.mean;
  if (delta > 0) {
    adaptationEfficiency.observe(delta);
  }

  return skillDoc;
}

/**
 * Select the next question using Thompson Sampling (exploration vs exploitation).
 * For each topic, sample from its Beta distribution and pick the highest sample.
 * Then fetch a random problem from that topic.
 */
export async function getNextQuestion(userId) {
  const skillDoc = await getUserSkills(userId);
  const topics = Array.from(skillDoc.skills.keys());
  let bestTopic = null;
  let bestSample = -Infinity;

  for (const topic of topics) {
    const skill = skillDoc.skills.get(topic);
    // Thompson Sampling: sample from Beta(alpha, beta)
    const alpha = skill.successes + 1;
    const beta = (skill.trials - skill.successes) + 1;
    // Use Beta distribution sampling (simplified: normal approximation if trials large)
    let sample;
    if (skill.trials < 10) {
      // For low trials, use a uniform random [0,1] to encourage exploration
      sample = Math.random();
    } else {
      // Approximate Beta with normal (mean, variance)
      const mean = alpha / (alpha + beta);
      const varEst = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
      // Simple z-score sample
      const z = randomNormal();
      sample = mean + Math.sqrt(varEst) * z;
      sample = Math.max(0, Math.min(1, sample)); // clip to [0,1]
    }
    if (sample > bestSample) {
      bestSample = sample;
      bestTopic = topic;
    }
  }

  if (!bestTopic) {
    // Fallback: pick a random topic
    bestTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  }

  // Fetch a problem for the selected topic (you'll implement this)
  const problem = await getProblemByTopic(bestTopic);
  return {
    problem,
    topic: bestTopic,
    difficulty: estimateDifficulty(skillDoc.skills.get(bestTopic).mean)
  };
}

// Helper: sample from standard normal
function randomNormal() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Map skill level (mean) to difficulty label
function estimateDifficulty(mean) {
  if (mean < 0.3) return 'Easy';
  if (mean < 0.6) return 'Medium';
  return 'Hard';
}

// Placeholder: fetch problem by topic (you'll wire this to your actual problem bank)
async function getProblemByTopic(topic) {
  // You need to implement this – query your problem collection for a problem with matching tags
  // For now, return a dummy problem
  return {
    id: `prob-${Date.now()}`,
    title: `Sample ${topic} Problem`,
    difficulty: 'Medium',
    description: `Solve this ${topic} problem.`,
    topic,
    testCases: [
      { input: [1, 2, 3], expected: 6 },
      { input: [0, 0], expected: 0 }
    ]
  };
}
