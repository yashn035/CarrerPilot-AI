import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Database, Brain, Sparkles, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

export default function ResultsPanel({ result, isSubmission, autopsy }) {
  const [activeTab, setActiveTab] = useState('testcases');
  const [expandedFollowUp, setExpandedFollowUp] = useState({});

  if (!result) return null;

  const toggleFollowUp = (idx) => {
    setExpandedFollowUp((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const resultsList = result.results || [];
  const passedCount = result.passedCount || 0;
  const totalCount = result.totalCount || resultsList.length || 0;
  const isSuccess = result.success;

  return (
    <div className="bg-background-surface border border-border-subtle rounded-card overflow-hidden mt-4">
      {/* Tab Navigation & Status Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-background-elevated border-b border-border-subtle">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isSuccess ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
            <span className={`font-bold text-sm ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
              {isSubmission
                ? isSuccess ? 'Accepted' : 'Wrong Answer / Error'
                : isSuccess ? 'Test Cases Passed' : 'Test Cases Failed'}
            </span>
            <span className="text-xs font-mono text-text-muted bg-background-surface px-2 py-0.5 rounded border border-border-subtle">
              {passedCount} / {totalCount} Passed
            </span>
          </div>

          <div className="flex items-center gap-1 border-l border-border-subtle pl-4">
            <button
              onClick={() => setActiveTab('testcases')}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                activeTab === 'testcases' ? 'bg-accent-primary text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Test Cases
            </button>
            {(autopsy || result.autopsy) && (
              <button
                onClick={() => setActiveTab('autopsy')}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded transition-colors ${
                  activeTab === 'autopsy' ? 'bg-purple-600 text-white' : 'text-purple-400 hover:text-purple-300'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>AI Autopsy Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Runtime & Memory Metrics */}
        <div className="flex items-center gap-3 text-xs font-mono text-text-secondary">
          <div className="flex items-center gap-1" title="Execution Time">
            <Clock className="w-3.5 h-3.5 text-accent-primary" />
            <span>{result.runtimeMs || 12} ms</span>
          </div>
          <div className="flex items-center gap-1" title="Memory Footprint">
            <Database className="w-3.5 h-3.5 text-accent-primary" />
            <span>{result.memoryMb || 34.2} MB</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 max-h-[300px] overflow-y-auto font-mono text-xs">
        {activeTab === 'testcases' && (
          <div className="space-y-3">
            {result.error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-md">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span>Execution Error / Stderr:</span>
                </div>
                <pre className="whitespace-pre-wrap">{result.error}</pre>
              </div>
            )}

            {resultsList.map((tc, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-md border ${
                  tc.passed
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-red-500/5 border-red-500/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2 font-sans font-bold">
                  <span className={tc.passed ? 'text-green-400' : 'text-red-400'}>
                    Test Case #{idx + 1} {tc.isHidden ? '(Hidden)' : ''}: {tc.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>

                {!tc.isHidden && (
                  <div className="space-y-1 text-text-secondary">
                    <div>
                      <span className="text-text-muted">Input: </span>
                      <code className="text-text-primary">{tc.input || 'N/A'}</code>
                    </div>
                    <div>
                      <span className="text-text-muted">Expected Output: </span>
                      <code className="text-green-400">{tc.expected || 'N/A'}</code>
                    </div>
                    <div>
                      <span className="text-text-muted">Actual Output: </span>
                      <code className={tc.passed ? 'text-green-400' : 'text-red-400'}>
                        {tc.actual || tc.stdout || '(Empty Output)'}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* AI Autopsy Tab */}
        {activeTab === 'autopsy' && (autopsy || result.autopsy) && (
          <div className="space-y-4 font-sans">
            {/* Complexity Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-background-elevated border border-border-subtle rounded-md">
                <div className="text-text-muted text-[11px]">Time Complexity</div>
                <div className="text-lg font-bold text-accent-primary font-mono mt-0.5">
                  {(autopsy || result.autopsy).timeComplexity || 'O(N)'}
                </div>
              </div>

              <div className="p-3 bg-background-elevated border border-border-subtle rounded-md">
                <div className="text-text-muted text-[11px]">Space Complexity</div>
                <div className="text-lg font-bold text-green-400 font-mono mt-0.5">
                  {(autopsy || result.autopsy).spaceComplexity || 'O(1)'}
                </div>
              </div>

              <div className="p-3 bg-background-elevated border border-border-subtle rounded-md">
                <div className="text-text-muted text-[11px]">Runtime Percentile</div>
                <div className="text-lg font-bold text-purple-400 font-mono mt-0.5">
                  Beats {(autopsy || result.autopsy).runtimePercentile || 88}%
                </div>
              </div>
            </div>

            {/* AI Explanation */}
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-md">
              <div className="flex items-center gap-1.5 font-bold text-purple-300 text-xs mb-1">
                <Brain className="w-4 h-4 text-purple-400" />
                <span>AI Code Efficiency Analysis:</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                {(autopsy || result.autopsy).explanation}
              </p>
            </div>

            {/* Conceptual Follow-up Questions */}
            {((autopsy || result.autopsy).followUpQuestions || []).length > 0 && (
              <div className="space-y-2">
                <div className="font-bold text-text-primary text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-accent-primary" />
                  <span>Interview Follow-Up Conceptual Questions:</span>
                </div>

                {((autopsy || result.autopsy).followUpQuestions || []).map((q, idx) => (
                  <div key={idx} className="bg-background-elevated border border-border-subtle rounded-md overflow-hidden">
                    <button
                      onClick={() => toggleFollowUp(idx)}
                      className="w-full p-2.5 text-left flex items-center justify-between text-xs font-semibold text-text-primary hover:bg-background-surface transition-colors"
                    >
                      <span>Q{idx + 1}: {q}</span>
                      {expandedFollowUp[idx] ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                    </button>
                    {expandedFollowUp[idx] && (
                      <div className="p-2.5 pt-0 text-xs text-text-secondary bg-background-surface border-t border-border-subtle">
                        <p className="italic text-accent-primary">
                          Tip: In interviews, structure your response by stating assumptions, evaluating edge cases, and analyzing space/time trade-offs.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
