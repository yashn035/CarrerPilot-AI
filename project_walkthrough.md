# CareerPilot AI - Project Walkthrough & Architecture Report

CareerPilot AI is a comprehensive **Placement OS / Career Readiness Platform** designed to help software engineering candidates prepare for technical hiring pipelines. The application integrates resume building, ATS compliance analysis, interactive DSA practice, timed online assessments, AI-driven mock interviews, and job hunting funnels into a cohesive, gamified portal.

---

## 🛠️ Technology Stack & Project Structure

The project follows a standard decoupled Client-Server architecture:

### 1. Frontend Client (React + Vite)
* **Core**: [React 18](file:///c:/Users/yashn/OneDrive/Desktop/CarrerPilot%20AI/package.json#L25) (using Javascript).
* **Build Tool**: [Vite](file:///c:/Users/yashn/OneDrive/Desktop/CarrerPilot%20AI/package.json#L42) with Hot Module Replacement (HMR).
* **Styling**: Tailored Tailwind CSS coupled with modern custom CSS definitions (neon leak gradients, glassmorphism, dark/vibrant aesthetics).
* **Icons**: [Lucide React](file:///c:/Users/yashn/OneDrive/Desktop/CarrerPilot%20AI/package.json#L23) for premium UI assets.
* **Animations & Micro-interactions**: [Framer Motion](file:///c:/Users/yashn/OneDrive/Desktop/CarrerPilot%20AI/package.json#L21) and [canvas-confetti](file:///c:/Users/yashn/OneDrive/Desktop/CarrerPilot%20AI/package.json#L17) (e.g., triggering on levels ups and assessment completions).
* **State Management**: [UserContext.js](file:///c:/Users/yashn/OneDrive/Desktop/CarrerPilot%20AI/src/context/UserContext.js) provides a global context handling authentication tokens, current user data, active tabs, real-time toast systems, and XP level calculations.

### 2. Backend Server (Express Node.js)
* **Core**: [Express.js](file:///c:/Users/yashn/OneDrive/Desktop/CarrerPilot%20AI/package.json#L20) REST API.
* **Database Layer**: [db.js](file:///c:/Users/yashn/OneDrive/Desktop/CarrerPilot%20AI/server/db.js) implements a dual-mode database schema. It attempts to connect to a cloud MongoDB instance if `MONGODB_URI` is configured, otherwise it automatically falls back to a multi-file local JSON datastore under `server/data/db/`.
* **AI Engine**: [ai.js](file:///c:/Users/yashn/OneDrive/Desktop/CarrerPilot%20AI/server/ai.js) integrates direct HTTP calls to the **Gemini 2.5 Flash API** using `GEMINI_API_KEY`. If no API key is specified, it gracefully degrades to a set of highly dynamic local mock algorithms simulating AI outputs.
* **Code Execution**: Connects to the external [Piston API](https://emkc.org/api/v2/piston/execute) to evaluate Java, Python, and C++ user submissions against a set of unit tests in a secure sandbox. Off-line fallback executing local `Function` runtimes is provided for Javascript evaluations.

---

## 🎯 Core Features & Modules

The platform is organized into 8 distinct modular tabs:

### 1. [Dashboard](file:///c:/Users/yashn/OneDrive/Desktop/CarrerPilot%20AI/src/modules/Dashboard.js)
The landing hub for the Career OS:
* **Placement Readiness Score**: A composite metric mapping scores across Resumes, DSA, Projects, and Interviews to evaluate placement readiness (Target is 85%+).
* **XP & Gamification**: Active user level and current learning streak indicators.
* **Daily Recommended Action**: Recommends a targeted DSA topic based on past weaknesses.
* **Funnel Funnels**: Condensed summaries of current job pipelines, project grades, recent activities, and achievements.

### 2. [AI Mentor Chatbot](file:///c:/Users/yashn/OneDrive/Desktop/CarrerPilot%20AI/src/modules/AIMentor.js)
An interactive ChatGPT-like career mentor capable of:
* Answering technical, algorithmic, system design, and academic questions.
* Formulating step-by-step prep roadmaps.
* Reviewing code blocks or resume phrases.

### 3. [Resume Builder & ATS Optimizer](file:///c:/Users/yashn/OneDrive/Desktop/CarrerPilot%20AI/src/modules/ResumeBuilder.js)
A complete system to audit and format technical CVs:
* **Interactive Form**: Inputs profile information, education, experiences, projects, and skills.
* **ATS Analyzer**: Mathematically reviews the resume against standard tech stack profiles or custom job descriptions (scoring format, keyword density, and phrasing quality).
* **AI Rewriter**: Converts weak bullets into strong, metric-driven action bullet points using the *Action-Verb + Context + Metric impact* formula.
* **Job Optimizer**: Compares a resume to a job description, lists missing keywords, and automatically suggests rewritten points.

### 4. [Coding Arena](file:///c:/Users/yashn/OneDrive/Desktop/CarrerPilot%20AI/src/modules/CodingArena.js)
A competitive coding playground comprising:
* **Lobby**: Active daily coding assignments and practice banks.
* **Workspace ([ArenaWorkspace.js](file:///c:/Users/yashn/OneDrive/Desktop/CarrerPilot%20AI/src/modules/arena/ArenaWorkspace.js))**: An editor using `@monaco-editor/react`. Contains pre-coding approach planning (voting on standard patterns) and a unique **Blind Mode** (the problem description blurs after 2 minutes to encourage memory retention).
* **Autopsy & Review**: Post-submission surgical feedback detailing time/space complexities, potential risks flagged by recruiters, and conceptual follow-up questions.
* **Company Tracks**: DSA pathways tailored to big tech (e.g., Google, Stripe, Amazon) loading high-frequency questions and custom prep guides.
* **Mock OA Simulator**: Complete 60-minute assessments matching real hiring tests. It features blur-detection warning alerts to prevent tab-switching during exams.

### 5. [Mock Interview Room](file:///c:/Users/yashn/OneDrive/Desktop/CarrerPilot%20AI/src/modules/MockInterview.js)
An interactive audio/text interview room:
* Allows starting Technical, System Design, or Behavioral loops at varying difficulties.
* The AI dynamically structures questions based on previous dialogue history.
* Concluding the session evaluates overall performance, communications, and structural responses, awarding XP and updating placement readiness.

### 6. [Job Tracker](file:///c:/Users/yashn/OneDrive/Desktop/CarrerPilot%20AI/src/modules/JobTracker.js)
A visual Kanban board mapping active application statuses from *Applied*, *OA Stage*, *Interview*, to *Offer*, complete with salary values, notes, and calendar notifications.

### 7. [Skill Gap Analyzer](file:///c:/Users/yashn/OneDrive/Desktop/CarrerPilot%20AI/src/modules/SkillGap.js)
Audits the user's current capabilities, categorizing them into **Weak**, **Moderate**, and **Strong** segments based on target company guidelines.

### 8. [Settings Page](file:///c:/Users/yashn/OneDrive/Desktop/CarrerPilot%20AI/src/modules/Settings.js)
Manages user configurations, profile information, target placement roles, and accounts.

---

## 💾 Database Architecture

The data schemas are stored across 13 core collections:

1. **`users`**: Main user profile including name, level, XP, streak history, capability tags, readiness indicators, and onboarding details.
2. **`resumes`**: Structured resume profiles containing education, projects, skills, and certifications.
3. **`atsReports`**: Historical parser evaluations containing missing keyword lists and phrasings.
4. **`submissions`**: Detailed user code submissions containing telemetry on runtime percentages, recall indicators, and autopsy responses.
5. **`interviews`**: Log of Mock interview sessions containing dialog histories and recruiter review outputs.
6. **`quests`**: System achievements and milestones.
7. **`jobs`**: Metadata on target positions and salary ranges.
8. **`xpHistory`**: Progression audit trails logging level bumps and timeline points.
9. **`dailyProblems`**: Daily algorithms recommended to users.
10. **`oaSessions`**: Online assessment logs tracking cheat warnings and grades.
11. **`jobApplications`**: Funnel metadata.
12. **`projects`**: Custom repository analyses.
13. **`notifications`**: User alert entries.

---

## 🛤️ Active Routes & API Endpoints

### 🔐 Authentication & Onboarding
* `POST /api/auth/register`: Creates new user schemas and yields active tokens.
* `POST /api/auth/login`: Authenticates profiles, increments active login streaks.
* `POST /api/auth/onboarding`: Collects target roles and skills, setting baseline readiness values.

### 🧑‍💼 User & Funnels
* `GET /api/profile`: Loads target user profiles.
* `POST /api/profile/claim-quest`: Confirms quest milestones and awards corresponding XP.
* `GET /api/jobs/applications` & `POST /api/jobs/applications`: Manages Kanban job tracking funnels.

### 📄 Resumes & ATS
* `GET /api/resumes` & `POST /api/resumes`: Loads or generates resume records.
* `PUT /api/resumes/:id`: Saves edits.
* `POST /api/resumes/:id/rewrite-bullet`: Asks Gemini to rewrite weak descriptions.
* `POST /api/resumes/:id/optimize-job`: Recommends improvements based on targeted JDs.
* `POST /api/resumes/:id/analyze`: Runs a complete parsing audit.

### 💻 Coding Arena & Assessments
* `GET /api/coding/problems`: Lists problem bank configurations.
* `GET /api/coding/problems/:id/approaches`: Yields conceptual patterns.
* `POST /api/coding/submit`: Compiles solution files using Piston/local environments and runs autopsies.
* `POST /api/oa/start` / `/submit` / `/end`: Manages mock timed exams.

### 🎙️ Interviews & Mentorship
* `POST /api/interviews/start`: Starts a new dialogue.
* `POST /api/interviews/:id/respond`: Evaluates a candidate's answer and generates subsequent prompts.
* `POST /api/interviews/:id/end`: Computes final grade and recommendations.
* `POST /api/mentor/chat`: Connects user messages directly to Gemini for instant feedback.
