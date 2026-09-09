import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Clock, FileCode2, Sparkles, Loader2 } from 'lucide-react';
import EditorPanel from './EditorPanel';
import ResultsPanel from './ResultsPanel';
import BlindModeToggle from './BlindModeToggle';
import { useUser } from '../../context/UserContext';

export default function ProblemWorkspace({ problem, onBack }) {
  const { getAuthHeaders } = useUser();
  const [fullProblem, setFullProblem] = useState(problem);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [execResult, setExecResult] = useState(null);
  const [isSubmission, setIsSubmission] = useState(false);

  // Blind mode state
  const [blindMode, setBlindMode] = useState(false);
  const [peeksRemaining, setPeeksRemaining] = useState(3);

  // Fetch full problem details if description is missing
  useEffect(() => {
    if (problem) {
      const probId = problem.id || problem.titleSlug;
      if (!problem.description) {
        setLoadingDetail(true);
        fetch(`/api/coding/${probId}`, { headers: getAuthHeaders() })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data && data.description) {
              setFullProblem(data);
            } else {
              setFullProblem(problem);
            }
          })
          .catch(() => setFullProblem(problem))
          .finally(() => setLoadingDetail(false));
      } else {
        setFullProblem(problem);
      }
    }
  }, [problem]);

  const activeProb = fullProblem || problem;
  const problemId = activeProb.id || activeProb.titleSlug;

  // Populate code template when activeProb or language changes
  useEffect(() => {
    if (activeProb) {
      const starter =
        activeProb.starterCode?.[language] ||
        (language === 'python'
          ? 'def solution():\n    # Write python solution here\n    pass'
          : language === 'java'
          ? 'class Solution {\n    // Write java solution here\n}'
          : language === 'cpp'
          ? 'class Solution {\npublic:\n    // Write C++ solution here\n};'
          : 'function solution() {\n  // Write JavaScript solution here\n}');
      setCode(starter);
    }
  }, [activeProb, language]);

  if (!activeProb) return null;

  const handleRun = async () => {
    setRunning(true);
    setExecResult(null);
    setIsSubmission(false);
    try {
      const res = await fetch(`/api/coding/${problemId}/run`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });
      if (res.ok) {
        const data = await res.json();
        setExecResult(data);
      }
    } catch (e) {
      console.error('Run failed:', e);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setExecResult(null);
    setIsSubmission(true);
    try {
      const res = await fetch(`/api/coding/${problemId}/submit`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });
      if (res.ok) {
        const data = await res.json();
        setExecResult(data);
      }
    } catch (e) {
      console.error('Submission failed:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-4 space-y-4">
      {/* Top Header Navigation Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-background-surface border border-border-subtle p-3.5 rounded-card shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded hover:bg-background-elevated border border-border-subtle text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-text-primary text-base">{activeProb.title}</h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  activeProb.difficulty === 'Easy'
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : activeProb.difficulty === 'Medium'
                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}
              >
                {activeProb.difficulty}
              </span>
            </div>
            <span className="text-xs text-text-muted">{activeProb.category || 'Algorithms'}</span>
          </div>
        </div>

        {/* Blind Mode Toolbar */}
        <BlindModeToggle
          blindMode={blindMode}
          setBlindMode={setBlindMode}
          peeksRemaining={peeksRemaining}
          onPeekUsed={() => setPeeksRemaining((p) => Math.max(0, p - 1))}
        />
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Pane: Problem Description (5/12 cols) */}
        <div className="lg:col-span-5 flex flex-col h-[700px] bg-background-surface border border-border-subtle rounded-card overflow-hidden shadow-sm">
          <div className="p-3 bg-background-elevated border-b border-border-subtle flex items-center justify-between text-xs font-semibold text-text-secondary">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent-primary" />
              <span>Problem Description</span>
            </div>
            {loadingDetail && <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-primary" />}
          </div>

          <div
            className={`p-6 flex-1 overflow-y-auto space-y-6 transition-all ${
              blindMode ? 'backdrop-blur-md opacity-20 filter select-none' : ''
            }`}
          >
            {/* Description Text / HTML */}
            {activeProb.description ? (
              <div
                className="prose prose-invert prose-xs text-text-secondary leading-relaxed max-w-none space-y-3"
                dangerouslySetInnerHTML={{ __html: activeProb.description }}
              />
            ) : (
              <div className="text-xs text-text-muted italic p-4">Loading problem description...</div>
            )}

            {/* Examples List */}
            {Array.isArray(activeProb.examples) && activeProb.examples.length > 0 && (
              <div className="space-y-4 pt-2">
                <h4 className="font-bold text-xs text-text-primary">Examples</h4>
                {activeProb.examples.map((ex, idx) => (
                  <div key={idx} className="bg-background-elevated p-3 rounded border border-border-subtle space-y-1 text-xs font-mono">
                    {ex.input && (
                      <div>
                        <span className="text-text-muted font-sans font-semibold">Input: </span>
                        <code className="text-text-primary">{ex.input}</code>
                      </div>
                    )}
                    {ex.output && (
                      <div>
                        <span className="text-text-muted font-sans font-semibold">Output: </span>
                        <code className="text-accent-primary">{ex.output}</code>
                      </div>
                    )}
                    {ex.explanation && (
                      <div className="text-text-secondary font-sans text-[11px] pt-1 italic">
                        Explanation: {ex.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Constraints */}
            {Array.isArray(activeProb.constraints) && activeProb.constraints.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-xs text-text-primary">Constraints</h4>
                <ul className="list-disc list-inside space-y-1 text-xs text-text-secondary font-mono">
                  {activeProb.constraints.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Monaco Editor & Output Results (7/12 cols) */}
        <div className="lg:col-span-7 flex flex-col h-[700px] overflow-y-auto space-y-4">
          <div className="flex-1">
            <EditorPanel
              language={language}
              setLanguage={setLanguage}
              code={code}
              setCode={setCode}
              onRun={handleRun}
              onSubmit={handleSubmit}
              running={running}
              submitting={submitting}
            />
          </div>

          {/* Execution Results & AI Autopsy */}
          <ResultsPanel result={execResult} isSubmission={isSubmission} />
        </div>
      </div>
    </div>
  );
}
