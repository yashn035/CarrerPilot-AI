import logger from '../../../shared/logger/logger.js';

/**
 * Handles fallback generation when AI is offline or rate limited.
 * Returns structured replies matching the strict AI Mentor schema.
 * @param {string} mode 
 * @param {string} message 
 * @param {Object} user 
 * @param {Array} history 
 * @returns {Object}
 */
export function generateFallbackResponse(mode, message, user, history = []) {
  logger.info(`Fallback engine activated for mode: ${mode}`);
  const msgLower = (message || "").toLowerCase();
  const targetRole = user?.targetRole || "Software Engineer";

  if (mode === 'interview') {
    return handleInterviewFallback(msgLower, history);
  } else if (mode === 'reviewer') {
    return handleReviewerFallback(msgLower, targetRole);
  } else if (mode === 'planner') {
    return handlePlannerFallback(msgLower, targetRole);
  } else {
    return handleMentorFallback(msgLower, targetRole);
  }
}

function handleInterviewFallback(msg, history) {
  const qCount = history.filter(h => h.role === 'mentor').length;

  if (qCount === 0 || msg.includes("start") || msg.includes("hello") || msg.includes("hi")) {
    return {
      mode: "interview",
      message: "Welcome to your mock interview simulation! I'll act as your interviewer. Let's start with a foundational question:\n\n**Can you explain how prototype inheritance works in JavaScript, and how it differs from class-based inheritance?**",
      score: null,
      feedback: "Welcome session initiated.",
      next_action: "Provide an explanation of JavaScript prototypical behavior, closures, or class structures."
    };
  }

  if (qCount === 1) {
    const score = msg.includes("prototype") || msg.includes("__proto__") || msg.includes("construct") ? 8 : 5;
    return {
      mode: "interview",
      message: "Excellent. Let's step up to algorithms:\n\n**Given an array of integers, how would you find the maximum subarray sum in O(N) time complexity? What algorithm would you use?**",
      score,
      feedback: score === 8 
        ? "Good job! You mentioned __proto__ and constructor prototypes." 
        : "Your answer was a bit brief. Mentioning __proto__ or the constructor linking chain adds technical depth.",
      next_action: "Explain Kadane's algorithm or linear scanning concepts."
    };
  }

  if (qCount === 2) {
    const score = msg.includes("kadane") || msg.includes("dynamic programming") || msg.includes("sliding window") ? 9 : 6;
    return {
      mode: "interview",
      message: "Great. Let's transition to system design:\n\n**How would you design a secure, distributed rate limiter that handles up to 10,000 requests per second across multiple servers?**",
      score,
      feedback: score === 9 
        ? "Strong knowledge of algorithms. Kadane's algorithm is indeed the optimal choice for maximum subarray sum." 
        : "You got the basic array scanning down, but mention Kadane's algorithm or sliding window technique for maximum credit.",
      next_action: "Propose rate-limiting strategies like Token Bucket, Leaky Bucket, or Redis Sliding Window logs."
    };
  }

  // Final Evaluation
  return {
    mode: "interview",
    message: "Thank you for completing this mock interview loop! I've cataloged your responses.",
    score: 8,
    feedback: "The candidate shows clear proficiency in prototype delegation and linear algorithm scaling. Ready for company loops, but could refine distributed rate limiter architecture.",
    next_action: "Review rate limiting token buckets and sliding window Redis configurations in the dashboard."
  };
}

function handleReviewerFallback(msg, targetRole) {
  // Check if code or resume is submitted
  const hasCode = msg.includes("function") || msg.includes("class ") || msg.includes("const ") || msg.includes("{") || msg.includes("def ");

  if (hasCode) {
    return {
      mode: "reviewer",
      message: `### Code Analysis Report\n\n* **Complexity**: Time O(N) | Space O(1) in average execution flow.\n* **Edge Cases**: Make sure to validate empty arrays/lists and check for integer overflow bugs.\n* **Suggestions**:\n  1. Restructure parameter validation at the beginning of the function.\n  2. Use descriptive variables instead of short abbreviations to improve codebase readability.\n\nHere is an optimized alternative snippet:\n\`\`\`javascript\nfunction optimizedTask(data) {\n  if (!data || data.length === 0) return [];\n  // Optimized logic loop\n  return data;\n}\n\`\`\`\n`,
      score: 7,
      feedback: "Code structures analyzed. Basic boundary checks are missing.",
      next_action: "Refactor function parameters and deploy to your project repo."
    };
  }

  return {
    mode: "reviewer",
    message: `### ATS Resume Review for ${targetRole}\n\n* **Critique**: Your experience lists several passive tasks. Rewrite them using direct action words.\n* **Key Missing Keywords**: \`TypeScript\`, \`Redis\`, \`Jest\`, \`System Design\`\n* **Optimized Recommendations**:\n  - *Before*: "Helped build dashboard and fixed some responsive CSS styling bugs."\n  - *After*: "Engineered interactive dashboard views and resolved 15+ complex responsive styling anomalies, improving user engagement by 12%."\n`,
    score: 8,
    feedback: "ATS compliance audit compiled. Add metric metrics (%, seconds, $) to bullet points.",
    next_action: "Update resume sections in the Resume Builder page."
  };
}

function handlePlannerFallback(msg, targetRole) {
  return {
    mode: "planner",
    message: `### 🚀 4-Week Career Preparation Roadmap - ${targetRole}

* **Week 1: Algorithmic Foundations**
  * Focus: Arrays, Hash Maps, sliding window, and two-pointer solutions.
  * Practice: Two Sum, Valid Parentheses, and Merge Intervals.
* **Week 2: Backend REST & API Optimization**
  * Focus: Express routing patterns, JWT authorization tokens, and indexing MongoDB/Atlas.
  * Tasks: Build a layered controller/repository structure.
* **Week 3: Frontend Performance**
  * Focus: React rendering lifecycles, hook optimization (useMemo, useCallback), and Tailwind styling layouts.
* **Week 4: Mock Prep & Systems Design**
  * Focus: Scaling distributed services, caching layers, and mock interviewer prep loops.`,
    score: null,
    feedback: "Roadmap compiler finished.",
    next_action: "Practice the recommended topics in the Coding Arena."
  };
}

function handleMentorFallback(msg, targetRole) {
  if (msg.includes("dsa") || msg.includes("leetcode") || msg.includes("problem")) {
    return {
      mode: "mentor",
      message: "DSA prep is all about pattern recognition rather than memorizing problems. Focus on mastering: \n\n1. **Sliding Windows** (for substring problems)\n2. **Fast & Slow Pointers** (for cyclic lists)\n3. **DFS/BFS** (for graph/tree layouts)\n\nTry starting with standard array problems in the **Coding Arena**.",
      score: null,
      feedback: "Guidance resolved.",
      next_action: "Navigate to the Coding Arena and filter by Easy."
    };
  }

  if (msg.includes("resume") || msg.includes("ats")) {
    return {
      mode: "mentor",
      message: "To pass ATS screening gates, structure your resume in a clean, single-column format. Ensure you have dedicated sections for **Experience**, **Projects**, **Skills**, and **Education**. List specific technologies directly rather than vague groupings.",
      score: null,
      feedback: "ATS guidelines provided.",
      next_action: "Open the Resume Builder and run an ATS diagnostic check."
    };
  }

  return {
    mode: "mentor",
    message: `Hello! As your AI Career Mentor, I can help you prepare for **${targetRole}** positions. You can ask me to:\n\n* Start a mock technical interview (**Interview Mode**)\n* Audit your coding logic or resume formatting (**Reviewer Mode**)\n* Outline a study curriculum (**Planner Mode**)\n\nWhat would you like to focus on today?`,
    score: null,
    feedback: "Standard guidance resolved.",
    next_action: "Select one of the quick options or type a response."
  };
}

export default {
  generateFallbackResponse
};
