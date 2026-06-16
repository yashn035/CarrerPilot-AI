import React from 'react';
import Editor from '@monaco-editor/react';
import {
    Sparkles, Code, Send, EyeOff,
    RefreshCw, AlertTriangle, CheckCircle, Terminal as TermIcon,
    ChevronRight, Brain, Lock
} from 'lucide-react';

export default function ArenaWorkspace({
    problem,
    code, setCode,
    activeLang, setActiveLang,
    blindMode, setBlindMode,
    peeking, peeksUsed, triggerPeek,
    blindTimerActive, secondsLeft,
    votedApproach, setVotedApproach,
    approaches, loadingApproaches,
    submitting, consoleOutput,
    showAutopsy, setShowAutopsy, autopsyData, autopsyLoading,
    showInterviewFollowUp, setShowInterviewFollowUp,
    followUpQuestions, followUpAnswers, setFollowUpAnswers,
    recallScore, submittingFollowUps,
    handleSubmit, handleSubmitFollowUps,
    addToast
}) {
    return (
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative min-w-0">

            {/* Phase 1: Approach Lock Modal */}
            {!votedApproach && (
                <div className="absolute inset-0 bg-[#0A0A0F]/95 backdrop-blur-md z-[45] flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full bg-[#141720] border border-border-subtle p-8 rounded-card shadow-2xl space-y-6 text-center relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full blur-xl"></div>
                        <div className="w-12 h-12 bg-accent-primary/10 border border-accent-primary/20 rounded-full flex items-center justify-center text-accent-primary mx-auto">
                            <Lock className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <span className="text-xs font-bold text-accent-primary uppercase tracking-widest block font-mono">Phase 1: Deliberate Engineering</span>
                            <h2 className="text-xl font-display font-bold text-text-primary">Lock In Your Algorithmic Approach</h2>
                            <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
                                Recruiters assess strategy, not just compile compliance. Choose your implementation path before typing.
                            </p>
                        </div>
                        {loadingApproaches ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-2">
                                <RefreshCw className="w-6 h-6 text-accent-primary animate-spin" />
                                <span className="text-xs text-text-secondary">Generating AI approaches list...</span>
                            </div>
                        ) : (
                            <div className="grid gap-3 pt-2 text-left">
                                {approaches.map((appr, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setVotedApproach(appr);
                                            addToast(`Strategy Voted: ${appr.name}`, "success");
                                        }}
                                        className="w-full p-4 bg-background-elevated border border-border-subtle hover:border-accent-primary/50 hover:bg-accent-primary/5 rounded-card transition-all flex justify-between items-center gap-4 text-xs text-text-primary group"
                                    >
                                        <div className="space-y-1">
                                            <span className="font-bold text-text-primary group-hover:text-accent-primary transition-colors">{appr.name} ({appr.timeComplexity})</span>
                                            <p className="text-text-secondary text-[11px] leading-relaxed">{appr.hint}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-text-muted shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Left Panel: Problem Description */}
            <div className="w-full md:w-[35%] border-r border-border-subtle bg-[#111118] flex flex-col overflow-y-auto p-6 space-y-6 relative shrink-0">
                <div className={`space-y-6 flex-grow transition-all duration-300 ${blindMode && !peeking ? 'blur-lg select-none pointer-events-none' : 'blur-none'}`}>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                problem.difficulty === 'Easy' ? 'bg-accent-secondary/10 border-accent-secondary/20 text-accent-secondary' :
                                problem.difficulty === 'Medium' ? 'bg-accent-gold/10 border-accent-gold/20 text-accent-gold' :
                                'bg-accent-danger/10 border-accent-danger/20 text-accent-danger'
                            }`}>{problem.difficulty}</span>
                            <span className="text-[10px] font-bold text-text-secondary font-mono bg-background-elevated px-2 py-0.5 rounded border border-border-subtle">{problem.category}</span>
                        </div>
                        <h2 className="text-lg font-display font-extrabold text-text-primary">{problem.title}</h2>
                    </div>
                    <div className="text-xs text-text-secondary leading-relaxed space-y-4 font-sans whitespace-pre-wrap">{problem.description}</div>
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest">Examples</h4>
                        {problem.examples?.map((ex, idx) => (
                            <div key={idx} className="bg-background-elevated border border-border-subtle p-3 rounded-card text-xs space-y-1.5 font-mono">
                                <div className="font-semibold text-text-secondary">Example {idx + 1}:</div>
                                <div><span className="text-text-muted">Input:</span> <span className="text-text-primary">{ex.input}</span></div>
                                <div><span className="text-text-muted">Output:</span> <span className="text-text-primary">{ex.output}</span></div>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2 border-t border-border-subtle pt-4">
                        <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest">Constraints</h4>
                        <ul className="list-disc pl-4 text-xs text-text-secondary space-y-1 font-mono">
                            {problem.constraints?.map((c, i) => (
                                <li key={i} dangerouslySetInnerHTML={{ __html: c }} />
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Blind Mode Overlay */}
                {blindMode && !peeking && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center bg-[#111118]/70">
                        <div className="bg-[#141720] border border-border-subtle p-6 rounded-card max-w-xs space-y-4 shadow-2xl">
                            <EyeOff className="w-8 h-8 text-accent-gold mx-auto animate-pulse" />
                            <div>
                                <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest">Blind Mode Active</h4>
                                <p className="text-[10px] text-text-secondary leading-normal mt-1">
                                    Problem content blurred to build interview recall. Peek briefly if needed (penalizes score).
                                </p>
                            </div>
                            <button
                                onClick={triggerPeek}
                                className="w-full bg-accent-gold/10 hover:bg-accent-gold/20 border border-accent-gold/30 text-accent-gold text-xs font-semibold py-2 rounded-btn transition-all"
                            >
                                Peek (5 Seconds)
                            </button>
                            <span className="text-[9px] text-text-muted block font-mono">Peeks used: {peeksUsed}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Panel: Code Editor + Console */}
            <div className="flex-grow flex flex-col bg-background-primary relative min-w-0">

                {/* Editor Toolbar */}
                <div className="flex justify-between items-center bg-background-surface border-b border-border-subtle px-4 py-2 select-none shrink-0">
                    <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-accent-primary" />
                        <select
                            className="bg-[#1A1E29] border border-border-subtle rounded px-2.5 py-1 text-xs focus:outline-none text-text-primary font-semibold"
                            value={activeLang}
                            onChange={(e) => setActiveLang(e.target.value)}
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                        {blindTimerActive && secondsLeft > 0 && (
                            <span className="text-[10px] font-mono text-text-secondary bg-[#1a1a26] border border-border-subtle px-2 py-0.5 rounded">
                                Blind In: {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
                            </span>
                        )}
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={blindMode}
                                onChange={(e) => {
                                    setBlindMode(e.target.checked);
                                }}
                            />
                            <div className="w-7 h-4 bg-background-elevated rounded-full peer peer-checked:after:translate-x-full relative after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-text-secondary after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-accent-gold"></div>
                            <span className={blindMode ? 'text-accent-gold font-bold text-[10px]' : 'text-text-secondary text-[10px]'}>Blind Mode</span>
                        </label>
                    </div>
                </div>

                {/* Monaco Editor */}
                <div className="flex-grow relative border-b border-border-subtle">
                    <Editor
                        height="100%"
                        theme="vs-dark"
                        language={activeLang === 'python' ? 'python' : activeLang === 'java' ? 'java' : 'javascript'}
                        value={code}
                        onChange={(val) => setCode(val)}
                        options={{
                            fontSize: 13,
                            fontFamily: 'JetBrains Mono',
                            minimap: { enabled: false },
                            automaticLayout: true,
                            padding: { top: 12 }
                        }}
                    />
                </div>

                {/* Execution Console */}
                <div className="h-44 bg-background-surface border-t border-border-subtle flex flex-col shrink-0">
                    <div className="flex justify-between items-center bg-background-elevated border-b border-border-subtle px-4 py-1.5 select-none">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-text-secondary">Execution Console</span>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-accent-secondary text-background-primary hover:bg-accent-secondary/95 text-xs font-bold px-4 py-1 rounded-btn flex items-center gap-1.5 transition-all transform active:scale-95 disabled:opacity-50"
                        >
                            {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Submit & Run Autopsy
                        </button>
                    </div>
                    <div className="flex-grow p-4 overflow-y-auto font-mono text-[11px] select-text">
                        {consoleOutput ? (
                            <div className="space-y-1.5">
                                {consoleOutput.status === 'compiling' && (
                                    <div className="flex items-center gap-2 text-accent-gold">
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>{consoleOutput.text}</span>
                                    </div>
                                )}
                                {consoleOutput.status === 'success' && (
                                    <div className="text-accent-secondary font-bold flex items-center gap-1.5">
                                        <CheckCircle className="w-4 h-4" /> Solution compiled successfully! Passed {consoleOutput.passedCount}/{consoleOutput.totalCount} test cases.
                                    </div>
                                )}
                                {consoleOutput.status === 'fail' && (
                                    <div className="space-y-1.5">
                                        <div className="text-accent-danger font-bold flex items-center gap-1.5">
                                            <AlertTriangle className="w-4 h-4" /> Validation check failed. Passed {consoleOutput.passedCount}/{consoleOutput.totalCount} tests.
                                        </div>
                                        {consoleOutput.error && (
                                            <pre className="p-2.5 bg-accent-danger/5 border border-accent-danger/25 text-accent-danger rounded font-mono text-[10px] whitespace-pre-wrap">{consoleOutput.error}</pre>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="text-text-muted italic flex items-center gap-1">
                                <TermIcon className="w-3.5 h-3.5" /> Output console empty. Click submit to execute.
                            </span>
                        )}
                    </div>
                </div>

                {/* AI Code Autopsy Slide-up */}
                {showAutopsy && (
                    <div className="absolute bottom-0 left-0 right-0 bg-[#141720] border-t border-border-subtle z-50 p-6 shadow-2xl flex flex-col space-y-4 transition-all duration-300">
                        <div className="flex justify-between items-center border-b border-border-subtle pb-2 select-none">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-accent-primary animate-pulse" /> AI Code Autopsy (5-Point Report)
                            </h3>
                            <button onClick={() => setShowAutopsy(false)} className="text-text-secondary hover:text-text-primary text-xs font-bold">Dismiss</button>
                        </div>
                        {autopsyLoading ? (
                            <div className="flex flex-col items-center justify-center py-6 gap-2 select-none">
                                <RefreshCw className="w-6 h-6 text-accent-primary animate-spin" />
                                <span className="text-xs text-text-secondary font-mono">Conducting algorithmic post-mortem...</span>
                            </div>
                        ) : autopsyData ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-xs text-left">
                                {[
                                    { label: '1. Killed By', color: 'text-accent-danger', value: autopsyData.killedBy },
                                    { label: '2. Better Direction', color: 'text-accent-primary', value: autopsyData.direction },
                                    { label: '3. Complexity', color: 'text-accent-secondary', value: autopsyData.complexity },
                                    { label: '4. Interview Risk', color: 'text-accent-gold', value: autopsyData.interviewRisk },
                                ].map((item, i) => (
                                    <div key={i} className="p-3 bg-[#1A1E29] border border-border-subtle rounded-card space-y-1">
                                        <span className={`text-[8px] font-bold uppercase tracking-wider ${item.color}`}>{item.label}</span>
                                        <p className="text-text-primary font-medium leading-relaxed">{item.value}</p>
                                    </div>
                                ))}
                                <div className="p-3 bg-[#1A1E29] border border-border-subtle rounded-card space-y-1">
                                    <span className="text-[8px] font-bold text-accent-primary uppercase tracking-wider">5. Edge Cases</span>
                                    <ul className="list-disc pl-3 text-[11px] text-text-primary space-y-0.5">
                                        {autopsyData.edgeCases?.map((ec, i) => <li key={i}>{ec}</li>)}
                                    </ul>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}

                {/* Post-Solve Interview Follow-up */}
                {showInterviewFollowUp && (
                    <div className="fixed inset-0 bg-[#0A0A0F]/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                        <div className="max-w-2xl w-full bg-[#141720] border border-border-subtle p-6 rounded-card shadow-2xl space-y-4">
                            <div className="flex justify-between items-center border-b border-border-subtle pb-3">
                                <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5 uppercase font-mono">
                                    <Brain className="w-4 h-4 text-accent-primary animate-pulse" /> Interview Follow-Up Questions
                                </h3>
                                <button onClick={() => setShowInterviewFollowUp(false)} className="text-text-secondary hover:text-text-primary text-xs font-bold">Dismiss</button>
                            </div>
                            {recallScore && (
                                <div className="p-3 bg-accent-gold/10 border border-accent-gold/25 rounded text-xs text-accent-gold font-mono flex justify-between items-center">
                                    <span>Recall Efficiency Score:</span>
                                    <span className="text-lg font-bold">{recallScore}/100</span>
                                </div>
                            )}
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                                {followUpQuestions.map((q, idx) => (
                                    <div key={idx} className="space-y-2 text-left">
                                        <label className="block text-xs font-bold text-text-primary">{idx + 1}. {q}</label>
                                        <textarea
                                            rows={2}
                                            className="w-full bg-background-elevated border border-border-subtle rounded-input p-3 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                                            placeholder="Write your optimization or scaling trade-offs here..."
                                            value={followUpAnswers[idx]}
                                            onChange={(e) => {
                                                const newAnswers = [...followUpAnswers];
                                                newAnswers[idx] = e.target.value;
                                                setFollowUpAnswers(newAnswers);
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleSubmitFollowUps}
                                disabled={submittingFollowUps}
                                className="w-full bg-accent-primary hover:bg-accent-primary/95 text-white py-2.5 rounded-btn text-xs font-bold flex justify-center items-center gap-1.5 transition-all"
                            >
                                {submittingFollowUps ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Submit Interview Answers"}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
