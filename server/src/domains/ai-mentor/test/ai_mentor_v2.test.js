import { initDb, getDb, saveDb } from '../../../infrastructure/db/mongo.js';
import * as aiMentorService from '../service/ai-mentor.service.js';

console.log("=================================================");
console.log("🧪 RUNNING AI MENTOR V2.0 ENGINE TESTS");
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

async function runTests() {
  try {
    // 1. Initialize & Seed Db
    await initDb();
    const userId = "demo-user-123";
    
    console.log("\n--- Seeding Test Database State ---");
    const db = await getDb();
    db.users = [
      {
        id: "demo-user-123",
        email: "demouser@careerpilot.ai",
        name: "Alex Mercer",
        targetRole: "Frontend Engineer",
        xp: 450,
        level: 3,
        streak: 5,
        skills: [
          { name: "React", level: 4, category: "Frontend" }
        ],
        scores: {
          resume: 72,
          dsa: 65,
          projects: 70,
          communication: 60,
          interview: 65
        }
      }
    ];
    db.resumes = [
      {
        id: "res-1",
        userId: "demo-user-123",
        title: "Alex CS Resume"
      }
    ];
    db.atsReports = [
      {
        id: "report-1",
        resumeId: "res-1",
        score: 72,
        grade: "B",
        keywords: { found: ["React"], missing: ["TypeScript"] }
      }
    ];
    db.aiMentorMemory = [
      {
        userId: "demo-user-123",
        targetRole: "Frontend Engineer",
        targetCompanies: ["Google", "Amazon"],
        weaknesses: ["Dynamic Programming"],
        strengths: ["React"],
        topicsDiscussed: ["arrays"],
        lastAtsScore: 72,
        lastInterviewScore: 65,
        dailyMissions: [
          { id: "mission-dsa", title: "Solve 1 Array or String problem in Coding Arena", type: "dsa", completed: false, claimed: false, xpReward: 50 },
          { id: "mission-resume", title: "Optimize 1 bullet point or scan resume", type: "resume", completed: false, claimed: false, xpReward: 50 },
          { id: "mission-mock", title: "Run 1 Mock Interview in interview mode", type: "interview", completed: false, claimed: false, xpReward: 50 }
        ],
        updatedAt: new Date().toISOString()
      }
    ];
    db.submissions = [];
    db.projects = [
      {
        id: "proj-1",
        userId: "demo-user-123",
        scores: { architecture: 75 }
      }
    ];
    await saveDb(db);
    console.log("Database seeded successfully.");

    // 2. Test Roadmap Generator
    console.log("\n--- Test 1: Weekly Roadmap Generator ---");
    const googleRoadmap = await aiMentorService.generateRoadmap(userId, "Google");
    console.log("Google track weeks:", googleRoadmap.length);
    assert(Array.isArray(googleRoadmap), "Roadmap should be an array");
    assert(googleRoadmap.length === 4, "Roadmap should have exactly 4 weeks");
    assert(googleRoadmap[0].week.includes("Week 1"), "First week should start with Week 1");
    assert(googleRoadmap[0].topics.length > 0, "Week 1 topics list must not be empty");

    // 3. Test Placement Readiness Score Formula
    console.log("\n--- Test 2: Placement Readiness predictions ---");
    const readiness = await aiMentorService.predictPlacementReadiness(userId);
    console.log("Readiness Result:", readiness);
    assert(typeof readiness.overallScore === 'number', "Overall score should be a number");
    assert(readiness.overallScore >= 0 && readiness.overallScore <= 100, "Overall score must be between 0 and 100");
    assert(readiness.breakdown.resume === 72, `Resume score should be 72. Got: ${readiness.breakdown.resume}`);
    assert(typeof readiness.predictions.chanceProduct === 'number', "Product company chance must be calculated");

    // 4. Test Daily Missions Generator
    console.log("\n--- Test 3: Daily Missions Tracker ---");
    const missions = await aiMentorService.getDailyMissions(userId);
    console.log("Missions:", missions.map(m => ({ id: m.id, completed: m.completed, claimed: m.claimed })));
    assert(Array.isArray(missions), "Missions must return an array");
    assert(missions.length === 3, "Should return exactly 3 daily missions");
    assert(missions.some(m => m.id === "mission-dsa"), "Should contain DSA practice mission");

    // 5. Test Mission reward claim endpoint logic
    console.log("\n--- Test 4: Claim Quest reward and award XP ---");
    
    // Complete the resume mission and save to disk
    const preDb = await getDb();
    const memoryIndex = preDb.aiMentorMemory.findIndex(m => m.userId === userId);
    if (memoryIndex !== -1) {
      const resumeMission = preDb.aiMentorMemory[memoryIndex].dailyMissions.find(m => m.id === "mission-resume");
      if (resumeMission) {
        resumeMission.completed = true;
        resumeMission.claimed = false;
      }
    }
    await saveDb(preDb);
    
    const claimRes = await aiMentorService.claimDailyMission(userId, "mission-resume");
    console.log("Claim Response:", claimRes);
    assert(claimRes.success === true, "Should successfully claim completed mission");
    assert(claimRes.xpGained === 50, "Should gain +50 XP");
    
    const freshDb = await getDb();
    const claimedMemory = freshDb.aiMentorMemory.find(m => m.userId === userId);
    console.log("Claimed Memory details:", claimedMemory.dailyMissions);
    const updatedResumeMission = claimedMemory.dailyMissions.find(m => m.id === "mission-resume");
    assert(updatedResumeMission.claimed === true, "Mission should be marked as claimed in memory");

    if (failed) {
      console.log("\n❌ SOME TESTS FAILED.");
      process.exit(1);
    } else {
      console.log("\n✨ ALL TESTS PASSED SUCCESSFULLY!");
      process.exit(0);
    }
  } catch (err) {
    console.error("Test execution encountered an error:", err);
    process.exit(1);
  }
}

runTests();
