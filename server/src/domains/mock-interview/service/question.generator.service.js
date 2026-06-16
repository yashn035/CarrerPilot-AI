import aiOrchestrator from '../../../infrastructure/ai/ai.orchestrator.js';
import promptEngine from '../../../infrastructure/ai/prompt.engine.js';
import logger from '../../../shared/logger/logger.js';

/**
 * Generates the next question based on user profile and chat history.
 * @param {Object} session 
 * @param {Object} profile 
 * @returns {Promise<Object>}
 */
export async function generateNextQuestion(session, profile) {
  const historyTurns = session.history || [];
  const turnCount = historyTurns.filter(h => h.role === 'candidate').length;

  const skillsStr = profile?.skills?.join(", ") || "General programming";
  const projectsStr = profile?.projects?.join(", ") || "General systems";
  const experienceStr = profile?.experience?.join(", ") || "Entry level";
  const weakAreasStr = profile?.weak_areas?.join(", ") || "None recorded";

  const variables = {
    company: session.company || "Tech Group",
    difficulty: session.difficulty || "Medium",
    type: session.type || "Technical",
    skills: skillsStr,
    projects: projectsStr,
    experience: experienceStr,
    weak_areas: weakAreasStr
  };

  const systemPrompt = promptEngine.getPrompt('interview_resume_question_generator', 'v1', variables);
  
  // Format message history
  const historyStr = historyTurns
    .map(h => `${h.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${h.content}`)
    .join('\n');
    
  const userPrompt = `History:\n${historyStr || '[]'}\n\nGenerate next question JSON:`;

  try {
    const aiResponse = await aiOrchestrator.callAI(systemPrompt, userPrompt, false);
    if (aiResponse) {
      const parsedQuestion = aiOrchestrator.parseCleanJson(aiResponse);
      if (parsedQuestion && parsedQuestion.question) {
        return {
          intro: parsedQuestion.intro || "",
          question: parsedQuestion.question,
          hint: parsedQuestion.hint || "Try using STAR method logic."
        };
      }
    }
  } catch (err) {
    logger.warn("AI Question generator failed, switching to rule-based fallback.", err);
  }

  return getRuleBasedQuestionFallback(session.type, turnCount, profile);
}

function getRuleBasedQuestionFallback(type, turnCount, profile) {
  const skills = profile?.skills || [];
  const primarySkill = skills.length > 0 ? skills[0] : "programming principles";

  if (type === 'System Design') {
    const questions = [
      {
        intro: "Let's start the system design round. I see database integration on your resume.",
        question: "How would you design a distributed cache invalidation scheme using Redis to avoid caching stamps or stale read cycles?",
        hint: "Mention Cache-Aside, Write-Through patterns, and TTL parameters."
      },
      {
        intro: "Excellent. Let's move to horizontal scale topics.",
        question: "How would you design an API gateway layer that handles authorization token decryptions and limits user requests at scale?",
        hint: "Mention JWT verification filters, Redis sliding window algorithms, and load balancers."
      },
      {
        intro: "Understood. Now let's address persistent data layers.",
        question: "How do you decide between vertical sharding and horizontal clustering when database read latencies spike?",
        hint: "Compare query partitioning, indices, and replica clusters."
      },
      {
        intro: "Final question for systems design.",
        question: "How would you design a highly available notification broker processing SMS, email, and mobile push triggers at 50,000 requests per minute?",
        hint: "Propose messaging queues like RabbitMQ/Kafka and background worker grids."
      }
    ];
    return questions[Math.min(turnCount, questions.length - 1)];
  }

  if (type === 'Behavioral') {
    const questions = [
      {
        intro: "Let's begin the behavioral review loop.",
        question: "Tell me about a challenging engineering project from your resume. What was your exact role, and how did you navigate a major roadblock?",
        hint: "Apply the STAR (Situation, Task, Action, Result) structure. Use metrics if possible."
      },
      {
        intro: "Interesting details. Let's talk about teamwork.",
        question: "Describe a situation where you had a strong technical disagreement with a team member. How did you resolve it and align on the implementation?",
        hint: "Focus on data-driven metrics, peer code audits, and conflict resolution."
      },
      {
        intro: "Understood.",
        question: "Tell me about a time you made an engineering mistake or code bug that hit production. How did you handle the situation and resolve the bug?",
        hint: "Explain rollbacks, hotfixes, unit tests expansion, and post-mortem review."
      },
      {
        intro: "One final question.",
        question: "How do you prioritize your time when handling multiple competing project deliverables under tight deadlines?",
        hint: "Explain task estimates, Agile sprints, and managing stakeholder communications."
      }
    ];
    return questions[Math.min(turnCount, questions.length - 1)];
  }

  // Technical/FAANG Mixed Fallback
  const techQuestions = [
    {
      intro: `Let's start the technical evaluation. I notice you work with ${primarySkill}.`,
      question: `Could you explain the difference between processes and threads, and how they share memory contexts inside a ${primarySkill} runtime environment?`,
      hint: "Explain virtual memory stacks, shared heap structures, and process isolation."
    },
    {
      intro: "Great explanation. Let's pivot to data structures.",
      question: "What is the optimal time complexity of finding a node in a Balanced Binary Search Tree? How does it change if the tree becomes unbalanced?",
      hint: "Explain O(log N) heights vs O(N) linear lists, and AVL/Red-Black rotation rules."
    },
    {
      intro: "Understood. Let's move to concurrency.",
      question: "Explain the difference between synchronous execution blocking and asynchronous event-driven lifecycles. How does Node.js handle thousands of concurrent queries on a single thread?",
      hint: "Explain libuv thread pools, non-blocking I/O callbacks, and Event Loop cycles."
    },
    {
      intro: "Final technical challenge.",
      question: "If you have a function with a time complexity of O(N^2) containing nested loops, what strategies would you use to refactor it to O(N log N) or O(N)?",
      hint: "Propose hash indexing maps, sorting steps, or two-pointer slide windows."
    }
  ];

  return techQuestions[Math.min(turnCount, techQuestions.length - 1)];
}
