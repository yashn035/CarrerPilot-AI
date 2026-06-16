import aiOrchestrator from '../../../infrastructure/ai/ai.orchestrator.js';
import promptEngine from '../../../infrastructure/ai/prompt.engine.js';
import logger from '../../../shared/logger/logger.js';

/**
 * Compiles a comprehensive final report card for the completed interview session.
 * @param {Array} history 
 * @param {Array} evaluatedAnswers 
 * @returns {Promise<Object>}
 */
export async function compileFinalScoreReport(history, evaluatedAnswers) {
  // Format transcript for prompt
  const transcriptList = [];
  for (let i = 0; i < evaluatedAnswers.length; i++) {
    transcriptList.push(`Q${i+1}: ${evaluatedAnswers[i].question}\nA${i+1}: ${evaluatedAnswers[i].answer}\nScore: ${evaluatedAnswers[i].score}/10\nFeedback: ${evaluatedAnswers[i].feedback}`);
  }

  const transcript = transcriptList.join("\n\n");
  const variables = {
    transcript
  };

  const systemPrompt = promptEngine.getPrompt('interview_resume_final_grader', 'v1');
  const userPrompt = `Generate final grading report card based on this transcript:\n\n${transcript}\n\nReturn JSON output:`;

  try {
    const aiResponse = await aiOrchestrator.callAI(systemPrompt, userPrompt, false);
    if (aiResponse) {
      const parsedGrader = aiOrchestrator.parseCleanJson(aiResponse);
      if (parsedGrader && parsedGrader.overallScore !== undefined) {
        return parsedGrader;
      }
    }
  } catch (err) {
    logger.warn("AI Final grading compilation failed, compiling rule-based final scorecard.", err);
  }

  return getRuleBasedGraderFallback(evaluatedAnswers);
}

function getRuleBasedGraderFallback(evaluatedAnswers) {
  const answerCount = evaluatedAnswers.length;
  if (answerCount === 0) {
    return {
      overallScore: 0,
      communicationScore: 0,
      technicalScore: 0,
      problemSolvingScore: 0,
      confidenceScore: 0,
      strengths: ["None recorded"],
      weaknesses: ["Missing interview responses"],
      detailedFeedback: "Candidate terminated the interview session before answering questions.",
      finalRecommendation: "NO HIRE"
    };
  }

  // Calculate averages from answer scores
  const totalRawScore = evaluatedAnswers.reduce((acc, curr) => acc + (curr.score || 0), 0);
  const averageRaw = totalRawScore / answerCount; // Out of 10
  const overallScore = Math.round(averageRaw * 10); // Out of 100

  // Set communication, tech depth, and confidence subscores
  const communicationScore = Math.min(overallScore + 5, 100);
  const technicalScore = overallScore;
  const problemSolvingScore = Math.max(overallScore - 5, 0);
  const confidenceScore = Math.min(overallScore + 2, 100);

  let finalRecommendation = "BORDERLINE";
  let detailedFeedback = "The candidate shows intermediate core competencies. Focus on strengthening system design parameters, and resolving algorithmic boundaries under time constraints.";

  if (overallScore >= 80) {
    finalRecommendation = "HIRE";
    detailedFeedback = "The candidate performed excellently, providing clear, structurally coherent, and technically sound arguments. Highly recommended for hiring loops.";
  } else if (overallScore < 60) {
    finalRecommendation = "NO HIRE";
    detailedFeedback = "The candidate's answers lacked depth and proper terminology. Recommend additional study modules, review of foundational concepts, and practicing basic coding formats.";
  }

  return {
    overallScore,
    communicationScore,
    technicalScore,
    problemSolvingScore,
    confidenceScore,
    strengths: [
      "Good communication pace and clear presentation style.",
      "Identified main structural requirements of questions."
    ],
    weaknesses: [
      "Could expand on technical limits or scaling alternatives.",
      "Include more metrics and STAR outcome structures."
    ],
    detailedFeedback,
    finalRecommendation
  };
}
