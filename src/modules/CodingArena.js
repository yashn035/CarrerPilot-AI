import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { Shield } from 'lucide-react';
import confetti from 'canvas-confetti';

import ArenaLobby       from './arena/ArenaLobby';
import ArenaWorkspace   from './arena/ArenaWorkspace';
import CompanyTracks    from './arena/CompanyTracks';
import MockOASimulator  from './arena/MockOASimulator';

import { mockProblemBank, mockApproachesList } from '../data/codingMockData';

export default function CodingArena() {
    const { getAuthHeaders, addToast, fetchProfile } = useUser();
    const [activeTab, setActiveTab] = useState('Lobby');

    // ── Lobby & DNA ──────────────────────────────────────────────
    const [problems, setProblems]                   = useState([]);
    const [dailyPrescription, setDailyPrescription] = useState(null);
    const [loadingLobby, setLoadingLobby]           = useState(true);
    const [dnaHistory, setDnaHistory]               = useState([]);
    const [dnaFilter, setDnaFilter]                 = useState('All');

    // ── Arena Workspace ──────────────────────────────────────────
    const [problem, setProblem]                     = useState(null);
    const [code, setCode]                           = useState('');
    const [activeLang, setActiveLang]               = useState('javascript');
    const [timeSpent, setTimeSpent]                 = useState(0);
    const [timeSpentTimerActive, setTimeSpentTimerActive] = useState(false);

    // ── Blind Mode ───────────────────────────────────────────────
    const [blindMode, setBlindMode]                 = useState(false);
    const [peeking, setPeeking]                     = useState(false);
    const [peeksUsed, setPeeksUsed]                 = useState(0);
    const [blindTimerActive, setBlindTimerActive]   = useState(false);
    const [secondsLeft, setSecondsLeft]             = useState(120);
    const [recallScore, setRecallScore]             = useState(null);

    // ── Approach Voting ──────────────────────────────────────────
    const [approaches, setApproaches]               = useState([]);
    const [loadingApproaches, setLoadingApproaches] = useState(false);
    const [votedApproach, setVotedApproach]         = useState(null);

    // ── Submit / Autopsy ─────────────────────────────────────────
    const [submitting, setSubmitting]               = useState(false);
    const [consoleOutput, setConsoleOutput]         = useState(null);
    const [showAutopsy, setShowAutopsy]             = useState(false);
    const [autopsyData, setAutopsyData]             = useState(null);
    const [autopsyLoading, setAutopsyLoading]       = useState(false);

    // ── Interview Follow-up ───────────────────────────────────────
    const [showInterviewFollowUp, setShowInterviewFollowUp] = useState(false);
    const [followUpQuestions, setFollowUpQuestions] = useState([]);
    const [followUpAnswers, setFollowUpAnswers]     = useState(['', '', '']);
    const [submittingFollowUps, setSubmittingFollowUps] = useState(false);
    const [activeSubmissionId, setActiveSubmissionId]   = useState(null);

    // ── Company Tracks ────────────────────────────────────────────
    const [selectedCompany, setSelectedCompany]     = useState('Google');

    // ── Mock OA Simulator ─────────────────────────────────────────
    const [oaSession, setOaSession]                 = useState(null);
    const [oaActive, setOaActive]                   = useState(false);
    const [oaTimeLeft, setOaTimeLeft]               = useState(3600);
    const [oaActiveIdx, setOaActiveIdx]             = useState(0);
    const [oaAnswers, setOaAnswers]                 = useState({});
    const [oaFocusLost, setOaFocusLost]             = useState(false);
    const [oaLoading, setOaLoading]                 = useState(false);
    const [oaReport, setOaReport]                   = useState(null);
    const [oaLang, setOaLang]                       = useState('javascript');
    const [oaConsoleOutputs, setOaConsoleOutputs]   = useState({});

    // ─────────────────────────────────────────────────────────────
    // DATA FETCHING
    // ─────────────────────────────────────────────────────────────

    const fetchLobbyData = async () => {
        setLoadingLobby(true);
        try {
            const probRes = await fetch('/api/coding/problems', { headers: getAuthHeaders() });
            setProblems(probRes.ok ? await probRes.json() : mockProblemBank);

            const dailyRes = await fetch('/api/coding/daily', { headers: getAuthHeaders() });
            if (dailyRes.ok) setDailyPrescription(await dailyRes.json());

            const historyRes = await fetch('/api/coding/history', { headers: getAuthHeaders() });
            if (historyRes.ok) setDnaHistory(await historyRes.json());
        } catch {
            setProblems(mockProblemBank);
        } finally {
            setLoadingLobby(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'Lobby') fetchLobbyData();
    }, [activeTab]);

    // Update starter code dynamically when language changes
    useEffect(() => {
        if (problem) {
            setCode(problem.starterCode?.[activeLang] || '// Write your solution here\n');
        }
    }, [activeLang]);

    // Handle Dashboard → Arena problem override
    useEffect(() => {
        const override = sessionStorage.getItem('arena_problem_override');
        if (override) {
            try {
                const prob = JSON.parse(override);
                sessionStorage.removeItem('arena_problem_override');
                enterArena(prob);
            } catch (e) {
                console.error('Failed to parse problem override:', e);
            }
        }
    }, []);

    // ─────────────────────────────────────────────────────────────
    // ARENA ACTIONS
    // ─────────────────────────────────────────────────────────────

    const enterArena = async (selectedProblem) => {
        if (!selectedProblem?.id) return;
        let fullProblem = selectedProblem;
        if (!selectedProblem.starterCode) {
            try {
                const res = await fetch(`/api/coding/problems/${selectedProblem.id}`, { headers: getAuthHeaders() });
                if (res.ok) fullProblem = await res.json();
            } catch (err) {
                console.error('[enterArena] Failed to fetch full problem:', err);
            }
        }
        setProblem(fullProblem);
        setCode(fullProblem.starterCode?.[activeLang] || '// Write your solution here\n');
        setVotedApproach(null); setBlindMode(false); setPeeksUsed(0);
        setAutopsyData(null); setShowAutopsy(false); setConsoleOutput(null);
        setSecondsLeft(120); setBlindTimerActive(true);
        setTimeSpent(0); setTimeSpentTimerActive(true); setRecallScore(null);
        setShowInterviewFollowUp(false); setFollowUpQuestions([]); setFollowUpAnswers(['', '', '']);
        setActiveTab('Arena');

        setLoadingApproaches(true);
        try {
            const res = await fetch(`/api/coding/problems/${fullProblem.id}/approaches`, { headers: getAuthHeaders() });
            setApproaches(res.ok ? await res.json() : (mockApproachesList[fullProblem.id] || mockApproachesList['default']));
        } catch {
            setApproaches(mockApproachesList[fullProblem.id] || mockApproachesList['default']);
        } finally {
            setLoadingApproaches(false);
        }
    };

    const triggerPeek = () => {
        setPeeking(true);
        setPeeksUsed(p => p + 1);
        setTimeout(() => setPeeking(false), 5000);
    };

    // ─────────────────────────────────────────────────────────────
    // TIMERS
    // ─────────────────────────────────────────────────────────────

    // Blind Mode countdown
    useEffect(() => {
        let interval;
        if (activeTab === 'Arena' && blindTimerActive && secondsLeft > 0) {
            interval = setInterval(() => setSecondsLeft(p => p - 1), 1000);
        } else if (secondsLeft === 0 && blindTimerActive) {
            setBlindMode(true); setBlindTimerActive(false);
            addToast('Time is up! Problem description blurred for recall.', 'info');
        }
        return () => clearInterval(interval);
    }, [activeTab, blindTimerActive, secondsLeft]);

    // Overall time-spent counter
    useEffect(() => {
        let timer;
        if (activeTab === 'Arena' && timeSpentTimerActive) {
            timer = setInterval(() => setTimeSpent(p => p + 1), 1000);
        }
        return () => clearInterval(timer);
    }, [activeTab, timeSpentTimerActive]);

    // OA Countdown
    useEffect(() => {
        let timer;
        if (oaActive && oaTimeLeft > 0) {
            timer = setInterval(() => setOaTimeLeft(p => p - 1), 1000);
        } else if (oaTimeLeft === 0 && oaActive) {
            handleEndOa();
        }
        return () => clearInterval(timer);
    }, [oaActive, oaTimeLeft]);

    // OA Anti-cheat blur detection
    useEffect(() => {
        const handleBlur = () => {
            if (oaActive) {
                setOaFocusLost(true);
                addToast('Cheating Alert! OA environment requires absolute focus.', 'error');
            }
        };
        window.addEventListener('blur', handleBlur);
        return () => window.removeEventListener('blur', handleBlur);
    }, [oaActive]);

    // ─────────────────────────────────────────────────────────────
    // SUBMIT HANDLERS
    // ─────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!problem || !votedApproach) return;
        setSubmitting(true); setShowAutopsy(false);
        setConsoleOutput({ status: 'compiling', text: 'Executing sandbox testcases on secure Piston runner...' });
        try {
            const res = await fetch('/api/coding/submit', {
                method: 'POST', headers: getAuthHeaders(),
                body: JSON.stringify({ problemId: problem.id, code, language: activeLang, chosenApproach: votedApproach.name, blindMode, peeksUsed, timeSpentSeconds: timeSpent })
            });
            if (res.ok) {
                const data = await res.json();
                setConsoleOutput({ status: data.runResult.success ? 'success' : 'fail', passedCount: data.runResult.passedCount, totalCount: data.runResult.totalCount, error: data.runResult.error });
                setAutopsyLoading(true); setShowAutopsy(true); setAutopsyData(null);
                setTimeout(() => {
                    setAutopsyData(data.autopsy); setAutopsyLoading(false);
                    if (data.runResult.success) {
                        confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
                        addToast(`Successfully solved! +${data.xpAwarded} XP`, 'gold');
                        setRecallScore(data.recallScore); setTimeSpentTimerActive(false);
                        setFollowUpQuestions(data.followUpQuestions || []);
                        setActiveSubmissionId(data.submissionId); setShowInterviewFollowUp(true);
                        fetchProfile();
                    }
                }, 2200);
            }
        } catch {
            setConsoleOutput({ status: 'error', text: 'Compilation execution failed.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitFollowUps = async () => {
        if (!activeSubmissionId) return;
        setSubmittingFollowUps(true);
        try {
            const res = await fetch(`/api/coding/submissions/${activeSubmissionId}/followups`, {
                method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ answers: followUpAnswers })
            });
            if (res.ok) { addToast('Interview answers logged! +15 XP', 'gold'); setShowInterviewFollowUp(false); fetchProfile(); }
        } catch (err) { console.error(err); } finally { setSubmittingFollowUps(false); }
    };

    // ─────────────────────────────────────────────────────────────
    // OA HANDLERS
    // ─────────────────────────────────────────────────────────────

     const handleStartOa = async () => {
        setOaLoading(true); setOaReport(null);
        setOaConsoleOutputs({});
        try {
            const res = await fetch('/api/oa/start', { method: 'POST', headers: getAuthHeaders() });
            if (res.ok) {
                const session = await res.json();
                setOaSession(session);
                const initial = {};
                session.problems.forEach(p => { initial[p.id] = p.starterCode[oaLang] || ''; });
                setOaAnswers(initial); setOaActiveIdx(0); setOaTimeLeft(3600);
                setOaFocusLost(false); setOaActive(true);
                addToast('Online Assessment Started! 60 minutes remaining.', 'info');
            }
        } catch (err) { console.error(err); } finally { setOaLoading(false); }
    };

    const handleOaCodeSubmit = async () => {
        if (!oaSession) return;
        const activeProblem = oaSession.problems[oaActiveIdx];
        
        setOaConsoleOutputs(prev => ({
            ...prev,
            [activeProblem.id]: { status: 'compiling' }
        }));
        
        addToast('Running verification tests...', 'info');
        try {
            const res = await fetch('/api/oa/submit', {
                method: 'POST', headers: getAuthHeaders(),
                body: JSON.stringify({ sessionId: oaSession.id, problemId: activeProblem.id, code: oaAnswers[activeProblem.id], language: oaLang })
            });
            if (res.ok) {
                const data = await res.json();
                setOaConsoleOutputs(prev => ({
                    ...prev,
                    [activeProblem.id]: {
                        status: data.runResult.success ? 'success' : 'fail',
                        passedCount: data.runResult.passedCount,
                        totalCount: data.runResult.totalCount,
                        error: data.runResult.error
                    }
                }));
                
                if (data.runResult.success) {
                    addToast(`Success! Passed all tests.`, 'success');
                } else {
                    addToast(`Verification failed: Passed ${data.runResult.passedCount}/${data.runResult.totalCount} tests.`, 'error');
                }
            } else {
                setOaConsoleOutputs(prev => ({
                    ...prev,
                    [activeProblem.id]: { status: 'fail', passedCount: 0, totalCount: 1, error: 'Server validation request failed.' }
                }));
                addToast('Submission failed.', 'error');
            }
        } catch (err) { 
            console.error(err); 
            setOaConsoleOutputs(prev => ({
                ...prev,
                [activeProblem.id]: { status: 'fail', passedCount: 0, totalCount: 1, error: 'Network error: ' + err.message }
            }));
            addToast('Network error during verification.', 'error');
        }
    };

    const handleEndOa = async () => {
        if (!oaSession) return;
        setOaActive(false); setOaFocusLost(false); setOaLoading(true);
        try {
            const res = await fetch('/api/oa/end', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ sessionId: oaSession.id }) });
            if (res.ok) {
                const data = await res.json();
                setOaReport({ score: data.score, solvedCount: data.session.submissions.filter(s => s.success).length, totalCount: oaSession.problems.length, submissions: data.session.submissions });
                addToast(`OA Simulator Completed! Overall Score: ${data.score}%`, 'gold');
                confetti({ particleCount: 150, spread: 80 }); fetchProfile();
            }
        } catch (err) { console.error(err); } finally { setOaLoading(false); setOaSession(null); }
    };

    // ─────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────

    const tabs = [
        { id: 'Lobby',         label: 'Arena Lobby' },
        { id: 'CompanyTracks', label: 'Company Tracks' },
        { id: 'MockOA',        label: 'Mock OA Simulator', icon: Shield },
        ...(problem ? [{ id: 'Arena', label: `Workspace: ${problem.title}` }] : [])
    ];

    return (
        <div className="h-[calc(100vh-64px)] bg-[#0A0A0F] text-text-primary overflow-hidden flex flex-col relative select-none">

            {/* Tab Bar */}
            <div className="bg-[#111118] border-b border-border-subtle h-12 flex items-center px-6 gap-6 shrink-0 relative z-20">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            if (oaActive && tab.id !== 'MockOA') {
                                addToast('You cannot leave the assessment during an active simulator!', 'error');
                                return;
                            }
                            setActiveTab(tab.id);
                        }}
                        className={`text-xs font-bold uppercase tracking-wider transition-all h-full border-b-2 px-1 flex items-center gap-1.5 ${activeTab === tab.id
                            ? 'border-accent-primary text-text-primary'
                            : 'border-transparent text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        {tab.icon && <tab.icon className="w-3.5 h-3.5 text-accent-secondary" />}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Views */}
            {activeTab === 'Lobby' && (
                <ArenaLobby
                    problems={problems}
                    dailyPrescription={dailyPrescription}
                    dnaHistory={dnaHistory}
                    dnaFilter={dnaFilter}
                    setDnaFilter={setDnaFilter}
                    enterArena={enterArena}
                    loadingLobby={loadingLobby}
                />
            )}

            {activeTab === 'Arena' && problem && (
                <ArenaWorkspace
                    problem={problem}
                    code={code} setCode={setCode}
                    activeLang={activeLang} setActiveLang={setActiveLang}
                    blindMode={blindMode} setBlindMode={setBlindMode}
                    peeking={peeking} peeksUsed={peeksUsed} triggerPeek={triggerPeek}
                    blindTimerActive={blindTimerActive} secondsLeft={secondsLeft}
                    votedApproach={votedApproach} setVotedApproach={setVotedApproach}
                    approaches={approaches} loadingApproaches={loadingApproaches}
                    submitting={submitting} consoleOutput={consoleOutput}
                    showAutopsy={showAutopsy} setShowAutopsy={setShowAutopsy}
                    autopsyData={autopsyData} autopsyLoading={autopsyLoading}
                    showInterviewFollowUp={showInterviewFollowUp} setShowInterviewFollowUp={setShowInterviewFollowUp}
                    followUpQuestions={followUpQuestions}
                    followUpAnswers={followUpAnswers} setFollowUpAnswers={setFollowUpAnswers}
                    recallScore={recallScore} submittingFollowUps={submittingFollowUps}
                    handleSubmit={handleSubmit} handleSubmitFollowUps={handleSubmitFollowUps}
                    addToast={addToast}
                />
            )}

            {activeTab === 'CompanyTracks' && (
                <CompanyTracks
                    problems={problems}
                    enterArena={enterArena}
                    selectedCompany={selectedCompany}
                    setSelectedCompany={setSelectedCompany}
                />
            )}

            {activeTab === 'MockOA' && (
                <MockOASimulator
                    oaActive={oaActive} oaSession={oaSession} oaReport={oaReport} oaLoading={oaLoading}
                    oaTimeLeft={oaTimeLeft} oaActiveIdx={oaActiveIdx} setOaActiveIdx={setOaActiveIdx}
                    oaAnswers={oaAnswers} setOaAnswers={setOaAnswers}
                    oaFocusLost={oaFocusLost} setOaFocusLost={setOaFocusLost}
                    handleStartOa={handleStartOa} handleEndOa={handleEndOa} handleOaCodeSubmit={handleOaCodeSubmit}
                    oaLang={oaLang} setOaLang={setOaLang}
                    oaConsoleOutputs={oaConsoleOutputs}
                />
            )}

        </div>
    );
}
