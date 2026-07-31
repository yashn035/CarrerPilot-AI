import { calculateAtsScoringMetrics } from '../service/resume.service.js';
import assert from 'assert';

console.log("=== Running Resume Upload & ATS Analyzer Test Suite ===");

function testBasicMetrics() {
  console.log("Testing basic metrics calculation...");
  const dummyResume = {
    personalInfo: {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "123-456-7890",
      linkedin: "linkedin.com/in/johndoe",
      github: "github.com/johndoe"
    },
    skills: ["React", "JavaScript", "Node.js", "Git"],
    education: [
      {
        school: "State University",
        degree: "B.S. Computer Science",
        date: "2020 - 2024"
      }
    ],
    experience: [
      {
        company: "Tech Corp",
        role: "Software Engineer",
        date: "2024 - 2026",
        description: "Engineered a scalable payment system.\nOptimized API routes reducing latency by 30%."
      }
    ],
    projects: []
  };

  const metrics = calculateAtsScoringMetrics(dummyResume);
  console.log("Basic Metrics Results:", metrics);

  assert.ok(metrics.atsScore > 0, "ATS score should be greater than 0");
  assert.ok(metrics.formattingScore > 50, "Formatting score should be reasonably high for standard resume");
  assert.ok(metrics.bulletQualityScore >= 50, "Bullet quality should be scored correctly");
  console.log("✔ Basic metrics verification passed!");
}

function testKeywordMatching() {
  console.log("Testing keyword matching against job description...");
  const dummyResume = {
    personalInfo: {
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "987-654-3210"
    },
    skills: ["React", "JavaScript"],
    education: [],
    experience: [],
    projects: []
  };

  const jd = "Looking for a React developer proficient in JavaScript, Redux, and TypeScript.";
  
  // Without JD
  const metricsWithoutJd = calculateAtsScoringMetrics(dummyResume);
  
  // With JD
  const metricsWithJd = calculateAtsScoringMetrics(dummyResume, jd);
  
  console.log("Without JD keyword score:", metricsWithoutJd.keywordMatchScore);
  console.log("With JD keyword score:", metricsWithJd.keywordMatchScore);

  assert.ok(metricsWithJd.keywordMatchScore > 0, "Keyword score with JD should be greater than 0");
  console.log("✔ Keyword matching verification passed!");
}

function testFormattingPenalties() {
  console.log("Testing formatting index penalties for missing links/sections...");
  
  // Minimal/empty resume
  const emptyResume = {
    personalInfo: {},
    skills: [],
    education: [],
    experience: [],
    projects: []
  };
  
  const emptyMetrics = calculateAtsScoringMetrics(emptyResume);
  console.log("Empty Resume Formatting Score:", emptyMetrics.formattingScore);
  
  // Standard resume
  const goodResume = {
    personalInfo: {
      email: "test@test.com",
      phone: "123",
      linkedin: "linkedin"
    },
    skills: ["React"],
    education: [{ school: "A" }],
    experience: [{ company: "B", description: "did stuff" }]
  };
  const goodMetrics = calculateAtsScoringMetrics(goodResume);
  console.log("Good Resume Formatting Score:", goodMetrics.formattingScore);

  assert.ok(goodMetrics.formattingScore > emptyMetrics.formattingScore, "Good formatting score should be higher than empty formatting score");
  console.log("✔ Formatting penalties verification passed!");
}

try {
  testBasicMetrics();
  testKeywordMatching();
  testFormattingPenalties();
  console.log("\n=== ALL TESTS PASSED SUCCESSFULLY ===");
  process.exit(0);
} catch (error) {
  console.error("❌ Test Suite Failed:", error);
  process.exit(1);
}
