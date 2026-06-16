import { runSandboxCode } from '../../../infrastructure/sandbox/executor.js';

console.log("=================================================");
console.log("🧪 RUNNING CODING ARENA SANDBOX RUNNER TESTS");
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

// 1. Test javascript code dynamic parsing & local VM runner fallback
console.log("\n--- Test 1: JavaScript Dynamic Sandbox VM ---");

const jsCode = `
function rotateArray(nums, target) {
  // Mock rotate logic
  return 1;
}
`;

const testCases = [
  { input: [[1, 2], 3], output: 1 }
];

const jsResult = await runSandboxCode(jsCode, 'javascript', 'rotate-allocation-array', testCases);
console.log("JavaScript Sandbox execution result:", jsResult);

assert(jsResult.success === true, "JS custom function name should be parsed and executed matching output 1 successfully.");
assert(jsResult.passedCount === 1, "Should pass exactly 1 test case.");

// 2. Test dynamic extraction failures (e.g. compile or undefined function exceptions)
console.log("\n--- Test 2: JavaScript Runtime Exceptions handling ---");
const brokenJs = `
function rotateArray(nums, target) {
  throw new Error("Local logic failure");
}
`;

const brokenResult = await runSandboxCode(brokenJs, 'javascript', 'rotate-allocation-array', testCases);
console.log("Broken JS Sandbox result:", brokenResult);
assert(brokenResult.success === false, "Sandbox should catch the error and flag success as false.");
assert(brokenResult.passedCount === 0, "No cases should pass.");

if (failed) {
  console.log("\n❌ SOME TESTS FAILED.");
  process.exit(1);
} else {
  console.log("\n✨ ALL TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}
