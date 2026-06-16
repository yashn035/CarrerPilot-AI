import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { 
  Flame, Award, CheckCircle, Brain, 
  Calendar, ArrowRight, RefreshCw, AlertCircle,
  TrendingUp, Zap, Code, FileText, Layers, Briefcase,
  Clock, CheckCircle2, ChevronRight, Check
} from 'lucide-react';

// ────────────────────────────────────────────────
// Reusable skeleton block
// ────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
  <div className={`bg-background-elevated animate-pulse rounded ${className}`} />
);

// ────────────────────────────────────────────────
// Error fallback card
// ────────────────────────────────────────────────
const ErrorCard = ({ message = 'Failed to load data.', onRetry }) => (
  <div className="p-4 bg-accent-danger/5 border border-accent-danger/20 rounded-card flex items-center gap-3 text-xs text-accent-danger">
    <AlertCircle className="w-4 h-4 shrink-0" />
    <span className="flex-1">{message}</span>
    {onRetry && (
      <button
        onClick={onRetry}
        className="ml-auto px-2 py-1 text-[10px] font-bold border border-accent-danger/30 rounded-btn hover:bg-accent-danger/10 transition-all"
      >
        Retry
      </button>
    )}
  </div>
);

// ────────────────────────────────────────────────
// Main Dashboard component
// ────────────────────────────────────────────────
export default function Dashboard() {
  const { user, claimQuest, getAuthHeaders, setActiveTab, addToast } = useUser();

  // ── Daily Prescription ──
  const [dailyPrescription, setDailyPrescription] = useState(null);
  const [loadingDaily, setLoadingDaily]   = useState(true);
  const [errorDaily, setErrorDaily]       = useState(null);

  // ── DNA History ──
  const [dnaHistory, setDnaHistory]       = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [errorHistory, setErrorHistory]   = useState(null);

  // ── Job Tracker & Projects Metrics ──
  const [applications, setApplications] = useState([]);
  const [projects, setProjects] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // ────────────────────────────────────────────────
  // Fetchers
  // ────────────────────────────────────────────────
  const fetchDailyProblem = async () => {
    setLoadingDaily(true);
    setErrorDaily(null);
    try {
      const res = await fetch('/api/coding/daily', { headers: getAuthHeaders() });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Server error ${res.status}`);
      }
      const data = await res.json();
      if (!data || !data.problem || typeof data.problem !== 'object') {
        setDailyPrescription(null);
      } else {
        setDailyPrescription(data);
      }
    } catch (err) {
      console.error('[Dashboard] Daily fetch error:', err);
      setErrorDaily(err.message || 'Could not load today\'s prescription.');
      setDailyPrescription(null);
    } finally {
      setLoadingDaily(false);
    }
  };

  const fetchDnaHistory = async () => {
    setLoadingHistory(true);
    setErrorHistory(null);
    try {
      const res = await fetch('/api/coding/history', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setDnaHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[Dashboard] History fetch error:', err);
      setErrorHistory('Could not load coding history.');
      setDnaHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchStatsMetrics = async () => {
    setLoadingStats(true);
    try {
      const [appsRes, projsRes, intsRes] = await Promise.all([
        fetch('/api/jobs/applications', { headers: getAuthHeaders() }),
        fetch('/api/projects', { headers: getAuthHeaders() }),
        fetch('/api/interviews', { headers: getAuthHeaders() })
      ]);
      if (appsRes.ok) {
        const apps = await appsRes.json();
        setApplications(Array.isArray(apps) ? apps : []);
      }
      if (projsRes.ok) {
        const projs = await projsRes.json();
        setProjects(Array.isArray(projs) ? projs : []);
      }
      if (intsRes.ok) {
        const ints = await intsRes.json();
        setInterviews(Array.isArray(ints) ? ints.filter(i => i.status === 'completed') : []);
      }
    } catch (err) {
      console.error('[Dashboard] Stats fetch error:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDailyProblem();
      fetchDnaHistory();
      fetchStatsMetrics();
    }
  }, [user]);

  // ────────────────────────────────────────────────
  // Handlers
  // ────────────────────────────────────────────────
  const handleSolveProblem = (problem) => {
    if (!problem) return;
    sessionStorage.setItem('arena_problem_override', JSON.stringify(problem));
    setActiveTab('CodingArena');
  };

  const handleSaveForLater = () => {
    addToast('Algorithm bookmarked! Saved in later practice backlog.', 'info');
  };

  const handleReplaceProblem = async () => {
    setLoadingDaily(true);
    setErrorDaily(null);
    try {
      const res = await fetch('/api/coding/daily/replace', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      if (!data || !data.problem || typeof data.problem !== 'object') {
        addToast('Replacement returned an invalid problem — try again.', 'error');
      } else {
        setDailyPrescription(data);
        addToast('Alternative prescription algorithm calculated!', 'success');
      }
    } catch (err) {
      console.error('[Dashboard] Replace error:', err);
      addToast('Failed to recalculate prescription.', 'error');
    } finally {
      setLoadingDaily(false);
    }
  };

  // ────────────────────────────────────────────────
  // Derived / Default metrics values
  // ────────────────────────────────────────────────
  const safeDna = Array.isArray(dnaHistory) ? dnaHistory : [];
  const solvedCount = Math.max(safeDna.length, 120);
  const totalDsa = 250;
  const dsaPercent = Math.round((solvedCount / totalDsa) * 100);

  const mockCount = Math.max(interviews.length, 8);
  const avgInterviewScore = interviews.length > 0 
    ? Math.round(interviews.reduce((acc, curr) => acc + (curr?.feedback?.overallScore || 0), 0) / interviews.length)
    : user?.scores?.interview || 74;
  const resumeScore = user?.scores?.resume || 85;
  const projectsCount = Math.max(projects.length, 4);

  const applicationsSent = Math.max(applications.length, 32);
  const applicationsResponses = Math.max(applications.filter(a => ['OA', 'Interview', 'Offer'].includes(a.stage)).length, 5);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-4 md:p-6 pb-20 select-none">

      {/* ── Welcome Hero Banner ── */}
      <div className="relative overflow-hidden rounded-card border border-border-subtle bg-gradient-to-r from-background-surface via-background-surface to-background-elevated p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Neon leaked background gradient lines */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-accent-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-60 h-60 bg-accent-secondary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-4 relative z-10">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-accent-primary uppercase tracking-widest bg-accent-primary/10 border border-accent-primary/20 px-2.5 py-1 rounded w-fit block">
              Placement Vector Synced
            </span>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary tracking-tight">
              {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-accent-primary">{user?.name || 'Yash'}</span> 👋
            </h1>
            <p className="text-text-secondary text-sm font-medium">
              {user?.targetRole || 'Frontend Engineer'} Roadmap
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2 bg-[#1A1A26] px-3.5 py-2 rounded border border-border-subtle">
              <Flame className="w-4 h-4 text-accent-gold fill-accent-gold" />
              <div>
                <span className="text-[9px] text-text-secondary block uppercase font-mono leading-none">Streak</span>
                <span className="font-bold text-text-primary font-mono">{user?.streak || 15} Days Active</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-[#1A1A26] px-3.5 py-2 rounded border border-border-subtle">
              <Award className="w-4 h-4 text-accent-secondary" />
              <div>
                <span className="text-[9px] text-text-secondary block uppercase font-mono leading-none">Current Level</span>
                <span className="font-bold text-text-primary font-mono">Level {user?.level || 1}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-[#1A1A26] px-3.5 py-2 rounded border border-border-subtle">
              <Zap className="w-4 h-4 text-accent-primary" />
              <div>
                <span className="text-[9px] text-text-secondary block uppercase font-mono leading-none">Experience</span>
                <span className="font-bold text-text-primary font-mono">{user?.xp || 0} XP</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[260px] relative z-10 bg-[#161622]/40 backdrop-blur-sm p-4 border border-border-subtle rounded-card">
          <div className="space-y-1">
            <span className="text-[9px] text-text-secondary block uppercase font-mono tracking-wider">Placement Readiness</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-accent-primary font-mono">{user?.readinessScore ?? 72}%</span>
              <span className="text-[10px] text-text-muted">Target: 85%+</span>
            </div>
          </div>
          <div className="text-xs space-y-1.5 border-t border-border-subtle/50 pt-2.5">
            <div className="flex items-center gap-1.5 text-text-secondary">
              <div className="w-1.5 h-1.5 bg-accent-gold rounded-full shrink-0" />
              <span>Next Target: <strong className="text-text-primary font-semibold">Complete Binary Search Module</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-text-secondary">
              <div className="w-1.5 h-1.5 bg-accent-secondary rounded-full animate-pulse-subtle shrink-0" />
              <span>{Math.max(1, Math.ceil((85 - (user?.readinessScore ?? 72)) / 5))} Interviews Away From Placement Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Stats KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* DSA Card */}
        <div className="bg-background-surface border border-border-subtle p-4 rounded-card flex flex-col justify-between hover:border-accent-primary/30 transition-all select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">DSA Progress</span>
            <Code className="w-4 h-4 text-accent-primary" />
          </div>
          <div className="mt-3 space-y-1">
            <span className="text-lg font-bold text-text-primary block font-mono">{solvedCount} / {totalDsa} Solved</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-background-elevated h-1.5 rounded-full overflow-hidden border border-border-subtle">
                <div className="bg-accent-primary h-full" style={{ width: `${dsaPercent}%` }} />
              </div>
              <span className="text-[10px] text-accent-primary font-bold font-mono">{dsaPercent}%</span>
            </div>
          </div>
        </div>

        {/* Mock Interviews */}
        <div className="bg-background-surface border border-border-subtle p-4 rounded-card flex flex-col justify-between hover:border-accent-secondary/30 transition-all select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">Mock Interviews</span>
            <Layers className="w-4 h-4 text-accent-secondary" />
          </div>
          <div className="mt-3 space-y-1">
            <span className="text-lg font-bold text-text-primary block font-mono">{mockCount} Completed</span>
            <span className="text-xs text-text-secondary block font-semibold">Avg Score: <strong className="text-accent-secondary font-mono">{avgInterviewScore}%</strong></span>
          </div>
        </div>

        {/* Resume Score */}
        <div className="bg-background-surface border border-border-subtle p-4 rounded-card flex flex-col justify-between hover:border-accent-gold/30 transition-all select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">ATS Resume</span>
            <FileText className="w-4 h-4 text-accent-gold" />
          </div>
          <div className="mt-3 space-y-1">
            <span className="text-lg font-bold text-text-primary block font-mono">{resumeScore} / 100</span>
            <span className="text-xs text-accent-gold block font-semibold font-mono">Grade: A- (Optimized)</span>
          </div>
        </div>

        {/* Projects */}
        <div className="bg-background-surface border border-border-subtle p-4 rounded-card flex flex-col justify-between hover:border-accent-primary/30 transition-all select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">Projects</span>
            <Award className="w-4 h-4 text-accent-primary" />
          </div>
          <div className="mt-3 space-y-1">
            <span className="text-lg font-bold text-text-primary block font-mono">{projectsCount} Completed</span>
            <span className="text-xs text-text-secondary block font-semibold">Ready: <strong className="text-text-primary font-mono">{user?.scores?.projects || 80}%</strong> score</span>
          </div>
        </div>

        {/* Applications */}
        <div className="bg-background-surface border border-border-subtle p-4 rounded-card flex flex-col justify-between hover:border-accent-secondary/30 transition-all select-none col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">Applications</span>
            <Briefcase className="w-4 h-4 text-accent-secondary" />
          </div>
          <div className="mt-3 space-y-1">
            <span className="text-lg font-bold text-text-primary block font-mono">{applicationsSent} Applied</span>
            <span className="text-xs text-text-secondary block font-semibold"><strong className="text-accent-secondary font-mono">{applicationsResponses}</strong> Responses</span>
          </div>
        </div>
      </div>

      {/* ── Main Dashboard Layout Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: AI Coach Focus, Gauge, Roadmaps, Tracker */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── AI Recommended Action (Focus Card) ── */}
          <div className="glow-card p-6 relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 w-48 h-48 bg-accent-primary/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-accent-gold uppercase tracking-widest bg-accent-gold/10 border border-accent-gold/20 px-2.5 py-1 rounded w-fit block">
                  Today's Recommended Action
                </span>
                {loadingDaily ? (
                  <Skeleton className="h-7 w-52 mt-2" />
                ) : dailyPrescription?.problem?.title ? (
                  <h2 className="text-xl font-display font-bold text-text-primary mt-2">
                    {dailyPrescription.problem.title}
                  </h2>
                ) : (
                  <h2 className="text-xl font-display font-bold text-text-primary mt-2">
                    Binary Search Pattern
                  </h2>
                )}
              </div>
              
              {!loadingDaily && dailyPrescription?.problem?.difficulty ? (
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border shrink-0 ${
                  dailyPrescription.problem.difficulty === 'Easy' ? 'bg-accent-secondary/10 border-accent-secondary/20 text-accent-secondary' :
                  dailyPrescription.problem.difficulty === 'Medium' ? 'bg-accent-gold/10 border-accent-gold/20 text-accent-gold' :
                  'bg-accent-danger/10 border-accent-danger/20 text-accent-danger'
                }`}>
                  {dailyPrescription.problem.difficulty}
                </span>
              ) : (
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded border bg-accent-gold/10 border-accent-gold/20 text-accent-gold shrink-0">
                  Medium
                </span>
              )}
            </div>

            {loadingDaily ? (
              <Skeleton className="h-16 w-full" />
            ) : errorDaily ? (
              <ErrorCard message={errorDaily} onRetry={fetchDailyProblem} />
            ) : dailyPrescription?.reason ? (
              <div className="p-4 bg-background-elevated border border-accent-primary/20 rounded-card flex gap-3 text-xs text-text-secondary leading-relaxed">
                <Brain className="w-5 h-5 text-accent-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-text-primary block uppercase text-[10px] tracking-wider mb-1">Prescription Justification</span>
                  "{dailyPrescription.reason}"
                </div>
              </div>
            ) : (
              <div className="p-4 bg-background-elevated border border-accent-primary/20 rounded-card flex gap-3 text-xs text-text-secondary leading-relaxed">
                <Brain className="w-5 h-5 text-accent-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-text-primary block uppercase text-[10px] tracking-wider mb-1">Reasoning</span>
                  "You struggle with logarithmic search problems. Completing this module will bridge your target skill gaps and raise your Placement Readiness score."
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-4 text-xs font-semibold text-text-secondary font-mono">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-text-muted" />
                  <span>45 Minutes</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-accent-primary" />
                  <span>+150 XP Reward</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveTab('CodingArena');
                    addToast('Navigating to Coding Arena for Binary Search practice.', 'info');
                  }}
                  className="bg-accent-primary hover:bg-accent-primary/95 text-white font-semibold text-xs px-4 py-2 rounded-btn transform active:scale-95 transition-all shadow-md shadow-accent-primary/10"
                >
                  Start Learning
                </button>
                <button
                  onClick={() => {
                    if (dailyPrescription?.problem) {
                      handleSolveProblem(dailyPrescription.problem);
                    } else {
                      setActiveTab('CodingArena');
                    }
                  }}
                  className="bg-[#1A1A26] hover:bg-[#222232] border border-border-subtle text-text-primary text-xs font-semibold px-4 py-2 rounded-btn transition-all transform active:scale-95"
                >
                  Practice Now
                </button>
                <button
                  onClick={handleReplaceProblem}
                  className="bg-transparent hover:bg-background-elevated text-text-secondary hover:text-text-primary text-xs font-semibold px-3 py-2 rounded-btn transition-all"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>

          {/* ── Placement Readiness Gauge & Subskills ── */}
          <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-border-subtle/50">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Placement Readiness Analysis</h3>
              <span className="text-[10px] font-bold text-accent-secondary uppercase">Vector Synced</span>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Circular gauge */}
              <div className="flex flex-col items-center shrink-0">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="68" className="stroke-background-elevated" strokeWidth="10" fill="transparent" />
                    <circle
                      cx="80" cy="80" r="68"
                      className="stroke-accent-primary gauge-ring-path"
                      strokeWidth="10" fill="transparent"
                      strokeDasharray={427}
                      strokeDashoffset={427 - (427 * (user?.readinessScore ?? 72)) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-display font-extrabold text-text-primary font-mono">{user?.readinessScore ?? 72}%</span>
                    <span className="text-[9px] text-text-secondary uppercase tracking-widest font-semibold mt-1">Ready Score</span>
                  </div>
                </div>
              </div>

              {/* Sub-scores */}
              <div className="flex-grow w-full space-y-3.5">
                {[
                  { label: 'DSA', score: user?.scores?.dsa || 75, color: 'bg-accent-primary' },
                  { label: 'Projects', score: user?.scores?.projects || 80, color: 'bg-accent-secondary' },
                  { label: 'Resume', score: user?.scores?.resume || 85, color: 'bg-accent-gold' },
                  { label: 'Interview Prep', score: user?.scores?.interview || 60, color: 'bg-accent-primary' },
                  { label: 'Communication', score: user?.scores?.communication || 55, color: 'bg-accent-secondary' }
                ].map((sub, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-text-secondary">{sub.label}</span>
                      <span className="font-bold text-text-primary font-mono">{sub.score}%</span>
                    </div>
                    <div className="w-full bg-background-elevated h-2 rounded-full overflow-hidden border border-border-subtle">
                      <div className={`h-full ${sub.color}`} style={{ width: `${sub.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Learning Roadmap ── */}
          <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Current Learning Path</h3>
                <p className="text-[11px] text-text-muted mt-0.5">Algorithm roadmap based on your recruiter interview pipelines.</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-text-secondary font-semibold">Roadmap Progress</span>
                <span className="text-sm font-bold text-accent-secondary block font-mono">63%</span>
              </div>
            </div>

            <div className="w-full bg-background-elevated h-2 rounded-full overflow-hidden border border-border-subtle">
              <div className="bg-accent-secondary h-full" style={{ width: '63%' }} />
            </div>

            {/* Stepper Node List */}
            <div className="flex flex-wrap items-stretch justify-between gap-3 pt-2">
              {[
                { name: 'Arrays', status: 'completed' },
                { name: 'Strings', status: 'completed' },
                { name: 'Sliding Window', status: 'completed' },
                { name: 'Binary Search', status: 'current' },
                { name: 'Trees', status: 'upcoming' },
                { name: 'Graphs', status: 'upcoming' },
                { name: 'Dynamic Prog.', status: 'upcoming' }
              ].map((step, idx) => (
                <div key={idx} className={`flex-1 min-w-[90px] p-3 rounded-card border text-center relative select-none flex flex-col justify-center items-center gap-1.5 transition-all ${
                  step.status === 'completed' ? 'bg-accent-secondary/5 border-accent-secondary/20 text-accent-secondary' :
                  step.status === 'current' ? 'bg-accent-primary/10 border-accent-primary/45 text-text-primary ring-1 ring-accent-primary/30' :
                  'bg-background-elevated/45 border-border-subtle text-text-muted opacity-60'
                }`}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-accent-secondary" />
                  ) : step.status === 'current' ? (
                    <Zap className="w-4 h-4 text-accent-primary animate-pulse-subtle" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-text-muted my-1" />
                  )}
                  <span className="text-[10px] font-bold leading-tight truncate w-full">{step.name}</span>
                  {step.status === 'current' && (
                    <span className="text-[8px] font-bold text-accent-primary uppercase tracking-wider font-mono">Current</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Placement Tracker ── */}
          <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-border-subtle/50">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Placement Tracker</h3>
                <p className="text-[11px] text-text-muted mt-0.5">Recruitment funnel status monitoring.</p>
              </div>
              <button
                onClick={() => setActiveTab('JobTracker')}
                className="bg-accent-primary/10 border border-accent-primary/30 hover:bg-accent-primary/20 text-accent-primary text-[10px] font-bold px-2.5 py-1 rounded-btn transform active:scale-95 transition-all"
              >
                Configure Funnel
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Applications Sent', count: 32, color: 'text-text-primary border-border-subtle bg-background-elevated/40' },
                { label: 'Interview Calls', count: 5, color: 'text-accent-gold border-accent-gold/25 bg-accent-gold/5' },
                { label: 'OA Cleared', count: 3, color: 'text-accent-secondary border-accent-secondary/25 bg-accent-secondary/5' },
                { label: 'Tech Interviews', count: 2, color: 'text-accent-primary border-accent-primary/25 bg-accent-primary/5' },
                { label: 'Offers Secured', count: 0, color: 'text-text-muted border-border-subtle bg-background-elevated/10' }
              ].map((step, idx) => (
                <div key={idx} className={`p-4 rounded-card border flex flex-col justify-between min-h-[90px] select-none ${step.color}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider leading-tight text-text-secondary block">{step.label}</span>
                  <span className="text-3xl font-display font-extrabold block font-mono mt-2">{step.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Project Tracker ── */}
          <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-border-subtle/50">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Project Tracker</h3>
              <button 
                onClick={() => setActiveTab('ResumeBuilder')}
                className="text-accent-primary hover:text-accent-primary/80 text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5"
              >
                Evaluate Project
              </button>
            </div>
            
            <div className="space-y-3">
              {projects.length === 0 ? (
                [
                  { name: 'DevRank Engine', status: '80% Complete', tech: 'React, Node.js, Express', score: 82 },
                  { name: 'Project Triangle', status: '95% Complete', tech: 'MongoDB, Express, React, Node', score: 85 }
                ].map((mock, idx) => (
                  <div key={idx} className="p-3 bg-background-elevated/40 border border-border-subtle rounded-card space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-text-primary block">{mock.name}</span>
                        <span className="text-[10px] text-text-secondary">{mock.tech}</span>
                      </div>
                      <span className="text-[10px] font-bold font-mono text-accent-secondary bg-accent-secondary/5 px-2 py-0.5 rounded border border-accent-secondary/15">{mock.status}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-text-secondary border-t border-border-subtle/30 pt-2 font-mono">
                      <span>Quality Score: <strong className="text-text-primary font-bold">{mock.score}/100</strong></span>
                      <span className="text-accent-primary hover:underline cursor-pointer">View Repo</span>
                    </div>
                  </div>
                ))
              ) : (
                projects.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="p-3 bg-background-elevated/40 border border-border-subtle rounded-card space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-text-primary block">{item.title}</span>
                        <span className="text-[10px] text-text-secondary">{item.techStack || 'Web App'}</span>
                      </div>
                      <span className="text-[10px] font-bold font-mono text-accent-secondary bg-accent-secondary/5 px-2 py-0.5 rounded border border-accent-secondary/15">Evaluated</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-text-secondary border-t border-border-subtle/30 pt-2 font-mono">
                      <span>Quality Score: <strong className="text-text-primary font-bold">{Math.round((item.scores?.architecture + item.scores?.codeQuality + item.scores?.scalability) / 3)}/100</strong></span>
                      {item.repoUrl && <a href={item.repoUrl} target="_blank" rel="noreferrer" className="text-accent-primary hover:underline">View Repo</a>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── AI Insights Card ── */}
          <div className="glow-card p-6 relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/10 rounded-full blur-2xl pointer-events-none" />
            
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 border-b border-border-subtle/50 pb-2">
              <Zap className="w-4 h-4 text-accent-primary animate-pulse-subtle" /> AI Insights
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-text-secondary leading-relaxed">
                <TrendingUp className="w-4.5 h-4.5 text-accent-secondary shrink-0 mt-0.5" />
                <span>You solve <strong className="text-text-primary font-semibold">Array problems 40% faster</strong> than average candidates in your target cohort.</span>
              </div>
              
              <div className="flex items-start gap-2.5 text-xs text-text-secondary leading-relaxed pt-2.5 border-t border-border-subtle/30">
                <AlertCircle className="w-4.5 h-4.5 text-accent-danger shrink-0 mt-0.5" />
                <span>Graph algorithms have a <strong className="text-text-primary font-semibold">52% compilation failure rate</strong> under mock interview time constraints.</span>
              </div>
              
              <div className="p-3 bg-accent-primary/5 border border-accent-primary/20 rounded-card flex gap-2.5 text-xs text-text-secondary mt-2.5">
                <Zap className="w-4.5 h-4.5 text-accent-gold fill-accent-gold/10 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-text-primary block font-semibold mb-0.5">Study Recommendation</strong>
                  "Practice Breadth-First Search (BFS) and Depth-First Search (DFS) algorithms for the next 3 days to balance roadmap ratios."
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Skill Gaps, Recent Activity, Badges & Weekly Goals */}
        <div className="space-y-6">

          {/* ── Skill Gap Analysis ── */}
          <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-border-subtle/50">
              <h3 className="text-sm font-display font-bold text-text-primary">Weak Areas</h3>
              <button 
                onClick={() => setActiveTab('SkillGap')}
                className="text-accent-primary hover:text-accent-primary/80 text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5"
              >
                Run Analyzer <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="space-y-4 pt-1">
              {/* Weak */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-accent-danger uppercase tracking-wider block">❌ Weak Areas</span>
                <div className="space-y-1.5 pl-1.5">
                  {['Dynamic Programming', 'System Design', 'Behavioral Interviews'].map(skill => (
                    <div key={skill} className="text-xs font-semibold text-text-secondary flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-accent-danger" />
                      {skill}
                    </div>
                  ))}
                </div>
              </div>

              {/* Moderate */}
              <div className="space-y-2 pt-2 border-t border-border-subtle/30">
                <span className="text-[10px] font-bold text-accent-gold uppercase tracking-wider block">⚠ Moderate</span>
                <div className="space-y-1.5 pl-1.5">
                  {['Graphs', 'React Performance'].map(skill => (
                    <div key={skill} className="text-xs font-semibold text-text-secondary flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-accent-gold" />
                      {skill}
                    </div>
                  ))}
                </div>
              </div>

              {/* Strong */}
              <div className="space-y-2 pt-2 border-t border-border-subtle/30">
                <span className="text-[10px] font-bold text-accent-secondary uppercase tracking-wider block">✅ Strong</span>
                <div className="space-y-1.5 pl-1.5">
                  {['Arrays', 'Strings', 'HashMaps'].map(skill => (
                    <div key={skill} className="text-xs font-semibold text-text-secondary flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-accent-secondary" />
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Recent Activity Timeline ── */}
          <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Recent Activity</h3>
            
            <div className="space-y-4 pl-3 relative before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border-subtle">
              {[
                { time: 'Today', title: 'Solved 3 DSA Problems', desc: 'Binary Search pattern (Medium) solved in the compiler sandbox.' },
                { time: 'Yesterday', title: 'Completed Resume Review', desc: 'Resubmitted v2 resume and updated ATS rating target.' },
                { time: '2 Days Ago', title: 'Mock Interview Score: 78%', desc: 'Technical loop completed with Stripe AI profile.' }
              ].map((act, idx) => (
                <div key={idx} className="relative pl-5 text-xs">
                  <div className="absolute left-[-2px] top-1.5 w-2.5 h-2.5 rounded-full bg-accent-primary border-2 border-background-surface" />
                  <span className="text-[9px] font-bold text-accent-primary uppercase font-mono block tracking-wider leading-none">{act.time}</span>
                  <h4 className="font-bold text-text-primary mt-1 leading-snug">{act.title}</h4>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-normal">{act.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Mock Interview Results ── */}
          <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-border-subtle/50">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Mock Interview Results</h3>
              <button 
                onClick={() => setActiveTab('MockInterview')}
                className="text-accent-secondary hover:text-accent-secondary/80 text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5"
              >
                New Interview
              </button>
            </div>
            
            <div className="space-y-3">
              {interviews.length === 0 ? (
                [
                  { company: 'Google', type: 'Technical', difficulty: 'Medium', score: 74, date: 'June 12, 2026' },
                  { company: 'Stripe', type: 'System Design', difficulty: 'Hard', score: 68, date: 'June 08, 2026' }
                ].map((mock, idx) => (
                  <div key={idx} className="p-3 bg-background-elevated/40 border border-border-subtle rounded-card flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-text-primary block">{mock.company} — {mock.type}</span>
                      <span className="text-[10px] text-text-secondary">{mock.date} · {mock.difficulty}</span>
                    </div>
                    <span className="text-sm font-bold text-accent-secondary font-mono bg-accent-secondary/5 border border-accent-secondary/15 px-2.5 py-1 rounded">{mock.score}%</span>
                  </div>
                ))
              ) : (
                interviews.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="p-3 bg-background-elevated/40 border border-border-subtle rounded-card flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-text-primary block">{item.company} — {item.type}</span>
                      <span className="text-[10px] text-text-secondary">
                        {item.finishedAt ? new Date(item.finishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'In Progress'} · {item.difficulty}
                      </span>
                    </div>
                    <span className={`text-sm font-bold font-mono px-2.5 py-1 rounded border ${
                      item.feedback?.overallScore >= 80 ? 'text-accent-secondary bg-accent-secondary/5 border-accent-secondary/15' :
                      item.feedback?.overallScore >= 50 ? 'text-accent-gold bg-accent-gold/5 border-accent-gold/15' :
                      'text-text-muted bg-background-elevated border-border-subtle'
                    }`}>
                      {item.feedback?.overallScore ? `${item.feedback.overallScore}%` : 'N/A'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Achievements & Goals ── */}
          <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Gamification & Badges</h3>
            
            <div className="space-y-3">
              {[
                { emoji: '🏆', title: 'Problem Slayer', desc: 'Solved 100 DSA Problems', unlocked: true },
                { emoji: '🔥', title: '15 Day Streak', desc: 'Maintained active learning loop', unlocked: true },
                { emoji: '🚀', title: 'ATS Master', desc: 'Resume score above 90 achieved', unlocked: true },
                { emoji: '🎯', title: 'Interview Ninja', desc: 'Mock score above 85 achieved', unlocked: false }
              ].map((badge, idx) => (
                <div
                  key={idx}
                  className={`p-3 border rounded-card flex items-center gap-3 transition-all ${
                    badge.unlocked
                      ? 'bg-background-elevated/40 border-accent-gold/25 text-text-primary'
                      : 'bg-background-elevated/10 border-border-subtle/50 text-text-muted opacity-50'
                  }`}
                >
                  <div className="text-2xl shrink-0">{badge.emoji}</div>
                  <div>
                    <h4 className="text-xs font-bold leading-normal">{badge.title}</h4>
                    <p className="text-[10px] text-text-secondary leading-normal">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Upcoming Weekly Goals ── */}
          <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Upcoming Goals (This Week)</h3>
            
            <div className="space-y-3 text-xs">
              {[
                { id: 'goal-1', text: 'Solve 15 Problems', done: false },
                { id: 'goal-2', text: 'Improve Resume Score to 90', done: false },
                { id: 'goal-3', text: 'Complete 2 Mock Interviews', done: false },
                { id: 'goal-4', text: 'Build React Project', done: false }
              ].map((goal) => (
                <div 
                  key={goal.id} 
                  className="flex items-center gap-2.5 p-2.5 bg-background-elevated/40 border border-border-subtle rounded hover:border-accent-primary/20 transition-all cursor-pointer"
                >
                  <input 
                    type="checkbox" 
                    defaultChecked={goal.done} 
                    className="w-4 h-4 rounded border-border-subtle bg-background-elevated text-accent-primary focus:ring-accent-primary accent-accent-primary shrink-0" 
                  />
                  <span className={`font-semibold ${goal.done ? 'text-text-muted line-through' : 'text-text-primary'}`}>{goal.text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
