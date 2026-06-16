import React, { useState, useEffect } from 'react';
import { ChevronRight, Star, Brain, RefreshCw } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { MarkdownRenderer } from '../AIMentor';

export default function CompanyTracks({ 
  problems: propProblems, 
  enterArena: propEnterArena, 
  selectedCompany: propSelectedCompany, 
  setSelectedCompany: propSetSelectedCompany 
}) {
    const { getAuthHeaders, setActiveTab } = useUser();
    const [companies, setCompanies] = useState([]);
    const [localProblems, setLocalProblems] = useState([]);
    const [localCompany, setLocalCompany] = useState('Google');
    const [companyMeta, setCompanyMeta] = useState(null);
    const [companyGuide, setCompanyGuide] = useState('');
    const [loadingGuide, setLoadingGuide] = useState(false);
    const [loadingData, setLoadingData] = useState(false);

    const selectedCompany = propSelectedCompany || localCompany;
    const setSelectedCompany = propSetSelectedCompany || setLocalCompany;

    // Fetch available companies list from backend
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await fetch('/api/company-tracks', { headers: getAuthHeaders() });
                if (res.ok) {
                    const data = await res.json();
                    setCompanies(data);
                    if (data.length > 0 && !propSelectedCompany) {
                        setSelectedCompany(data[0].name);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch companies:", err);
            }
        };
        fetchCompanies();
    }, []);

    // Fetch metadata, questions, and guide when active company changes
    useEffect(() => {
        if (!selectedCompany) return;
        
        const fetchCompanyData = async () => {
            setLoadingData(true);
            try {
                // Fetch Analytics (contains topic distributions and difficulty ratios)
                const analyticsRes = await fetch(`/api/company-tracks/${encodeURIComponent(selectedCompany)}/analytics`, { headers: getAuthHeaders() });
                if (analyticsRes.ok) {
                    const analyticsData = await analyticsRes.json();
                    setCompanyMeta(analyticsData);
                }

                // Fetch Questions
                const questionsRes = await fetch(`/api/company-tracks/${encodeURIComponent(selectedCompany)}/questions`, { headers: getAuthHeaders() });
                if (questionsRes.ok) {
                    const questionsData = await questionsRes.json();
                    setLocalProblems(questionsData);
                }
            } catch (err) {
                console.error("Failed to fetch company data:", err);
            } finally {
                setLoadingData(false);
            }
        };

        const fetchCompanyGuide = async () => {
            setLoadingGuide(true);
            try {
                const guideRes = await fetch(`/api/company-tracks/${encodeURIComponent(selectedCompany)}/ai-guide`, { headers: getAuthHeaders() });
                if (guideRes.ok) {
                    const data = await guideRes.json();
                    setCompanyGuide(data.guide);
                }
            } catch (err) {
                console.error("Failed to fetch company guide:", err);
            } finally {
                setLoadingGuide(false);
            }
        };

        fetchCompanyData();
        fetchCompanyGuide();
    }, [selectedCompany]);

    const problems = propProblems || localProblems;

    const handleEnterArena = (prob) => {
        const targetProb = {
            id: prob.id,
            title: prob.title,
            difficulty: prob.difficulty,
            category: prob.topic || prob.category,
            description: prob.description || `Analyze and solve the ${prob.title} pattern.`,
            examples: prob.examples || [],
            constraints: prob.constraints || [],
            starterCode: prob.starterCode || {
                javascript: `function ${prob.title.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase()).replace(/[^a-zA-Z0-9]/g, '')}() {\n  // Write your code here\n}`,
                python: `class Solution:\n    def ${prob.title.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase()).replace(/[^a-zA-Z0-9]/g, '')}(self):\n        pass`
            }
        };

        if (propEnterArena) {
            propEnterArena(targetProb);
        } else {
            sessionStorage.setItem('arena_problem_override', JSON.stringify(targetProb));
            setActiveTab('CodingArena');
        }
    };

    return (
        <div className="flex-grow overflow-y-auto p-4 md:p-8 space-y-8 max-w-5xl mx-auto w-full pb-24">
            <div className="border-b border-border-subtle pb-4">
                <h1 className="text-xl font-display font-bold text-text-primary">Company-Specific Placement Tracks</h1>
                <p className="text-xs text-text-secondary mt-1">Review difficulty distributions, targeted topic indices, and real past coding assessment prompts.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">

                {/* Dynamic Company Selector Sidebar */}
                <div className="md:col-span-1 bg-background-surface border border-border-subtle rounded-card p-3 space-y-1 max-h-[600px] overflow-y-auto shadow-sm">
                    {companies.map(comp => (
                        <button
                            key={comp.name}
                            onClick={() => setSelectedCompany(comp.name)}
                            className={`w-full text-left px-3 py-2 rounded-btn text-[11px] font-semibold flex items-center justify-between transition-all ${selectedCompany === comp.name
                                ? 'bg-accent-primary/10 border border-accent-primary/20 text-accent-primary'
                                : 'text-text-secondary hover:text-text-primary hover:bg-background-elevated'
                            }`}
                        >
                            <span>{comp.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                        </button>
                    ))}
                    {companies.length === 0 && (
                        <div className="text-center text-[10px] text-text-muted italic py-4">Loading tracks...</div>
                    )}
                </div>

                {/* Company Detail Panel */}
                <div className="md:col-span-3 bg-background-surface border border-border-subtle rounded-card p-6 space-y-6 shadow-md">
                    <div className="flex justify-between items-center border-b border-border-subtle pb-3">
                        <h2 className="text-base font-bold text-text-primary flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-accent-gold" /> {selectedCompany} Prep Vectors
                        </h2>
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">Premium Track</span>
                    </div>

                    {loadingData ? (
                        <div className="flex justify-center items-center py-12 text-xs text-text-muted gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-accent-primary" />
                            <span>Loading metrics database...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Topic Distribution */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest">Topic Distribution</h4>
                                <div className="space-y-2 font-mono text-[10px]">
                                    {companyMeta?.topicDistribution && companyMeta.topicDistribution.length > 0 ? (
                                        companyMeta.topicDistribution.map((item, idx) => {
                                            const percentage = companyMeta.totalQuestions > 0 
                                                ? Math.round((item.total / companyMeta.totalQuestions) * 100)
                                                : 0;
                                            return (
                                                <div key={idx} className="space-y-1">
                                                    <div className="flex justify-between text-text-secondary">
                                                        <span>{item.topic}</span>
                                                        <span>{percentage}% ({item.solved}/{item.total} solved)</span>
                                                    </div>
                                                    <div className="w-full bg-[#1A1E29] h-1.5 rounded-full overflow-hidden">
                                                        <div className="bg-accent-primary h-full" style={{ width: `${percentage}%` }}></div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-text-muted italic">No topic logs registered.</div>
                                    )}
                                </div>
                            </div>

                            {/* Assessment Ratios */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest">Assessment Ratios</h4>
                                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                                    <div className="p-3 bg-background-elevated rounded border border-border-subtle">
                                        <span className="text-accent-secondary font-bold">EASY</span>
                                        <div className="text-base font-bold text-text-primary mt-1">
                                            {companyMeta?.difficultyRatio?.easy || 0}%
                                        </div>
                                    </div>
                                    <div className="p-3 bg-background-elevated rounded border border-border-subtle">
                                        <span className="text-accent-gold font-bold">MEDIUM</span>
                                        <div className="text-base font-bold text-text-primary mt-1">
                                            {companyMeta?.difficultyRatio?.medium || 0}%
                                        </div>
                                    </div>
                                    <div className="p-3 bg-background-elevated rounded border border-border-subtle">
                                        <span className="text-accent-danger font-bold">HARD</span>
                                        <div className="text-base font-bold text-text-primary mt-1">
                                            {companyMeta?.difficultyRatio?.hard || 0}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recruiter Prep Guide */}
                    <div className="space-y-4 pt-3 border-t border-border-subtle">
                        <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest flex items-center gap-1.5">
                            <Brain className="w-4 h-4 text-accent-primary animate-pulse" /> Recruiter Prep Guide
                        </h4>
                        <div className="p-4 bg-background-elevated/35 border border-border-subtle rounded-card max-h-[350px] overflow-y-auto">
                            {loadingGuide ? (
                                <div className="flex items-center gap-2 text-xs text-text-muted py-6 justify-center">
                                    <RefreshCw className="w-4 h-4 animate-spin text-accent-primary" />
                                    <span>Syncing recruiter intelligence from Gemini...</span>
                                </div>
                            ) : (
                                <MarkdownRenderer content={companyGuide} />
                            )}
                        </div>
                    </div>

                    {/* Top Placement Questions */}
                    <div className="space-y-4 pt-3 border-t border-border-subtle">
                        <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest">Top Placement Questions</h4>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {problems.length > 0 ? (
                                problems.map((p) => (
                                    <div
                                        key={p.id}
                                        onClick={() => handleEnterArena(p)}
                                        className="p-3 bg-background-elevated hover:bg-[#1A1E29] border border-border-subtle hover:border-accent-primary/20 rounded-card transition-all flex justify-between items-center cursor-pointer group"
                                    >
                                        <div className="text-xs">
                                            <span className="font-semibold text-text-primary group-hover:text-accent-primary transition-colors">{p.title}</span>
                                            <span className="text-[10px] text-text-secondary font-mono block mt-0.5">{p.topic || p.category} • {p.difficulty}</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-text-muted group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-[11px] text-text-muted italic py-6">No assessment prompts listed yet.</div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
