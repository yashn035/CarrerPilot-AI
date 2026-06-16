import React from 'react';
import { Brain, ChevronRight, RefreshCw } from 'lucide-react';

export default function ArenaLobby({ problems, dailyPrescription, dnaHistory, dnaFilter, setDnaFilter, enterArena, loadingLobby }) {

    const getFilteredDnaHistory = () => {
        if (dnaFilter === 'All') return dnaHistory;
        return dnaHistory.filter(h => {
            const prob = problems.find(p => p.id === h.problemId);
            return prob?.category === dnaFilter;
        });
    };

    if (loadingLobby) {
        return (
            <div className="flex-grow flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 text-accent-primary animate-spin" />
                    <span className="text-xs text-text-secondary font-mono">Loading Arena Lobby...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-grow overflow-y-auto p-4 md:p-8 space-y-8 max-w-6xl mx-auto w-full pb-24">

            {/* Daily Problem Hero */}
            {dailyPrescription?.problem && (
                <div className="glow-card p-6 md:p-8 space-y-4 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="space-y-3.5 max-w-2xl">
                        <span className="text-[9px] font-bold text-accent-gold uppercase tracking-widest bg-accent-gold/10 border border-accent-gold/20 px-2.5 py-1 rounded w-fit block">
                            Today's AI Prescription
                        </span>
                        <h2 className="text-xl md:text-2xl font-display font-extrabold text-text-primary mt-2">
                            {dailyPrescription.problem.title ?? 'Untitled Problem'}
                        </h2>
                        <div className="flex gap-4 text-xs font-mono text-text-secondary">
                            <span className={
                                dailyPrescription.problem.difficulty === 'Easy' ? 'text-accent-secondary' :
                                dailyPrescription.problem.difficulty === 'Medium' ? 'text-accent-gold' : 'text-accent-danger'
                            }>
                                {dailyPrescription.problem.difficulty ?? 'Unknown'}
                            </span>
                            <span>Topic: {dailyPrescription.problem.category ?? 'General'}</span>
                        </div>
                        <div className="p-4 bg-background-elevated border border-accent-primary/20 rounded-card flex gap-3 text-xs text-text-secondary leading-relaxed italic">
                            <Brain className="w-5 h-5 text-accent-primary shrink-0 mt-0.5" />
                            <div className="not-italic">
                                <span className="font-bold text-text-primary block uppercase text-[10px] tracking-wider mb-1">Prescription Justification</span>
                                "{dailyPrescription.reason ?? 'Personalised for your weak areas.'}"
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0 md:w-48">
                        <button
                            onClick={() => enterArena(dailyPrescription.problem)}
                            className="w-full bg-accent-primary hover:bg-accent-primary/95 text-white font-bold text-xs py-3 rounded-btn flex items-center justify-center gap-1.5 transform active:scale-95 transition-all shadow-lg shadow-accent-primary/20"
                        >
                            Solve Challenge <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* DNA Waveform Timeline */}
            <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border-subtle pb-4">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">Execution DNA Timeline</h3>
                        <p className="text-[11px] text-text-secondary mt-0.5">Filter your solve sequences by specific data structures or algorithmic patterns.</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {['All', 'Arrays', 'Strings', 'Trees', 'Graphs', 'DP'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setDnaFilter(cat)}
                                className={`text-[9px] font-bold px-3 py-1 rounded transition-all border ${dnaFilter === cat
                                    ? 'bg-accent-primary border-accent-primary text-white shadow-lg shadow-accent-primary/15'
                                    : 'bg-background-elevated border-border-subtle text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="border border-border-subtle rounded-card p-6 bg-[#0E0F14] relative overflow-hidden">
                    <div className="flex items-end justify-start gap-2 h-36 overflow-x-auto pb-2 min-w-full">
                        {getFilteredDnaHistory().map((sub, idx) => {
                            const score = sub.runtimePct || 50;
                            return (
                                <div key={sub.id || idx} className="flex flex-col items-center gap-1.5 group cursor-pointer shrink-0">
                                    <div className="text-[9px] font-mono text-text-muted font-bold opacity-0 group-hover:opacity-100 transition-opacity">{score}%</div>
                                    <div className="w-4 bg-[#1A1E29] hover:bg-[#202737] rounded-t-sm relative flex flex-col justify-end overflow-hidden h-24 transition-all">
                                        <div
                                            className={`w-full transition-all duration-300 ${score >= 80 ? 'bg-accent-secondary' : score >= 50 ? 'bg-accent-primary' : 'bg-text-muted'}`}
                                            style={{ height: `${score}%` }}
                                        />
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${sub.blindMode ? 'bg-accent-gold shadow-glow animate-pulse' : 'bg-transparent'}`} />
                                </div>
                            );
                        })}
                        {getFilteredDnaHistory().length === 0 && (
                            <div className="flex-grow flex items-center justify-center text-xs text-text-muted italic h-full">
                                No solutions logged under filter '{dnaFilter}'. Solve coding problems to compile DNA waveforms.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Problem Bank */}
            <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">Problem Bank Workspace</h3>
                <div className="divide-y divide-border-subtle">
                    {problems.map(p => (
                        <div key={p.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-text-primary hover:text-accent-primary transition-colors cursor-pointer">{p.title}</span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                        p.difficulty === 'Easy' ? 'bg-accent-secondary/10 border-accent-secondary/20 text-accent-secondary' :
                                        p.difficulty === 'Medium' ? 'bg-accent-gold/10 border-accent-gold/20 text-accent-gold' :
                                        'bg-accent-danger/10 border-accent-danger/20 text-accent-danger'
                                    }`}>{p.difficulty}</span>
                                </div>
                                <p className="text-[11px] text-text-secondary line-clamp-1">{p.description}</p>
                                <div className="flex gap-2.5 text-[9px] text-text-muted uppercase tracking-wider font-mono">
                                    <span>Topic: {p.category}</span>
                                    {p.tags?.map((t, i) => <span key={i}>• {t}</span>)}
                                </div>
                            </div>
                            <button
                                onClick={() => enterArena(p)}
                                className="bg-background-elevated hover:bg-accent-primary/10 border border-border-subtle hover:border-accent-primary/20 text-text-primary hover:text-accent-primary text-[10px] font-bold px-4 py-2 rounded transition-all shrink-0 self-start sm:self-auto"
                            >
                                Solve Problem
                            </button>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
