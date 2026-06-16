import React from 'react';
import Editor from '@monaco-editor/react';
import { Shield, Check, RefreshCw, AlertTriangle, Award, Timer } from 'lucide-react';

export default function MockOASimulator({
    oaActive, oaSession, oaReport, oaLoading,
    oaTimeLeft, oaActiveIdx, setOaActiveIdx,
    oaAnswers, setOaAnswers,
    oaFocusLost, setOaFocusLost,
    handleStartOa, handleEndOa, handleOaCodeSubmit
}) {
    return (
        <div className="flex-grow overflow-y-auto p-4 md:p-8 space-y-8 max-w-5xl mx-auto w-full pb-24">
            <div className="border-b border-border-subtle pb-4">
                <h1 className="text-xl font-display font-bold text-text-primary">Online Assessment (OA) Simulator</h1>
                <p className="text-xs text-text-secondary mt-1">Practice under strict assessment constraints: real-time timers, blind outputs, and cheat-preventing window monitors.</p>
            </div>

            {/* Pre-start screen */}
            {!oaActive && !oaReport && (
                <div className="glow-card p-8 text-center space-y-6 max-w-xl mx-auto relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-secondary/5 rounded-full blur-xl"></div>
                    <Shield className="w-12 h-12 text-accent-secondary mx-auto animate-bounce" />
                    <div className="space-y-2">
                        <h2 className="text-lg font-bold text-text-primary">Ready to begin Online Assessment?</h2>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            You will be given 3 coding problems to solve sequentially within 60 minutes.
                            Leaving the page or switching browser tabs triggers cheat monitoring focus alerts.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-left text-xs bg-[#0E0F14] border border-border-subtle p-4 rounded-card">
                        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-accent-secondary" /> <span>60 Minute Countdown</span></div>
                        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-accent-secondary" /> <span>3 Coding Questions</span></div>
                        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-accent-secondary" /> <span>No AI Autopsy hints</span></div>
                        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-accent-secondary" /> <span>Focus Lockout Enabled</span></div>
                    </div>
                    <button
                        onClick={handleStartOa}
                        disabled={oaLoading}
                        className="bg-accent-secondary text-background-primary hover:bg-accent-secondary/95 font-bold text-xs px-6 py-2.5 rounded-btn transform active:scale-95 transition-all shadow-lg shadow-accent-secondary/15"
                    >
                        {oaLoading ? <RefreshCw className="w-4 h-4 animate-spin inline" /> : "Start Assessment"}
                    </button>
                </div>
            )}

            {/* Active OA Workspace */}
            {oaActive && oaSession && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

                    {/* OA Sidebar */}
                    <div className="lg:col-span-1 bg-background-surface border border-border-subtle p-5 rounded-card space-y-5">
                        <div className="space-y-1 border-b border-border-subtle pb-3">
                            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest font-mono">Timer Remaining</span>
                            <div className="text-2xl font-bold font-mono text-accent-danger flex items-center gap-1.5">
                                <Timer className="w-5 h-5 animate-pulse" />
                                {Math.floor(oaTimeLeft / 60)}:{(oaTimeLeft % 60).toString().padStart(2, '00')}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest font-mono">Select Question</span>
                            <div className="space-y-1">
                                {oaSession.problems.map((prob, idx) => (
                                    <button
                                        key={prob.id}
                                        onClick={() => setOaActiveIdx(idx)}
                                        className={`w-full text-left px-3 py-2 rounded text-xs font-semibold flex items-center gap-2 border transition-all ${oaActiveIdx === idx
                                            ? 'bg-accent-secondary/10 border-accent-secondary/20 text-accent-secondary'
                                            : 'bg-background-elevated border-border-subtle text-text-secondary hover:text-text-primary'
                                        }`}
                                    >
                                        <span className="font-mono">{idx + 1}.</span>
                                        <span className="truncate">{prob.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={handleEndOa}
                            className="w-full bg-accent-danger/10 border border-accent-danger/25 hover:bg-accent-danger/20 text-accent-danger text-xs font-bold py-2 rounded transition-all"
                        >
                            Finish Assessment
                        </button>
                    </div>

                    {/* OA Editor Panel */}
                    <div className="lg:col-span-3 bg-background-surface border border-border-subtle rounded-card p-6 space-y-6 relative">

                        {/* Anti-cheat lockout overlay */}
                        {oaFocusLost && (
                            <div className="absolute inset-0 bg-background-primary/95 z-50 flex flex-col items-center justify-center p-6 text-center rounded-card">
                                <AlertTriangle className="w-12 h-12 text-accent-danger animate-bounce mb-3" />
                                <h3 className="text-lg font-bold text-text-primary">Assessment Lockout Engaged</h3>
                                <p className="text-xs text-text-secondary max-w-xs leading-relaxed mt-2">
                                    Online Assessments are strictly monitored. Focus was lost from the assessment workspace window.
                                </p>
                                <button
                                    onClick={() => setOaFocusLost(false)}
                                    className="bg-accent-secondary text-background-primary hover:bg-accent-secondary/95 text-xs font-bold px-4 py-2 rounded-btn mt-4 transform active:scale-95"
                                >
                                    Return to Assessment
                                </button>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-border-subtle pb-3">
                                <h3 className="text-sm font-bold text-text-primary">
                                    {oaActiveIdx + 1}. {oaSession.problems[oaActiveIdx].title} ({oaSession.problems[oaActiveIdx].difficulty})
                                </h3>
                                <span className="text-[10px] font-mono text-text-secondary">{oaSession.problems[oaActiveIdx].category}</span>
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed font-sans">
                                {oaSession.problems[oaActiveIdx].description}
                            </p>
                            <div className="border border-border-subtle h-64 rounded overflow-hidden">
                                <Editor
                                    height="100%"
                                    theme="vs-dark"
                                    language="javascript"
                                    value={oaAnswers[oaSession.problems[oaActiveIdx].id]}
                                    onChange={(val) => {
                                        setOaAnswers({ ...oaAnswers, [oaSession.problems[oaActiveIdx].id]: val });
                                    }}
                                    options={{ fontSize: 12, minimap: { enabled: false } }}
                                />
                            </div>
                            <div className="flex justify-end gap-2 select-none">
                                <button
                                    onClick={handleOaCodeSubmit}
                                    className="bg-accent-secondary text-background-primary hover:bg-accent-secondary/95 text-xs font-bold px-5 py-2 rounded-btn transform active:scale-95 transition-all"
                                >
                                    Verify Code Solution
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* OA Score Report */}
            {oaReport && (
                <div className="bg-background-surface border border-border-subtle rounded-card p-6 max-w-2xl mx-auto space-y-6">
                    <div className="text-center space-y-2 border-b border-border-subtle pb-4">
                        <Award className="w-10 h-10 text-accent-gold mx-auto animate-pulse" />
                        <h2 className="text-xl font-display font-bold text-text-primary">Online Assessment Score Card</h2>
                        <p className="text-xs text-text-secondary">Official mock assessment benchmark score compiled successfully.</p>
                    </div>
                    <div className="flex justify-around items-center py-4 bg-[#0E0F14] border border-border-subtle rounded-card font-mono text-xs">
                        <div className="text-center">
                            <span className="text-text-secondary block">Overall Score</span>
                            <span className="text-2xl font-bold text-accent-secondary mt-1">{oaReport.score}%</span>
                        </div>
                        <div className="text-center">
                            <span className="text-text-secondary block">Success Problems</span>
                            <span className="text-2xl font-bold text-text-primary mt-1">{oaReport.solvedCount}/{oaReport.totalCount}</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest">Question Breakdown</h4>
                        <div className="space-y-2 font-mono text-xs">
                            {oaReport.submissions.map((sub, idx) => (
                                <div key={idx} className="p-3 bg-background-elevated border border-border-subtle rounded flex justify-between items-center">
                                    <div>
                                        <span className="font-bold text-text-primary">Problem {idx + 1}: {sub.problemId}</span>
                                        <span className="block text-[10px] text-text-secondary mt-0.5">Language: {sub.language}</span>
                                    </div>
                                    <span className={sub.success ? 'text-accent-secondary font-bold' : 'text-accent-danger font-bold'}>
                                        {sub.success ? 'SUCCESS' : 'FAILED'} ({sub.passedCount}/{sub.totalCount} tests)
                                    </span>
                                </div>
                            ))}
                            {oaReport.submissions.length === 0 && (
                                <div className="text-xs text-text-muted italic text-center py-2">No problem solutions submitted during assessment.</div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleStartOa}
                        className="w-full bg-accent-secondary text-background-primary hover:bg-accent-secondary/95 text-xs font-bold py-2.5 rounded-btn text-center"
                    >
                        Restart Assessment Simulator
                    </button>
                </div>
            )}

        </div>
    );
}
