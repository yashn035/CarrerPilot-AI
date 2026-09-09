import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Timer, AlertTriangle, ShieldAlert, CheckCircle2, PlayCircle, Loader2, Award, ArrowRight, RefreshCcw } from 'lucide-react';
import { useUser } from '../../context/UserContext';

export default function OASimulator({ onFinishOA }) {
  const { getAuthHeaders } = useUser();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeProblemIdx, setActiveProblemIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { problemId: { code, language } }
  const [language, setLanguage] = useState('javascript');
  const [secondsLeft, setSecondsLeft] = useState(3600); // 60 mins
  const [warnings, setWarnings] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [submittingOA, setSubmittingOA] = useState(false);
  const [scorecard, setScorecard] = useState(null);

  // Load persistent session from localStorage if present
  useEffect(() => {
    const saved = localStorage.getItem('cp_oa_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && !parsed.completed) {
          setSession(parsed);
          setAnswers(parsed.answers || {});
          setWarnings(parsed.warnings || 0);
          const elapsed = Math.floor((Date.now() - new Date(parsed.startTime).getTime()) / 1000);
          setSecondsLeft(Math.max(0, 3600 - elapsed));
        }
      } catch (e) {}
    }
  }, []);

  // Timer Countdown
  useEffect(() => {
    let interval;
    if (session && !session.completed && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleFinishSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session, secondsLeft]);

  // Anti-Cheat Window Blur & Visibility Change Detector
  useEffect(() => {
    if (!session || session.completed) return;

    const handleFocusLost = async () => {
      setWarnings((w) => {
        const newCount = w + 1;
        setShowWarningModal(true);
        // Sync warning count to backend
        fetch('/api/coding/oa/warning', {
          method: 'POST',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: session.id })
        }).catch(() => {});
        return newCount;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) handleFocusLost();
    };

    window.addEventListener('blur', handleFocusLost);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleFocusLost);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session]);

  const handleStartSession = async (company = 'Google') => {
    setLoading(true);
    try {
      const res = await fetch('/api/coding/oa/start', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ company })
      });
      if (res.ok) {
        const newSession = await res.json();
        setSession(newSession);
        setAnswers({});
        setWarnings(0);
        setSecondsLeft(3600);
        setScorecard(null);
        localStorage.setItem('cp_oa_session', JSON.stringify(newSession));
      }
    } catch (e) {
      console.error('Failed to start OA session:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (newCode) => {
    if (!session || !currentProblem) return;
    const pid = currentProblem.id || currentProblem.titleSlug;
    const updated = {
      ...answers,
      [pid]: { code: newCode, language }
    };
    setAnswers(updated);
    
    // Auto-save draft locally & backend
    const updatedSession = { ...session, answers: updated };
    localStorage.setItem('cp_oa_session', JSON.stringify(updatedSession));

    fetch('/api/coding/oa/answer', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.id,
        problemId: pid,
        code: newCode,
        language
      })
    }).catch(() => {});
  };

  const handleFinishSession = async () => {
    if (!session || submittingOA) return;
    setSubmittingOA(true);
    try {
      const res = await fetch('/api/coding/oa/end', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id })
      });
      if (res.ok) {
        const result = await res.json();
        setScorecard(result.report);
        setSession((s) => ({ ...s, completed: true }));
        localStorage.removeItem('cp_oa_session');
      }
    } catch (e) {
      console.error('Failed to finish OA session:', e);
    } finally {
      setSubmittingOA(false);
    }
  };

  // If no active session, show Start OA Lobby
  if (!session) {
    return (
      <div className="max-w-4xl mx-auto w-full p-8 space-y-6">
        <div className="bg-background-surface border border-border-subtle rounded-card p-8 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto text-accent-primary">
            <Timer className="w-8 h-8" />
          </div>

          <div className="max-w-lg mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-text-primary">Mock Online Assessment (OA) Simulator</h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              Simulate real company online screening assessments. 60-minute timed environment with 3 curated problems (Easy, Medium, Hard) and anti-cheat tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
            <div className="p-4 bg-background-elevated border border-border-subtle rounded-md">
              <div className="font-bold text-xs text-text-primary mb-1">⏱️ Timed 60 Mins</div>
              <div className="text-[11px] text-text-muted">Simulates strict time pressure per problem.</div>
            </div>
            <div className="p-4 bg-background-elevated border border-border-subtle rounded-md">
              <div className="font-bold text-xs text-text-primary mb-1">🛡️ Anti-Cheat Monitoring</div>
              <div className="text-[11px] text-text-muted">Tracks tab switches & focus loss events.</div>
            </div>
            <div className="p-4 bg-background-elevated border border-border-subtle rounded-md">
              <div className="font-bold text-xs text-text-primary mb-1">📊 Instant Scorecard</div>
              <div className="text-[11px] text-text-muted">Full evaluation report upon completion.</div>
            </div>
          </div>

          <button
            onClick={() => handleStartSession('Google')}
            disabled={loading}
            className="px-8 py-3 bg-accent-primary hover:bg-accent-primary/90 text-white font-bold text-sm rounded-lg transition-all shadow-glow flex items-center gap-2 mx-auto disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
            <span>Start 60-Minute OA Simulation</span>
          </button>
        </div>
      </div>
    );
  }

  // If scorecard exists, show Final Report
  if (scorecard || session.completed) {
    const report = scorecard || session.report || { score: 0, passedProblemsCount: 0, totalProblemsCount: 3, feedback: '' };
    return (
      <div className="max-w-3xl mx-auto w-full p-8 space-y-6">
        <div className="bg-background-surface border border-border-subtle rounded-card p-8 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center justify-center mx-auto text-purple-400">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-text-primary">OA Session Completed</h2>
            <p className="text-xs text-text-secondary mt-1">{report.feedback || 'Assessment session evaluated.'}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="p-4 bg-background-elevated rounded-lg border border-border-subtle">
              <div className="text-2xl font-extrabold text-accent-primary">{report.score}%</div>
              <div className="text-[11px] text-text-muted mt-0.5">Overall Score</div>
            </div>
            <div className="p-4 bg-background-elevated rounded-lg border border-border-subtle">
              <div className="text-2xl font-extrabold text-green-400">{report.passedProblemsCount} / {report.totalProblemsCount || 3}</div>
              <div className="text-[11px] text-text-muted mt-0.5">Problems Solved</div>
            </div>
            <div className="p-4 bg-background-elevated rounded-lg border border-border-subtle">
              <div className="text-2xl font-extrabold text-amber-400">{warnings}</div>
              <div className="text-[11px] text-text-muted mt-0.5">Cheat Warnings</div>
            </div>
          </div>

          <button
            onClick={() => {
              setSession(null);
              setScorecard(null);
            }}
            className="px-6 py-2.5 bg-background-elevated hover:bg-background-surface border border-border-subtle text-text-primary font-bold text-xs rounded-md transition-all flex items-center gap-2 mx-auto"
          >
            <RefreshCcw className="w-4 h-4 text-accent-primary" />
            <span>Start New OA Session</span>
          </button>
        </div>
      </div>
    );
  }

  const currentProblem = session.problems?.[activeProblemIdx] || {};
  const currentPid = currentProblem.id || currentProblem.titleSlug;
  const currentCode = (answers[currentPid] && answers[currentPid].code) || currentProblem.starterCode?.[language] || '';

  return (
    <div className="max-w-7xl mx-auto w-full p-4 space-y-4">
      {/* Anti-Cheat Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background-surface border border-red-500/40 rounded-card p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <ShieldAlert className="w-8 h-8" />
              <div>
                <h3 className="font-bold text-lg text-text-primary">Anti-Cheat Warning!</h3>
                <p className="text-xs text-red-400 font-medium">Focus Lost / Tab Switch Detected</p>
              </div>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              In actual company Online Assessments, switching tabs or leaving the workspace gets flagged to recruiters. Warning count: <span className="font-bold text-red-400">{warnings}</span>.
            </p>
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded transition-all"
            >
              Resume Assessment
            </button>
          </div>
        </div>
      )}

      {/* Top Session Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-background-surface border border-border-subtle rounded-card shadow-sm">
        {/* Question Selector Tabs */}
        <div className="flex items-center gap-2">
          {session.problems.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setActiveProblemIdx(idx)}
              className={`px-4 py-2 rounded text-xs font-bold transition-all flex items-center gap-2 ${
                activeProblemIdx === idx
                  ? 'bg-accent-primary text-white shadow-glow'
                  : 'bg-background-elevated text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>Q{idx + 1}: {p.title}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                p.difficulty === 'Easy' ? 'bg-green-500/20 border-green-500/40 text-green-300' :
                p.difficulty === 'Medium' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300' :
                'bg-red-500/20 border-red-500/40 text-red-300'
              }`}>
                {p.difficulty}
              </span>
            </button>
          ))}
        </div>

        {/* Timer & Warning Indicator */}
        <div className="flex items-center gap-6">
          {warnings > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded">
              <AlertTriangle className="w-4 h-4" />
              <span>Warnings: {warnings}</span>
            </div>
          )}

          <div className="flex items-center gap-2 font-mono text-sm font-bold text-text-primary bg-background-elevated px-4 py-1.5 rounded border border-border-subtle">
            <Timer className="w-4 h-4 text-accent-primary" />
            <span>
              {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <button
            onClick={handleFinishSession}
            disabled={submittingOA}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold text-xs rounded transition-all shadow-glow flex items-center gap-1.5 disabled:opacity-50"
          >
            {submittingOA ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Submit All & Finish</span>
          </button>
        </div>
      </div>

      {/* Split Problem & Workspace Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[620px]">
        {/* Left: Problem Statement */}
        <div className="bg-background-surface border border-border-subtle rounded-card p-6 overflow-y-auto space-y-4">
          <div className="border-b border-border-subtle pb-3">
            <h3 className="text-lg font-bold text-text-primary">{currentProblem.title}</h3>
            <span className="text-xs text-accent-primary font-medium">{currentProblem.category}</span>
          </div>
          <div
            className="prose prose-invert prose-xs text-text-secondary leading-relaxed"
            dangerouslySetInnerHTML={{ __html: currentProblem.description || '' }}
          />
        </div>

        {/* Right: Monaco Code Editor */}
        <div className="bg-background-surface border border-border-subtle rounded-card overflow-hidden flex flex-col">
          <div className="p-3 bg-background-elevated border-b border-border-subtle flex justify-between items-center text-xs">
            <span className="font-semibold text-text-secondary">Solution Code (Q{activeProblemIdx + 1})</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-background-surface border border-border-subtle rounded px-2 py-1 text-text-primary outline-none"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              language={language === 'python' ? 'python' : language === 'java' ? 'java' : language === 'cpp' ? 'cpp' : 'javascript'}
              value={currentCode}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{ minimap: { enabled: false }, fontSize: 13, automaticLayout: true }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
