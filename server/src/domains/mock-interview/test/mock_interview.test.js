import { parseResume } from '../service/resume.parser.service.js';
import { generateNextQuestion } from '../service/question.generator.service.js';
import { evaluateAnswer } from '../service/evaluation.service.js';
import { compileFinalScoreReport } from '../service/scoring.engine.js';
import { initDb } from '../../../infrastructure/db/mongo.js';
import logger from '../../../shared/logger/logger.js';

let failed = false;
let assertionsCount = 0;

function assert(condition, message) {
  assertionsCount++;
  if (!condition) {
    logger.error(`❌ FAIL: ${message}`);
    failed = true;
    throw new Error(message || "Assertion failed");
  } else {
    logger.info(`✅ PASS: ${message}`);
  }
}

async function runTests() {
  logger.info("Initializing Database for test runs...");
  await initDb();

  logger.info("------ Starting Mock Interview Suite Tests ------");

  // 1. Ingestion Text Fallback Test
  logger.info("[TEST 1/5] Testing Ingestion Text Fallback Parser...");
  const sampleResume = `
    Alex Mercer
    Education: B.S. in Computer Science, Tech University
    Skills: JavaScript, Python, React, MongoDB, System Design
    Experience: Software Engineer Intern at ByteCraft Solutions
    Projects: DevRank - Developer Portfolio Engine
  `;

  try {
    const profile = await parseResume(Buffer.from(sampleResume, 'utf-8'), 'text/plain');
    assert(profile !== null, "Test 1 Failed: Profile extraction returned null");
    assert(profile.skills.length > 0, "Test 1 Failed: No skills extracted");
    logger.info("✅ Ingestion Text Parser passed: Extracted profile name = " + profile.name);
  } catch (err) {
    logger.error("❌ Test 1 Failed with error:", err);
    failed = true;
  }

  // 2. Question Generation Test
  logger.info("[TEST 2/5] Testing Dynamic Question Generator...");
  const mockProfile = {
    name: "Alex Mercer",
    skills: ["REACT", "PYTHON", "SYSTEM DESIGN"],
    projects: ["DevRank Portfolio Dashboard"],
    experience: ["Frontend Intern"],
    weak_areas: ["Database scaling", "Distributed locking"]
  };

  const mockSession = {
    type: "Technical",
    difficulty: "Medium",
    company: "Google",
    history: []
  };

  try {
    const question = await generateNextQuestion(mockSession, mockProfile);
    assert(question !== null, "Test 2 Failed: Question generated is null");
    assert(question.question !== undefined, "Test 2 Failed: No question content string");
    logger.info("✅ Question Generator passed: Question = " + question.question);
  } catch (err) {
    logger.error("❌ Test 2 Failed with error:", err);
    failed = true;
  }

  // 3. Answer Evaluation Test
  logger.info("[TEST 3/5] Testing Individual Answer Evaluator...");
  const testQuestion = "Explain the difference between synchronous execution blocking and asynchronousevent-driven lifecycles.";
  const testAnswer = "Synchronous execution blocks subsequent threads until current tasks return. Asynchronous uses an Event Loop to handle I/O non-blocking callbacks.";

  try {
    const evalResult = await evaluateAnswer(testQuestion, testAnswer);
    assert(evalResult.score !== undefined, "Test 3 Failed: No score calculated");
    assert(evalResult.score >= 5, "Test 3 Failed: Score should be elevated due to length and matching keywords");
    logger.info("✅ Answer Evaluator passed: Score = " + evalResult.score + "/10 | Feedback: " + evalResult.feedback);
  } catch (err) {
    logger.error("❌ Test 3 Failed with error:", err);
    failed = true;
  }

  // 4. Final Cumulative Scoring Test
  logger.info("[TEST 4/5] Testing Final Cumulative Scoring Engine...");
  const mockEvaluations = [
    { question: "Q1", answer: "A1", score: 8, feedback: "Good" },
    { question: "Q2", answer: "A2", score: 9, feedback: "Excellent" },
    { question: "Q3", answer: "A3", score: 5, feedback: "Short answer" }
  ];

  try {
    const report = await compileFinalScoreReport([], mockEvaluations);
    assert(report.overallScore > 0, "Test 4 Failed: Overall score is zero");
    assert(report.strengths.length > 0, "Test 4 Failed: No strengths logged");
    logger.info("✅ Final Scorer compiled: Score = " + report.overallScore + "% | Recommendation = " + report.finalRecommendation);
  } catch (err) {
    logger.error("❌ Test 4 Failed with error:", err);
    failed = true;
  }

  // 5. Rule-Based Fallback Triggers
  logger.info("[TEST 5/5] Testing Fallback Generation Triggers...");
  const tempKey = process.env.GEMINI_API_KEY;
  // Temporary clear key to force fallback checks
  delete process.env.GEMINI_API_KEY;

  try {
    const fallbackQ = await generateNextQuestion(mockSession, mockProfile);
    process.env.GEMINI_API_KEY = tempKey; // Reset key

    assert(fallbackQ.question !== undefined, "Test 5 Failed: Fallback question is missing");
    logger.info("✅ Fallback triggers passed: Fallback question = " + fallbackQ.question);
  } catch (err) {
    logger.error("❌ Test 5 Failed with error:", err);
    failed = true;
  }

  logger.info("------ All Mock Interview Tests Completed ------");
  if (failed) {
    logger.error("❌ SOME TESTS FAILED.");
    process.exit(1);
  } else {
    logger.info(`✨ ALL TESTS PASSED SUCCESSFULLY! Passed assertions: ${assertionsCount}`);
    process.exit(0);
  }
}

runTests().catch(e => {
  logger.error("Global Test runner exception caught:", e);
  process.exit(1);
});
