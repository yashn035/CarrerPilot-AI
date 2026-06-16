// =================== MOCK DATA: Problems ===================

export const mockProblemBank = [
    {
        id: "two-sum",
        title: "Two Sum",
        difficulty: "Easy",
        category: "Arrays",
        tags: ["Arrays", "Hash Table"],
        description: "Given an array of integers `nums` and an integer `target`, return *indices of the two numbers such that they add up to `target`*.\n\nYou may assume that each input would have ***exactly* one solution**, and you may not use the *same* element twice.\n\nYou can return the answer in any order.",
        examples: [
            { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." }
        ],
        constraints: ["`2 <= nums.length <= 10^4`", "`Only one valid answer exists.`"],
        starterCode: {
            javascript: "function twoSum(nums, target) {\n  // Write your code here\n  \n}",
            python: "class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass"
        }
    },
    {
        id: "valid-parentheses",
        title: "Valid Parentheses",
        difficulty: "Easy",
        category: "Strings",
        tags: ["Stack", "Strings"],
        description: "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
        examples: [
            { input: "s = \"()\"", output: "true" }
        ],
        constraints: ["`1 <= s.length <= 10^4`", "`s` consists of parentheses only."],
        starterCode: {
            javascript: "function isValid(s) {\n  // Write your code here\n  \n}",
            python: "class Solution:\n    def isValid(self, s: str) -> bool:\n        pass"
        }
    },
    {
        id: "merge-intervals",
        title: "Merge Intervals",
        difficulty: "Medium",
        category: "Arrays",
        tags: ["Arrays", "Sorting"],
        description: "Given an array of `intervals` where `intervals[i] = [starti, endi]`, merge all overlapping intervals, and return *an array of the non-overlapping intervals that cover all the intervals in the input*.",
        examples: [
            { input: "intervals = [[1,3],[2,6],[8,10]]", output: "[[1,6],[8,10]]" }
        ],
        constraints: ["`1 <= intervals.length <= 10^4`"],
        starterCode: {
            javascript: "function merge(intervals) {\n  // Write your code here\n  \n}",
            python: "class Solution:\n    def merge(self, intervals: List[List[int]]) -> List[List[int]]:\n        pass"
        }
    }
];

// =================== MOCK DATA: Approaches ===================

export const mockApproachesList = {
    'two-sum': [
        { name: "Brute Force", timeComplexity: "O(N²)", hint: "Traverse every pair using nested loops." },
        { name: "Sorted Two-Pointer", timeComplexity: "O(N log N)", hint: "Sort elements first, search inwards." },
        { name: "Hash Map Cache", timeComplexity: "O(N)", hint: "Store visited elements in a Map for fast lookups." }
    ],
    'valid-parentheses': [
        { name: "Brute Force Replace", timeComplexity: "O(N²)", hint: "Repeatedly replace match brackets pairs with space." },
        { name: "Stack Allocator", timeComplexity: "O(N)", hint: "Store open brackets in a stack, pop on close brackets." }
    ],
    'default': [
        { name: "Brute Force Iteration", timeComplexity: "O(N²)", hint: "Standard sequential permutation evaluation." },
        { name: "Optimal Hash Mapping", timeComplexity: "O(N)", hint: "Store traversals in key arrays to decrease loop passes." }
    ]
};

// =================== MOCK DATA: Company Tracks ===================

export const mockCompanyData = {
    'Google': {
        topics: [
            { subject: 'Graphs', percentage: 40 },
            { subject: 'Dynamic Programming', percentage: 30 },
            { subject: 'Trees', percentage: 15 },
            { subject: 'Arrays & Strings', percentage: 15 }
        ],
        ratios: { easy: 10, medium: 60, hard: 30 }
    },
    'Amazon': {
        topics: [
            { subject: 'Trees', percentage: 30 },
            { subject: 'Greedy Algorithms', percentage: 25 },
            { subject: 'Arrays & Strings', percentage: 25 },
            { subject: 'Graphs', percentage: 20 }
        ],
        ratios: { easy: 20, medium: 60, hard: 20 }
    },
    'Microsoft': {
        topics: [
            { subject: 'Arrays & Strings', percentage: 35 },
            { subject: 'Linked Lists', percentage: 25 },
            { subject: 'Trees', percentage: 25 },
            { subject: 'Dynamic Programming', percentage: 15 }
        ],
        ratios: { easy: 25, medium: 55, hard: 20 }
    },
    'TCS': {
        topics: [
            { subject: 'Arrays & Strings', percentage: 50 },
            { subject: 'Basic Logic / Loops', percentage: 30 },
            { subject: 'Stacks & Queues', percentage: 20 }
        ],
        ratios: { easy: 60, medium: 35, hard: 5 }
    },
    'Infosys': {
        topics: [
            { subject: 'Basic Logic / Loops', percentage: 45 },
            { subject: 'Arrays & Strings', percentage: 35 },
            { subject: 'Linked Lists', percentage: 20 }
        ],
        ratios: { easy: 50, medium: 45, hard: 5 }
    },
    'Accenture': {
        topics: [
            { subject: 'Arrays & Strings', percentage: 40 },
            { subject: 'Basic Logic', percentage: 40 },
            { subject: 'Greedy', percentage: 20 }
        ],
        ratios: { easy: 55, medium: 40, hard: 5 }
    },
    'Capgemini': {
        topics: [
            { subject: 'Arrays & Strings', percentage: 45 },
            { subject: 'Linked Lists', percentage: 35 },
            { subject: 'Stacks', percentage: 20 }
        ],
        ratios: { easy: 50, medium: 45, hard: 5 }
    }
};
