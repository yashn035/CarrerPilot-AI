import dotenv from 'dotenv';
import mongoose from 'mongoose';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Problem from '../domains/coding/models/Problem.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LEETCODE_API_ENDPOINT = 'https://leetcode.com/graphql';
const DELAY_MS = 250; // Rate limiting delay between requests
const BATCH_SIZE = 50; // Bulk write batch size
const TARGET_FREE_PROBLEMS = 1500; // Target count of problems

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Content-Type': 'application/json',
  'Referer': 'https://leetcode.com/problemset/all/'
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PROBLEMS_BANK_PATH = path.resolve(__dirname, '..', '..', 'data', 'problems_bank.json');
const FALLBACK_JSON_PATH = path.resolve(__dirname, 'top200Problems.json');

/**
 * Parses example blocks from LeetCode HTML content
 */
function parseExamplesFromHtml(html) {
  if (!html) return [];
  const examples = [];
  try {
    const exampleRegex = /<strong[^>]*>Example \d+:?<\/strong>\s*<pre>([\s\S]*?)<\/pre>/gi;
    let match;
    while ((match = exampleRegex.exec(html)) !== null) {
      const blockText = match[1].replace(/<[^>]+>/g, '').trim();
      const inputMatch = blockText.match(/Input:\s*([\s\S]*?)(?=Output:|$)/i);
      const outputMatch = blockText.match(/Output:\s*([\s\S]*?)(?=Explanation:|$)/i);
      const explanationMatch = blockText.match(/Explanation:\s*([\s\S]*?)$/i);

      examples.push({
        input: inputMatch ? inputMatch[1].trim() : '',
        output: outputMatch ? outputMatch[1].trim() : '',
        explanation: explanationMatch ? explanationMatch[1].trim() : ''
      });
    }
  } catch (e) {}
  return examples;
}

/**
 * Parses constraints list from LeetCode HTML content
 */
function parseConstraintsFromHtml(html) {
  if (!html) return [];
  const constraints = [];
  try {
    const constraintsMatch = html.match(/<strong[^>]*>Constraints:<\/strong>\s*<ul>([\s\S]*?)<\/ul>/i);
    if (constraintsMatch) {
      const liRegex = /<li>([\s\S]*?)<\/li>/gi;
      let liMatch;
      while ((liMatch = liRegex.exec(constraintsMatch[1])) !== null) {
        const text = liMatch[1]
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&le;/g, '<=')
          .replace(/&ge;/g, '>=')
          .trim();
        if (text) constraints.push(text);
      }
    }
  } catch (e) {}
  return constraints;
}

/**
 * Transforms raw LeetCode GraphQL response into Problem Mongoose schema format
 */
function transformProblem(lcDetail, summaryInfo = {}) {
  if (!lcDetail || (!lcDetail.content && !lcDetail.title)) return null;

  let acceptanceRate = summaryInfo.acRate || 0;
  if (!acceptanceRate && lcDetail.stats) {
    try {
      const stats = JSON.parse(lcDetail.stats);
      acceptanceRate = parseFloat(stats.acRate) || 0;
    } catch (e) {}
  }

  const tags = lcDetail.topicTags ? lcDetail.topicTags.map(t => t.name) : (summaryInfo.tags || []);
  const category = tags.length > 0 ? tags[0] : 'Algorithms';

  const starterCode = {
    javascript: "function solution() {\n  // Write code here\n}",
    python: "def solution():\n    # Write code here\n    pass",
    java: "class Solution {\n    // Write code here\n}",
    cpp: "class Solution {\npublic:\n    // Write code here\n};"
  };

  if (lcDetail.codeSnippets && Array.isArray(lcDetail.codeSnippets)) {
    const js = lcDetail.codeSnippets.find(c => c.langSlug === 'javascript');
    const py = lcDetail.codeSnippets.find(c => c.langSlug === 'python3' || c.langSlug === 'python');
    const java = lcDetail.codeSnippets.find(c => c.langSlug === 'java');
    const cpp = lcDetail.codeSnippets.find(c => c.langSlug === 'cpp');

    if (js) starterCode.javascript = js.code;
    if (py) starterCode.python = py.code;
    if (java) starterCode.java = java.code;
    if (cpp) starterCode.cpp = cpp.code;
  }

  const htmlContent = lcDetail.content || summaryInfo.description || `<p>${lcDetail.title}</p>`;
  const examples = parseExamplesFromHtml(htmlContent);
  const constraints = parseConstraintsFromHtml(htmlContent);

  const rawTestcases = lcDetail.exampleTestcases ? lcDetail.exampleTestcases.split('\n').filter(t => t.trim().length > 0) : [];
  const testCases = [];
  if (rawTestcases.length > 0) {
    testCases.push({
      input: rawTestcases.slice(0, Math.ceil(rawTestcases.length / 2)).join('\n'),
      expectedOutput: examples[0]?.output || '',
      isHidden: false
    });
    if (rawTestcases.length > 2) {
      testCases.push({
        input: rawTestcases.slice(Math.ceil(rawTestcases.length / 2)).join('\n'),
        expectedOutput: examples[1]?.output || '',
        isHidden: true
      });
    }
  }

  return {
    title: lcDetail.title || summaryInfo.title,
    titleSlug: lcDetail.titleSlug || summaryInfo.titleSlug,
    acceptance: parseFloat(acceptanceRate.toFixed(1)),
    difficulty: lcDetail.difficulty || summaryInfo.difficulty || 'Medium',
    category,
    tags,
    description: htmlContent,
    examples: examples.length > 0 ? examples : [{ input: "See description", output: "See description", explanation: "" }],
    constraints: constraints.length > 0 ? constraints : ["See problem description for constraints."],
    starterCode,
    testCases: testCases.length > 0 ? testCases : [{ input: "", expectedOutput: "", isHidden: false }]
  };
}

/**
 * Fetches problem list from LeetCode GraphQL API
 */
async function fetchProblemList() {
  console.log('📡 [1/3] Fetching problem list from LeetCode GraphQL API...');
  const listQuery = `
    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
        total: totalNum
        questions: data {
          titleSlug
          title
          difficulty
          acRate
          isPaidOnly
          topicTags { name }
        }
      }
    }
  `;

  let freeQuestions = [];
  let skip = 0;
  const limit = 100;
  let totalNum = 0;

  try {
    const res = await axios.post(LEETCODE_API_ENDPOINT, {
      query: listQuery,
      variables: { categorySlug: '', limit, skip: 0, filters: {} }
    }, { headers: HEADERS, timeout: 12000 });

    const data = res.data?.data?.problemsetQuestionList;
    if (!data || !Array.isArray(data.questions)) {
      throw new Error('Invalid response structure from LeetCode GraphQL API');
    }

    totalNum = data.total || 0;
    console.log(`   Found total ${totalNum} questions on LeetCode.`);

    const firstBatch = data.questions.filter(q => !q.isPaidOnly);
    freeQuestions.push(...firstBatch);
    skip += limit;

    while (freeQuestions.length < TARGET_FREE_PROBLEMS && skip < totalNum) {
      await delay(DELAY_MS);
      console.log(`   Fetched ${freeQuestions.length} free problems... requesting offset skip=${skip}`);
      const nextRes = await axios.post(LEETCODE_API_ENDPOINT, {
        query: listQuery,
        variables: { categorySlug: '', limit, skip, filters: {} }
      }, { headers: HEADERS, timeout: 12000 });

      const batch = nextRes.data?.data?.problemsetQuestionList?.questions || [];
      if (batch.length === 0) break;

      const freeBatch = batch.filter(q => !q.isPaidOnly);
      freeQuestions.push(...freeBatch);
      skip += limit;
    }

    console.log(`✅ [1/3] Successfully fetched metadata for ${freeQuestions.length} free problems!`);
    return freeQuestions.slice(0, TARGET_FREE_PROBLEMS);
  } catch (err) {
    console.error(`⚠️ [1/3] Failed to fetch problem list from LeetCode API: ${err.message}`);
    return null; // Triggers fallback
  }
}

/**
 * Fetches full detail for a single problem by titleSlug
 */
async function fetchProblemDetail(titleSlug) {
  const detailQuery = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        title
        titleSlug
        content
        difficulty
        stats
        topicTags { name }
        codeSnippets { langSlug code }
        exampleTestcases
      }
    }
  `;

  try {
    const res = await axios.post(LEETCODE_API_ENDPOINT, {
      query: detailQuery,
      variables: { titleSlug }
    }, { headers: HEADERS, timeout: 10000 });

    return res.data?.data?.question || null;
  } catch (err) {
    console.error(`   ⚠️ Error fetching detail for "${titleSlug}": ${err.message}`);
    return null;
  }
}

/**
 * Seeds local datastore fallback files (problems_bank.json and top200Problems.json)
 */
async function syncToLocalDatastore(allProcessedProblems) {
  try {
    await fs.mkdir(path.dirname(PROBLEMS_BANK_PATH), { recursive: true });
    await fs.writeFile(PROBLEMS_BANK_PATH, JSON.stringify(allProcessedProblems, null, 2), 'utf-8');
    await fs.writeFile(FALLBACK_JSON_PATH, JSON.stringify(allProcessedProblems.slice(0, 200), null, 2), 'utf-8');
    console.log(`📁 Synced ${allProcessedProblems.length} problems to local datastore file: problems_bank.json`);
  } catch (err) {
    console.error(`⚠️ Could not sync local datastore files: ${err.message}`);
  }
}

/**
 * Seed database using local top200Problems.json fallback file
 */
async function seedFromFallbackJson(isMongoConnected) {
  console.log('\n📁 [FALLBACK] Seeding database from local top200Problems.json...');
  try {
    const content = await fs.readFile(FALLBACK_JSON_PATH, 'utf-8');
    const problems = JSON.parse(content);
    console.log(`   Found ${problems.length} problems in local fallback file.`);

    if (!Array.isArray(problems) || problems.length === 0) {
      throw new Error('Local fallback file is empty or invalid.');
    }

    if (isMongoConnected) {
      const bulkOps = problems.map(prob => ({
        updateOne: {
          filter: { titleSlug: prob.titleSlug },
          update: { $set: prob },
          upsert: true
        }
      }));

      const result = await Problem.bulkWrite(bulkOps);
      console.log(`🎉 [FALLBACK COMPLETE] Successfully upserted ${result.upsertedCount + result.modifiedCount + result.matchedCount} problems from fallback file to MongoDB!`);
    } else {
      await syncToLocalDatastore(problems);
      console.log(`🎉 [FALLBACK COMPLETE] Seeded ${problems.length} problems to local datastore!`);
    }
    return true;
  } catch (err) {
    console.error(`❌ [FALLBACK ERROR] Failed to seed from local JSON: ${err.message}`);
    return false;
  }
}

/**
 * Main seeding function
 */
export async function seedLeetCodeProblems() {
  const mongoUri = process.env.MONGODB_URI;
  let isMongoConnected = false;

  console.log('⚡ Attempting connection to MongoDB...');
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
      isMongoConnected = true;
      console.log('✅ Connected to MongoDB successfully.\n');
    } catch (err) {
      console.warn(`⚠️ MongoDB connection error: ${err.message}. (Will operate in local datastore mode)\n`);
    }
  } else {
    console.warn('⚠️ MONGODB_URI not provided. Operating in local datastore mode.\n');
  }

  // 1. Fetch free problems list from LeetCode
  const freeQuestions = await fetchProblemList();

  if (!freeQuestions || freeQuestions.length === 0) {
    console.log('⚠️ Could not fetch problem list from LeetCode API (offline/rate-limited). Switching to Fallback JSON.');
    await seedFromFallbackJson(isMongoConnected);
    if (isMongoConnected) await mongoose.disconnect();
    return;
  }

  // 2. Fetch details & process in batches
  console.log(`\n📥 [2/3] Fetching full problem details for ${freeQuestions.length} problems...`);
  
  let currentBatchOps = [];
  let allProcessedProblems = [];
  let totalProcessed = 0;
  let batchIndex = 1;

  for (let i = 0; i < freeQuestions.length; i++) {
    const qInfo = freeQuestions[i];
    await delay(DELAY_MS);

    const detail = await fetchProblemDetail(qInfo.titleSlug);
    const transformed = transformProblem(detail || qInfo, qInfo);

    if (transformed) {
      allProcessedProblems.push(transformed);
      currentBatchOps.push({
        updateOne: {
          filter: { titleSlug: transformed.titleSlug },
          update: { $set: transformed },
          upsert: true
        }
      });
      totalProcessed++;
    }

    if ((i + 1) % 50 === 0 || i === freeQuestions.length - 1) {
      console.log(`   Fetched details for ${i + 1} / ${freeQuestions.length} problems...`);
    }

    // Flush batch to MongoDB if connected
    if (isMongoConnected && (currentBatchOps.length >= BATCH_SIZE || (i === freeQuestions.length - 1 && currentBatchOps.length > 0))) {
      try {
        console.log(`💾 [3/3] Executing bulkWrite for Batch #${batchIndex} (${currentBatchOps.length} problems)...`);
        await Problem.bulkWrite(currentBatchOps);
        console.log(`   ✅ Batch #${batchIndex} saved to MongoDB! Total upserted so far: ${totalProcessed}`);
        batchIndex++;
        currentBatchOps = [];
      } catch (bulkErr) {
        console.error(`   ❌ Error saving batch #${batchIndex}: ${bulkErr.message}`);
        currentBatchOps = [];
      }
    }
  }

  // Always sync to local datastore file as backup
  await syncToLocalDatastore(allProcessedProblems);

  console.log(`\n🎉 [COMPLETE] Successfully processed and seeded ${totalProcessed} LeetCode problems!`);
  if (isMongoConnected) {
    const countInDb = await Problem.countDocuments();
    console.log(`📊 Total Problem documents in MongoDB database: ${countInDb}\n`);
    await mongoose.disconnect();
    console.log('👋 MongoDB connection closed.');
  }
}

// Execute if run directly from command line
if (process.argv[1] && process.argv[1].includes('seedLeetCodeProblems.js')) {
  seedLeetCodeProblems()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal seeding error:', err);
      process.exit(1);
    });
}
