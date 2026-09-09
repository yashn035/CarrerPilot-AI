import axios from 'axios';
import { runSandboxCode } from '../../../infrastructure/sandbox/executor.js';
import logger from '../../../shared/logger/logger.js';

const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

const LANGUAGE_MAP = {
  javascript: { pistonLang: 'javascript', version: '18.15.0' },
  python: { pistonLang: 'python', version: '3.10.0' },
  java: { pistonLang: 'java', version: '15.0.2' },
  cpp: { pistonLang: 'cpp', version: '10.2.0' }
};

/**
 * Execute code via Piston API fallback
 */
async function executePiston(language, code, input = '') {
  const langConfig = LANGUAGE_MAP[language.toLowerCase()] || { pistonLang: language, version: '*' };
  
  try {
    const res = await axios.post(PISTON_API_URL, {
      language: langConfig.pistonLang,
      version: langConfig.version,
      files: [{ content: code }],
      stdin: input
    }, { timeout: 8000 });

    const run = res.data?.run || {};
    return {
      stdout: run.stdout || '',
      stderr: run.stderr || '',
      output: run.output || '',
      code: run.code || 0
    };
  } catch (err) {
    logger.warn(`Piston API execution failed: ${err.message}`);
    return {
      stdout: '',
      stderr: err.message,
      output: `Execution Error: ${err.message}`,
      code: 1
    };
  }
}

/**
 * Main Code Execution Service
 */
export async function executeCode({ language, code, testCases = [] }) {
  const startTime = Date.now();
  const results = [];
  let totalPassed = 0;
  let overallError = null;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const tcInput = typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input);
    const expectedOutput = (tc.expectedOutput || tc.output || '').toString().trim();

    let execResult = null;

    if (language.toLowerCase() === 'javascript') {
      try {
        const sandboxRes = await runSandboxCode({
          code,
          testInput: tcInput,
          expectedOutput
        });
        execResult = {
          stdout: sandboxRes.stdout || '',
          stderr: sandboxRes.error || '',
          output: sandboxRes.stdout || sandboxRes.error || '',
          passed: sandboxRes.passed || false
        };
      } catch (err) {
        execResult = await executePiston(language, code, tcInput);
      }
    } else {
      execResult = await executePiston(language, code, tcInput);
    }

    const actualOutput = (execResult.stdout || execResult.output || '').toString().trim();
    
    // Evaluate correctness if expectedOutput is provided
    let passed = execResult.passed;
    if (passed === undefined) {
      passed = expectedOutput ? (actualOutput === expectedOutput || actualOutput.includes(expectedOutput)) : true;
    }

    if (passed) totalPassed++;
    if (execResult.stderr && !overallError) {
      overallError = execResult.stderr;
    }

    results.push({
      testCaseIndex: i + 1,
      passed,
      stdout: execResult.stdout,
      stderr: execResult.stderr,
      input: tcInput,
      expected: expectedOutput,
      actual: actualOutput,
      isHidden: tc.isHidden || false
    });
  }

  const runtimeMs = Math.max(5, Date.now() - startTime);
  const memoryMb = parseFloat((Math.random() * 8 + 32).toFixed(1)); // Simulated memory footprint

  return {
    success: totalPassed === testCases.length,
    passedCount: totalPassed,
    totalCount: testCases.length,
    results,
    runtimeMs,
    memoryMb,
    error: overallError
  };
}

export default { executeCode };
