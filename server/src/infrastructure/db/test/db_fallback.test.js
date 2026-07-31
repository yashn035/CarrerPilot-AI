import { initDb, getDb, saveDb } from '../mongo.js';
import fs from 'fs/promises';
import path from 'path';
import { DB_DIR } from '../paths.js';

console.log("=================================================");
console.log("🧪 RUNNING DATABASE DUAL-MODE FALLBACK TESTS");
console.log("=================================================");

let failed = false;
let assertionsCount = 0;

function assert(condition, message) {
  assertionsCount++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed = true;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runTests() {
  const originalUri = process.env.MONGODB_URI;

  try {
    // -------------------------------------------------------------
    // Test Path 1: JSON File Datastore Fallback
    // -------------------------------------------------------------
    console.log("\n--- Test Path 1: Fallback Local JSON Datastore (MONGODB_URI Unset) ---");
    delete process.env.MONGODB_URI;

    // Initialize in fallback mode
    await initDb();
    
    // Retrieve DB and verify schema structure
    const db = await getDb();
    assert(db !== null, "Local database object must not be null");
    assert(Array.isArray(db.users), "Local database should contain 'users' collection");
    assert(Array.isArray(db.jobApplications), "Local database should contain 'jobApplications' collection");

    // Write a temporary test application
    const testAppId = "test-fallback-app-999";
    const newApp = {
      id: testAppId,
      userId: "demo-user-123",
      company: "Test Fallback Corp",
      role: "Manual QA Engineer",
      stage: "Applied",
      updatedAt: new Date().toISOString()
    };

    if (!db.jobApplications) db.jobApplications = [];
    db.jobApplications = db.jobApplications.filter(a => a.id !== testAppId);
    db.jobApplications.push(newApp);
    
    const saveSuccess = await saveDb(db);
    assert(saveSuccess === true, "saveDb should return true for local file writes");

    // Read directly from disk file to verify persistence
    const appJsonPath = path.join(DB_DIR, 'jobApplications.json');
    const diskContent = await fs.readFile(appJsonPath, 'utf-8');
    const diskApps = JSON.parse(diskContent);
    const savedApp = diskApps.find(a => a.id === testAppId);

    assert(savedApp !== undefined, "Written record should be found in local jobApplications.json file");
    assert(savedApp.company === "Test Fallback Corp", "Saved record data integrity must be preserved");

    // Cleanup local test record
    const freshDb = await getDb();
    freshDb.jobApplications = freshDb.jobApplications.filter(a => a.id !== testAppId);
    await saveDb(freshDb);

    const postCleanupContent = await fs.readFile(appJsonPath, 'utf-8');
    const postCleanupApps = JSON.parse(postCleanupContent);
    assert(postCleanupApps.find(a => a.id === testAppId) === undefined, "Local disk file cleanup should remove test records");

    // -------------------------------------------------------------
    // Test Path 2: MongoDB Mode (If MONGODB_URI is provided)
    // -------------------------------------------------------------
    if (originalUri) {
      console.log("\n--- Test Path 2: MongoDB Atlas Cloud Datastore (MONGODB_URI Set) ---");
      process.env.MONGODB_URI = originalUri;

      await initDb();
      const mongoDb = await getDb();
      assert(mongoDb !== null, "MongoDB-backed datastore must not be null");
      assert(Array.isArray(mongoDb.users), "MongoDB datastore should retrieve 'users' collection structure");

      const mongoAppId = "test-mongo-app-999";
      const mongoApp = {
        id: mongoAppId,
        userId: "demo-user-123",
        company: "Test Mongo Corp",
        role: "Cloud Architect",
        stage: "OA",
        updatedAt: new Date().toISOString()
      };

      if (!mongoDb.jobApplications) mongoDb.jobApplications = [];
      mongoDb.jobApplications = mongoDb.jobApplications.filter(a => a.id !== mongoAppId);
      mongoDb.jobApplications.push(mongoApp);

      const mongoSave = await saveDb(mongoDb);
      assert(mongoSave === true, "saveDb should return true for MongoDB database updates");

      // Verify the record is read back
      const verifiedDb = await getDb();
      const loadedApp = verifiedDb.jobApplications.find(a => a.id === mongoAppId);
      assert(loadedApp !== undefined, "Record saved to Mongo should be readable on subsequent getDb() calls");
      assert(loadedApp.role === "Cloud Architect", "Mongo data integrity must match input variables");

      // Clean up Mongo test record
      verifiedDb.jobApplications = verifiedDb.jobApplications.filter(a => a.id !== mongoAppId);
      await saveDb(verifiedDb);

      const finalDb = await getDb();
      assert(finalDb.jobApplications.find(a => a.id === mongoAppId) === undefined, "MongoDB cleanup should successfully remove the test record");
    } else {
      console.log("\n--- Test Path 2 Skipped: MONGODB_URI not set in environment ---");
    }

    // Restore environment
    if (originalUri) {
      process.env.MONGODB_URI = originalUri;
    }

    if (failed) {
      console.log("\n❌ DATABASE DUAL-MODE TESTS FAILED.");
      process.exit(1);
    } else {
      console.log(`\n✨ DATABASE DUAL-MODE TESTS PASSED SUCCESSFULLY! Assertions passed: ${assertionsCount}`);
      process.exit(0);
    }
  } catch (err) {
    console.error("Test execution caught an unexpected error:", err);
    if (originalUri) process.env.MONGODB_URI = originalUri;
    process.exit(1);
  }
}

runTests();
