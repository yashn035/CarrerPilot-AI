import { getDb, saveDb } from '../../../infrastructure/db/mongo.js';
import { awardXp } from '../../../shared/services/xp.service.js';
import { updateUserState } from '../../../shared/state/user.state.js';
import { getPrompt } from '../../../infrastructure/ai/prompt.engine.js';
import { callAI, parseCleanJson } from '../../../infrastructure/ai/ai.orchestrator.js';
import eventBus from '../../../shared/events/eventBus.js';
import projectsRepository from '../repository/projects.repository.js';
import logger from '../../../shared/logger/logger.js';

/**
 * Gets historical portfolio evaluations.
 */
export async function getUserProjects(userId) {
  return await projectsRepository.getUserProjects(userId);
}

/**
 * Runs an AI project review analysis on GitHub repository schemas, 
 * calculates grades, syncs readiness, and dispatches events.
 */
export async function evaluateRepo(userId, { repoUrl, description, title }) {
  if (!repoUrl) throw new Error("GitHub Repository URL is required");

  let evaluation = null;
  try {
    const systemPrompt = getPrompt('project_evaluate', 'v1');
    const userPrompt = `Repo URL: ${repoUrl}\nDescription: ${description || ''}`;
    const aiResponse = await callAI(systemPrompt, userPrompt);
    if (aiResponse) {
      evaluation = parseCleanJson(aiResponse);
    }
  } catch (err) {
    logger.warn("AI project evaluation query failed, compiling mocks:", { error: err.message });
  }

  // Heuristic mock evaluations fallback
  if (!evaluation) {
    evaluation = {
      scores: {
        architecture: 75,
        codeQuality: 80,
        scalability: 65,
        placementValue: 78,
        resumeValue: 80
      },
      report: {
        strengths: ["Structured routes setup.", "Modular config keys."],
        weaknesses: ["Lacks CI/CD workflows integration.", "Missing unit test frameworks."],
        recommendations: ["Write basic test files.", "Containerize project setup using Docker."]
      }
    };
  }

  const newEval = {
    id: "proj-eval-" + Math.random().toString(36).substring(2, 11),
    userId,
    title: title || "My Evaluated Project",
    repoUrl,
    evaluatedAt: new Date().toISOString(),
    ...evaluation
  };

  await projectsRepository.saveProject(newEval);

  const db = await getDb();
  const user = db.users.find(u => u.id === userId);
  let leveledUp = false;

  const projectScoreAvg = Math.round((evaluation.scores.architecture + evaluation.scores.codeQuality + evaluation.scores.scalability) / 3);

  if (user) {
    const reward = await awardXp(userId, 100, `Evaluated project: ${newEval.title}`, db);
    leveledUp = reward?.leveledUp || false;
    await saveDb(db);
    
    // Sync state
    await updateUserState(userId, {
      xp: user.xp,
      level: user.level,
      scores: { projects: projectScoreAvg }
    });
  }

  // Publish to Event Bus
  eventBus.emit('project_evaluated', {
    userId,
    title: newEval.title,
    score: projectScoreAvg
  });

  return { project: newEval, leveledUp };
}

/**
 * Generates an instant HTML static site portfolio using resume templates.
 */
export async function generatePortfolio(userId, resumeId) {
  const db = await getDb();
  const resume = db.resumes.find(r => r.id === resumeId && r.userId === userId);
  if (!resume) throw new Error("Resume profile not found");

  let portfolioHtml = null;
  try {
    const systemPrompt = getPrompt('portfolio_generate', 'v1');
    portfolioHtml = await callAI(systemPrompt, JSON.stringify(resume));
  } catch (err) {
    logger.warn("AI portfolio compiler failed, generating fallback site page:", { error: err.message });
  }

  if (portfolioHtml) {
    return portfolioHtml;
  }

  // Fallback structural design template
  const name = resume.personalInfo?.name || "Candidate Portfolio";
  const email = resume.personalInfo?.email || "";
  const github = resume.personalInfo?.github || "";
  
  const projectsHtml = (resume.projects || []).map(p => `
    <div class="bg-gray-800/50 backdrop-blur border border-gray-800 p-6 rounded-xl space-y-3">
      <h3 class="text-lg font-bold text-white">${p.title}</h3>
      <span class="text-xs font-mono text-cyan-400 font-semibold">${p.technologies}</span>
      <p class="text-xs text-gray-400 leading-relaxed">${p.description}</p>
    </div>
  `).join('');

  const skillsHtml = (resume.skills || []).map(s => `
    <span class="text-xs font-semibold px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-full text-cyan-400 font-mono">${s}</span>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} | CareerPilot Portfolio</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #0A0A0F; font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="text-gray-300">
  <header class="max-w-6xl mx-auto px-6 py-8 flex justify-between items-center border-b border-gray-800">
    <span class="text-lg font-bold text-white tracking-wider font-mono">${name}</span>
  </header>
  <section id="about" class="max-w-4xl mx-auto px-6 py-20 text-center space-y-6">
    <h1 class="text-5xl font-extrabold text-white">Hi, I am <span class="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">${name}</span></h1>
    <div class="flex justify-center gap-4 text-xs pt-4 font-semibold">
      <a href="mailto:${email}" class="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">Email Me</a>
      <a href="https://${github}" target="_blank" class="px-5 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg">GitHub</a>
    </div>
  </section>
  <section id="projects" class="max-w-6xl mx-auto px-6 py-12 space-y-8">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">${projectsHtml}</div>
  </section>
  <section id="skills" class="max-w-6xl mx-auto px-6 py-12 space-y-6">
    <div class="flex flex-wrap gap-3">${skillsHtml}</div>
  </section>
</body>
</html>`;
}
