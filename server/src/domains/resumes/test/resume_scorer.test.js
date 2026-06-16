import { calculateAtsScoringMetrics, rewriteResumeBullet } from '../service/resume.service.js';

console.log("=================================================");
console.log("🧪 RUNNING ATS SCORING & REWRITING ENGINE TESTS");
console.log("=================================================");

let failed = false;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed = true;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

// Mock Resumes
const goodResume = {
  personalInfo: {
    name: "John Doe",
    email: "john@doe.com",
    phone: "+15551234",
    linkedin: "linkedin.com/in/johndoe",
    summary: "Experienced software engineer specializing in backend systems and distributed data caches."
  },
  education: [
    { school: "Tech University", degree: "M.S. in Computer Science", date: "2020 - 2022", gpa: "3.9" }
  ],
  experience: [
    {
      company: "Cloud Corp",
      role: "Backend Engineer",
      date: "2022 - 2025",
      description: "Engineered scalable REST APIs using Node.js and Express, improving request speed by 35%.\nOptimized Redis cache architectures to minimize database query footprints."
    }
  ],
  projects: [
    {
      title: "Task Orchestrator",
      technologies: "React, Go, Docker",
      date: "2024 - 2024",
      description: "Spearheaded the development of a containerized queue scheduler, handling over 10m requests daily."
    }
  ],
  skills: ["Node.js", "Express", "React", "Go", "Docker", "Redis", "SQL"],
  certifications: ["AWS Cloud Developer"]
};

const weakResume = {
  personalInfo: {
    name: "Jane Smith"
  },
  education: [],
  experience: [
    {
      company: "Old Shop",
      role: "Helper",
      date: "2025 - 2025",
      description: "worked on some projects.\nhelped with frontend code."
    }
  ],
  projects: [],
  skills: [],
  certifications: []
};

// 1. Test Math Scoring calculations
console.log("\n--- Test 1: Scoring Formula Tests ---");
const goodMetrics = calculateAtsScoringMetrics(goodResume, "Looking for a Backend Node.js Go developer with Redis caching and Docker");
console.log("Good Resume Score metrics:", goodMetrics);

assert(goodMetrics.atsScore >= 75, `Good resume should get a high score. Got: ${goodMetrics.atsScore}`);
assert(goodMetrics.keywordMatchScore > 50, "Good resume keyword similarity match should be high.");
assert(goodMetrics.bulletQualityScore >= 80, "Good resume bullets (strong verbs + numbers) should get high quality score.");
assert(goodMetrics.formattingScore === 100, "Good resume should have perfect format score.");

const weakMetrics = calculateAtsScoringMetrics(weakResume, "Looking for a Backend developer");
console.log("Weak Resume Score metrics:", weakMetrics);

assert(weakMetrics.atsScore < 50, `Weak resume should get a low score. Got: ${weakMetrics.atsScore}`);
assert(weakMetrics.formattingScore <= 70, "Weak resume formatting score should be penalized for missing sections.");
assert(weakMetrics.bulletQualityScore === 0, "Weak resume bullet quality should be 0 (passive verbs, no metrics).");

// 2. Test STAR Passive-to-Active Heuristic Fallback Rewriter
console.log("\n--- Test 2: Bullet Rewriter Heuristics ---");
const rewriteResult = await rewriteResumeBullet("user-1", "helped to build the react dashboard");
console.log("Rewrite recommendations:", rewriteResult);

assert(rewriteResult.option1.startsWith("Engineered") || rewriteResult.option1.startsWith("Optimized") || rewriteResult.option1.startsWith("Spearheaded"), "Option 1 should start with an action verb.");
assert(rewriteResult.option1.includes("react dashboard"), "Option 1 should preserve facts (react dashboard).");
assert(rewriteResult.option1.includes("%") || rewriteResult.option1.match(/\b\d+/), "Option 1 should include standard percentage metrics.");

if (failed) {
  console.log("\n❌ SOME TESTS FAILED.");
  process.exit(1);
} else {
  console.log("\n✨ ALL TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}
