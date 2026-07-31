import ivm from 'isolated-vm';

const TIMEOUT = parseInt(process.env.SANDBOX_TIMEOUT) || 5000; // 5 seconds
const MEMORY_LIMIT = parseInt(process.env.SANDBOX_MEMORY) || 128; // MB

/**
 * Execute JavaScript code in an isolated V8 context.
 * @param {string} code - JavaScript source code.
 * @param {Array} testCases - [{ input: any, expected: any }]
 * @returns {Promise<Object>} - { success, results, output, error }
 */
export async function executeJS(code, testCases = []) {
  const isolate = new ivm.Isolate({ memoryLimit: MEMORY_LIMIT });
  const context = await isolate.createContext();

  // Capture console.log
  let capturedLogs = [];
  await context.global.set('console', {
    log: (...args) => {
      capturedLogs.push(args.map(a => String(a)).join(' '));
    }
  });

  let result = { success: false, results: [], output: '', error: null };

  try {
    // Compile and run user code
    const script = await isolate.compileScript(code);
    await script.run(context, { timeout: TIMEOUT });

    // Extract function name (heuristic)
    const functionName = extractFunctionName(code);
    if (!functionName) throw new Error('No function definition found.');

    const fn = await context.global.get(functionName);

    // Run each test case
    for (const { input, expected } of testCases) {
      let passed = false;
      let actual = null;
      let error = null;
      try {
        actual = await fn.apply(undefined, Array.isArray(input) ? input : [input], { timeout: TIMEOUT });
        passed = deepEqual(actual, expected);
      } catch (err) {
        error = err.message;
      }
      result.results.push({ input, expected, actual, passed, error });
    }

    result.success = result.results.every(r => r.passed);
    result.output = capturedLogs.join('\n');
  } catch (err) {
    result.error = err.message;
  } finally {
    isolate.dispose();
  }

  return result;
}

// Helper: extract first function name
function extractFunctionName(code) {
  const match = code.match(/function\s+(\w+)\s*\(/) || 
                code.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function\s*\(/);
  return match ? match[1] : null;
}

// Deep equality (simplified)
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
  }
  return true;
}
