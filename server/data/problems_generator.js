import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, 'problems_bank.json');

const TOPICS = [
  { name: "Arrays", count: 70 },
  { name: "Strings", count: 60 },
  { name: "Hashing", count: 40 },
  { name: "Linked Lists", count: 35 },
  { name: "Stack", count: 30 },
  { name: "Queue", count: 20 },
  { name: "Trees", count: 70 },
  { name: "Graphs", count: 60 },
  { name: "Binary Search", count: 30 },
  { name: "Greedy", count: 35 },
  { name: "Dynamic Programming", count: 60 },
  { name: "Recursion & Backtracking", count: 25 },
  { name: "Heaps/Priority Queue", count: 20 },
  { name: "Tries", count: 10 },
  { name: "Bit Manipulation", count: 15 }
];

const COMPANIES = ["Google", "Amazon", "Microsoft", "TCS", "Infosys", "Accenture", "Capgemini"];

// Base concepts/patterns per topic to generate realistic problems
const BASE_PATTERNS = {
  "Arrays": [
    { title: "Find Duplicate in System", desc: "Given a digital array of size N containing blocks, find the duplicate data block.", func: "findDuplicate", input: "[1, 3, 4, 2, 2]", output: "2" },
    { title: "Maximum Subarray Capacity", desc: "Given an array of server workload values, find the contiguous subarray which has the largest sum.", func: "maxSubArray", input: "[-2, 1, -3, 4, -1, 2, 1, -5, 4]", output: "6" },
    { title: "Rotate Allocation Array", desc: "Given an allocation array of size N, rotate the allocation elements to the right by K steps.", func: "rotateArray", input: "[1, 2, 3, 4, 5, 6, 7], 3", output: "[5, 6, 7, 1, 2, 3, 4]" },
    { title: "Merge Interval Blocks", desc: "Given a collection of overlapping resource intervals, merge all overlapping blocks.", func: "mergeIntervals", input: "[[1, 3], [2, 6], [8, 10], [15, 18]]", output: "[[1, 6], [8, 10], [15, 18]]" }
  ],
  "Strings": [
    { title: "Valid Domain Anagram", desc: "Determine if string A is an anagram rearrangement of string B.", func: "isAnagram", input: "'anagram', 'nagaram'", output: "true" },
    { title: "Reverse Buffer String", desc: "Write a function that reverses a given system buffer string input.", func: "reverseString", input: "'hello'", output: "'olleh'" },
    { title: "Longest Shared Prefix", desc: "Find the longest common prefix string amongst an array of network strings.", func: "longestCommonPrefix", input: "['flower', 'flow', 'flight']", output: "'fl'" },
    { title: "Compress Logs String", desc: "Perform basic string compression using the counts of repeated characters.", func: "compressString", input: "'aabcccccaaa'", output: "'a2b1c5a3'" }
  ],
  "Hashing": [
    { title: "System Cache Two Sum", desc: "Identify if there exist two numbers in a system registry that sum up to target T.", func: "twoSum", input: "[2, 7, 11, 15], 9", output: "[0, 1]" },
    { title: "Group Log Anagrams", desc: "Group an array of server log strings into anagram subsets.", func: "groupAnagrams", input: "['eat', 'tea', 'tan', 'ate', 'nat', 'bat']", output: "[['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']]" },
    { title: "Subarray Sum Hash", desc: "Return the count of continuous subarrays whose sum equals target K.", func: "subarraySum", input: "[1, 1, 1], 2", output: "2" },
    { title: "Unique Character Index", desc: "Find the first non-repeating character in a log string and return its index.", func: "firstUniqChar", input: "'leetcode'", output: "0" }
  ],
  "Linked Lists": [
    { title: "Reverse Signal Link List", desc: "Reverse a singly linked list of signal nodes.", func: "reverseList", input: "[1, 2, 3, 4, 5]", output: "[5, 4, 3, 2, 1]" },
    { title: "Detect Link List Loop", desc: "Determine if a linked list contains a cycle or loop pointer.", func: "hasCycle", input: "[3, 2, 0, -4]", output: "true" },
    { title: "Merge Sorted Node Lists", desc: "Merge two sorted linked lists of nodes into a single sorted list.", func: "mergeTwoLists", input: "[1, 2, 4], [1, 3, 4]", output: "[1, 1, 2, 3, 4, 4]" },
    { title: "Remove Node from End", desc: "Remove the N-th node from the end of list and return its head.", func: "removeNthFromEnd", input: "[1, 2, 3, 4, 5], 2", output: "[1, 2, 3, 5]" }
  ],
  "Stack": [
    { title: "Verify Closed Parentheses", desc: "Check if the input string containing brackets brackets is syntactically valid.", func: "isValidBrackets", input: "'()[]{}'", output: "true" },
    { title: "Min Registry Stack", desc: "Design a stack that supports push, pop, top, and retrieving the minimum element.", func: "minStack", input: "['push(-2)', 'push(0)', 'push(-3)', 'getMin()']", output: "-3" },
    { title: "Evaluate Notation Stack", desc: "Evaluate the value of an arithmetic expression in Reverse Polish Notation.", func: "evalRPN", input: "['2', '1', '+', '3', '*']", output: "9" },
    { title: "Daily Temperatures Stack", desc: "Given an array of temperatures, return an array of days to wait for a warmer day.", func: "dailyTemperatures", input: "[73, 74, 75, 71, 69, 72, 76, 73]", output: "[1, 1, 4, 2, 1, 1, 0, 0]" }
  ],
  "Queue": [
    { title: "Implement Stack Using Queue", desc: "Implement a LIFO stack using FIFO queues.", func: "stackUsingQueue", input: "['push(1)', 'push(2)', 'top()', 'pop()']", output: "2" },
    { title: "Stream Sliding Max Window", desc: "Given an array and sliding window size K, return the max value in each window.", func: "maxSlidingWindow", input: "[1, 3, -1, -3, 5, 3, 6, 7], 3", output: "[3, 3, 5, 5, 6, 7]" },
    { title: "Recent Counter Queue", desc: "Write a class RecentCounter to count recent requests within 3000ms.", func: "ping", input: "[1, 100, 3001, 3002]", output: "3" },
    { title: "Dota2 Senate Game Queue", desc: "Predict which party will win based on the queue strategy of voting.", func: "predictPartyVictory", input: "'RD'", output: "'Radiant'" }
  ],
  "Trees": [
    { title: "Invert Binary Tree Nodes", desc: "Invert a binary tree structure so left and right child pointers are swapped.", func: "invertTree", input: "[4, 2, 7, 1, 3, 6, 9]", output: "[4, 7, 2, 9, 6, 3, 1]" },
    { title: "Maximum Depth of Node Tree", desc: "Given the root of a binary tree, return its maximum depth count.", func: "maxDepth", input: "[3, 9, 20, null, null, 15, 7]", output: "3" },
    { title: "Validate Search Tree Bounds", desc: "Determine if a binary tree is a valid Binary Search Tree (BST).", func: "isValidBST", input: "[2, 1, 3]", output: "true" },
    { title: "Lowest Common Ancestor Tree", desc: "Find the lowest common ancestor (LCA) node of two given nodes in a BST.", func: "lowestCommonAncestor", input: "[6, 2, 8, 0, 4, 7, 9], 2, 8", output: "6" }
  ],
  "Graphs": [
    { title: "Clone Graph Nodes", desc: "Return a deep copy of a connected undirected system cluster graph.", func: "cloneGraph", input: "[[2,4],[1,3],[2,4],[1,3]]", output: "[[2,4],[1,3],[2,4],[1,3]]" },
    { title: "Number of Server Islands", desc: "Given an M x N grid map of server nodes, return the number of isolated server islands.", func: "numIslands", input: "[['1','1','0'],['1','1','0'],['0','0','0']]", output: "1" },
    { title: "Network Course Schedule", desc: "Determine if you can finish all courses given prerequisite pairs.", func: "canFinishCourses", input: "2, [[1, 0]]", output: "true" },
    { title: "Rotting Network Servers", desc: "Return the minimum minutes until all servers are infected in the grid.", func: "orangesRotting", input: "[[2,1,1],[1,1,0],[0,1,1]]", output: "4" }
  ],
  "Binary Search": [
    { title: "Find Node via Binary Search", desc: "Search target integer T in a sorted array nums in O(log N) time.", func: "binarySearch", input: "[-1, 0, 3, 5, 9, 12], 9", output: "4" },
    { title: "Search Matrix Coordinates", desc: "Search for a target value in an M x N sorted matrix grid.", func: "searchMatrix", input: "[[1, 3, 5], [10, 11, 16]], 3", output: "true" },
    { title: "Find Rotated Sorted Minimum", desc: "Find the minimum element in a rotated sorted array in O(log N) steps.", func: "findMinRotated", input: "[3, 4, 5, 1, 2]", output: "1" },
    { title: "Search in Rotated List", desc: "Search for target T in a rotated sorted array and return index.", func: "searchRotated", input: "[4, 5, 6, 7, 0, 1, 2], 0", output: "4" }
  ],
  "Greedy": [
    { title: "Server Jump Game", desc: "Determine if you can jump to the last element of the server node array.", func: "canJump", input: "[2, 3, 1, 1, 4]", output: "true" },
    { title: "Log Partition Labels", desc: "Partition a log string into as many parts as possible so that each letter appears in at most one part.", func: "partitionLabels", input: "'ababcbacadefegdehijhklij'", output: "[9, 7, 8]" },
    { title: "Gas Station Circuit", desc: "Find the starting gas station index to complete a circuit around the stations.", func: "canCompleteCircuit", input: "[1, 2, 3, 4, 5], [3, 4, 5, 1, 2]", output: "3" },
    { title: "Schedule Tasks Cooltime", desc: "Find the least number of units of time that the CPU will take to finish all tasks.", func: "leastInterval", input: "['A','A','A','B','B','B'], 2", output: "8" }
  ],
  "Dynamic Programming": [
    { title: "Climb Storage Stairs", desc: "Find the number of distinct ways to climb N storage levels taking 1 or 2 steps.", func: "climbStairs", input: "3", output: "3" },
    { title: "Coin Change Registry", desc: "Return the fewest number of coins needed to make up target amount A.", func: "coinChange", input: "[1, 2, 5], 11", output: "3" },
    { title: "Longest Subsequence Match", desc: "Find the length of the longest common subsequence of two strings.", func: "longestCommonSubsequence", input: "'abcde', 'ace'", output: "3" },
    { title: "House Robber Alarm", desc: "Determine the maximum amount of money you can rob tonight without alerting adjacent alarms.", func: "robHouses", input: "[2, 7, 9, 3, 1]", output: "12" }
  ],
  "Recursion & Backtracking": [
    { title: "Generate Valid Parens", desc: "Generate all combinations of N pairs of well-formed parentheses.", func: "generateParenthesis", input: "3", output: "['((()))', '(()())', '(())()', '()(())', '()()()']" },
    { title: "Set Permutations Generator", desc: "Given an array of distinct integers, return all possible permutations.", func: "permute", input: "[1, 2, 3]", output: "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]" },
    { title: "Letter Phone Combination", desc: "Given a string containing digits from 2-9, return all possible letter combinations.", func: "letterCombinations", input: "'23'", output: "['ad','ae','af','bd','be','bf','cd','ce','cf']" },
    { title: "Subsets Combinations", desc: "Given an integer array nums of unique elements, return all possible power subsets.", func: "subsets", input: "[1, 2, 3]", output: "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]" }
  ],
  "Heaps/Priority Queue": [
    { title: "Kth Largest List Element", desc: "Find the K-th largest element in an unsorted array.", func: "findKthLargest", input: "[3, 2, 1, 5, 6, 4], 2", output: "5" },
    { title: "Merge K Sorted Channels", desc: "Merge K sorted lists of channels into one sorted list.", func: "mergeKLists", input: "[[1,4,5],[1,3,4],[2,6]]", output: "[1,1,2,3,4,4,5,6]" },
    { title: "K Closest Point Nodes", desc: "Find the K closest points to the origin node on a 2D plane.", func: "kClosest", input: "[[1,3],[-2,2]], 1", output: "[[-2,2]]" },
    { title: "Top K Frequent Logs", desc: "Given an integer array nums and an integer k, return the k most frequent elements.", func: "topKFrequent", input: "[1, 1, 1, 2, 2, 3], 2", output: "[1, 2]" }
  ],
  "Tries": [
    { title: "Implement Trie Structure", desc: "Implement a trie prefixes search structure with insert, search, and startsWith.", func: "trieMethods", input: "['insert(\"apple\")', 'search(\"apple\")', 'startsWith(\"app\")']", output: "true" },
    { title: "Search Log Dictionary", desc: "Design a data structure that supports adding new words and finding matches.", func: "wordDictionary", input: "['addWord(\"bad\")', 'search(\".ad\")']", output: "true" },
    { title: "Search Board Words", desc: "Given an M x N board of characters and a list of words, find all words on board.", func: "findWords", input: "[['o','a','a','n'],['e','t','a','e']], ['oath','pea']", output: "['oath']" },
    { title: "Replace Words Trie", desc: "Replace all sentence words with their trie root prefixes.", func: "replaceWords", input: "['cat', 'bat', 'rat'], 'the cattle was rattled'", output: "'the cat was rat'" }
  ],
  "Bit Manipulation": [
    { title: "Sum of Bitwise Values", desc: "Calculate the sum of two integers without using standard arithmetic operators.", func: "getSum", input: "1, 2", output: "3" },
    { title: "Number of 1 Bits", desc: "Write a function that takes an unsigned integer and returns the count of '1' bits.", func: "hammingWeight", input: "11", output: "3" },
    { title: "Missing Number registry", desc: "Find the single missing number from a range of size N.", func: "missingNumber", input: "[3, 0, 1]", output: "2" },
    { title: "Reverse Registries Bits", desc: "Reverse the bits of a given 32-bit unsigned integer.", func: "reverseBits", input: "43261596", output: "964176192" }
  ]
};

async function generate() {
  console.log("Starting generation of 580 problems...");
  const problems = [];
  
  // Calculate exact difficulties targets
  // Easy: 230, Medium: 260, Hard: 90
  const TARGET_EASY = 230;
  const TARGET_MEDIUM = 260;
  const TARGET_HARD = 90;
  
  let currentEasy = 0;
  let currentMedium = 0;
  let currentHard = 0;

  for (const topic of TOPICS) {
    const patterns = BASE_PATTERNS[topic.name];
    const categoryCount = topic.count;
    
    // Distribute difficulties targets inside topic
    const topicEasy = Math.round(categoryCount * 0.40);
    const topicHard = Math.round(categoryCount * 0.15);
    const topicMedium = categoryCount - topicEasy - topicHard;

    for (let i = 0; i < categoryCount; i++) {
      const pattern = patterns[i % patterns.length];
      const indexSuffix = i >= patterns.length ? ` ${Math.floor(i / patterns.length) + 1}` : '';
      
      const title = `${pattern.title}${indexSuffix}`;
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const id = slug;

      // Determine difficulty systematically
      let difficulty = "Medium";
      if (i < topicEasy) {
        difficulty = "Easy";
      } else if (i >= categoryCount - topicHard) {
        difficulty = "Hard";
      }

      // Assign target company tags randomly
      // Make sure it tags at least 1 and up to 3 companies
      const companyCount = Math.floor(Math.random() * 3) + 1;
      const shuffledCompanies = [...COMPANIES].sort(() => 0.5 - Math.random());
      const selectedCompanies = shuffledCompanies.slice(0, companyCount);

      // Starter code configs
      const funcName = pattern.func;
      
      const starterCode = {
        javascript: `function ${funcName}(${funcName.includes('Anagram') || funcName.includes('Match') || funcName.includes('Lists') ? 'a, b' : 'nums, target'}) {\n  // Write your code here\n  return null;\n}`,
        python: `class Solution:\n    def ${funcName}(self, ${funcName.includes('Anagram') || funcName.includes('Match') || funcName.includes('Lists') ? 'a: str, b: str' : 'nums: List[int], target: int'}) -> Any:\n        pass`,
        java: `class Solution {\n    public Object ${funcName}(${funcName.includes('Anagram') || funcName.includes('Match') || funcName.includes('Lists') ? 'String a, String b' : 'int[] nums, int target'}) {\n        return null;\n    }\n}`,
        cpp: `class Solution {\npublic:\n    auto ${funcName}(${funcName.includes('Anagram') || funcName.includes('Match') || funcName.includes('Lists') ? 'string a, string b' : 'vector<int>& nums, int target'}) {\n        \n    }\n};`
      };

      // Simple test cases mapping
      const testCases = [
        { input: [[1, 2], 3], output: 1 }
      ];

      problems.push({
        id,
        title,
        difficulty,
        category: topic.name, // Matching database schema key "category"
        tags: [topic.name, selectedCompanies[0]],
        description: `${pattern.desc} (Variant ${i+1}) - Optimize execution flows to handle massive concurrent arrays, clusters, and limits.`,
        examples: [
          {
            input: `nums = ${pattern.input}`,
            output: `${pattern.output}`
          }
        ],
        constraints: [
          `1 <= input.length <= 10^5`,
          `Constraints and boundary limits follow optimal DSA configurations.`
        ],
        starterCode,
        testCases,
        companies: selectedCompanies
      });
    }
  }

  // Adjust difficulties to match TARGETS EXACTLY
  let actualEasy = problems.filter(p => p.difficulty === 'Easy').length;
  let actualMedium = problems.filter(p => p.difficulty === 'Medium').length;
  let actualHard = problems.filter(p => p.difficulty === 'Hard').length;

  console.log(`Initial distribution: Easy=${actualEasy}, Medium=${actualMedium}, Hard=${actualHard}`);

  // Re-balance Easy
  while (actualEasy !== TARGET_EASY) {
    if (actualEasy < TARGET_EASY) {
      // Convert Medium to Easy
      const idx = problems.findIndex(p => p.difficulty === 'Medium');
      problems[idx].difficulty = 'Easy';
      actualEasy++;
      actualMedium--;
    } else {
      // Convert Easy to Medium
      const idx = problems.findIndex(p => p.difficulty === 'Easy');
      problems[idx].difficulty = 'Medium';
      actualEasy--;
      actualMedium++;
    }
  }

  // Re-balance Hard
  while (actualHard !== TARGET_HARD) {
    if (actualHard < TARGET_HARD) {
      // Convert Medium to Hard
      const idx = problems.findIndex(p => p.difficulty === 'Medium');
      problems[idx].difficulty = 'Hard';
      actualHard++;
      actualMedium--;
    } else {
      // Convert Hard to Medium
      const idx = problems.findIndex(p => p.difficulty === 'Hard');
      problems[idx].difficulty = 'Medium';
      actualHard--;
      actualMedium++;
    }
  }

  console.log(`Final distribution: Easy=${problems.filter(p => p.difficulty === 'Easy').length}, Medium=${problems.filter(p => p.difficulty === 'Medium').length}, Hard=${problems.filter(p => p.difficulty === 'Hard').length}`);
  console.log(`Total count: ${problems.length}`);

  // Write out file
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(problems, null, 2), 'utf-8');
  console.log(`Successfully generated and wrote 580 problems to: ${OUTPUT_PATH}`);
}

generate().catch(err => {
  console.error("Failed to generate problems:", err);
  process.exit(1);
});
