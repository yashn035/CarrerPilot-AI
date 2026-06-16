import aiOrchestrator from '../../../infrastructure/ai/ai.orchestrator.js';
import promptEngine from '../../../infrastructure/ai/prompt.engine.js';
import logger from '../../../shared/logger/logger.js';

/**
 * Evaluates a single answer to a question and returns a score and feedback.
 * @param {string} question 
 * @param {string} answer 
 * @returns {Promise<Object>}
 */
export async function evaluateAnswer(question, answer) {
  const variables = {
    question,
    answer
  };

  const systemPrompt = promptEngine.getPrompt('interview_resume_answer_evaluator', 'v1', variables);
  const userPrompt = `Evaluate this response:\nQuestion: ${question}\nCandidate: ${answer}\n\nProvide JSON grading report:`;

  try {
    const aiResponse = await aiOrchestrator.callAI(systemPrompt, userPrompt, false);
    if (aiResponse) {
      const parsedGrading = aiOrchestrator.parseCleanJson(aiResponse);
      if (parsedGrading && parsedGrading.score !== undefined) {
        return {
          score: parseInt(parsedGrading.score, 10),
          feedback: parsedGrading.feedback || "Answer audited successfully.",
          correctness: parsedGrading.correctness || "Partial correctness parsed."
        };
      }
    }
  } catch (err) {
    logger.warn("AI Response evaluator failed, applying rule-based score calculation.", err);
  }

  return getRuleBasedEvaluationFallback(question, answer);
}

function getRuleBasedEvaluationFallback(question, answer) {
  const length = (answer || "").trim().length;
  let score = 5;
  let correctness = "Partial Answer";
  let feedback = "Your answer was received. Try adding more concrete technical details, structural layers, or numeric metrics next time to rank higher.";

  if (length === 0) {
    score = 1;
    correctness = "No Answer";
    feedback = "Candidate did not provide any input details for this question.";
  } else if (length > 150) {
    score = 8;
    correctness = "Mostly Correct";
    feedback = "Good response length. You provided a detailed explanation. Mentioning specific protocols, libraries, or architectural parameters would improve this further.";
  } else if (length > 70) {
    score = 6;
    correctness = "Partially Correct";
    feedback = "Decent overview, but the answer lacks technical depth. Try explaining the internal mechanism, constraints, or alternatives to demonstrate staff capability.";
  }

  // Scan for common keyword qualifiers
  const keywords = ["complexity", "time complexity", "space complexity", "redis", "index", "scale", "concurrency", "lock", "queue", "star", "metric"];
  let matches = 0;
  keywords.forEach(kw => {
    if (answer.toLowerCase().includes(kw)) matches++;
  });

  if (matches > 0 && score > 1) {
    score = Math.min(score + 1, 10);
    feedback += ` Good usage of key terminology: ${keywords.filter(k => answer.toLowerCase().includes(k)).join(', ')}.`;
  }

  return {
    score,
    feedback,
    correctness
  };
}
