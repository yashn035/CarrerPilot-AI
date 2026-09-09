import React, { useState, useEffect } from 'react';
import { Code, Building2, Timer, BarChart3, ArrowLeft } from 'lucide-react';
import ProblemBrowser from './ProblemBrowser';
import ProblemWorkspace from './ProblemWorkspace';
import CompanyTracks from './CompanyTracks';
import OASimulator from './OASimulator';
import ProgressDashboard from './ProgressDashboard';
import { useUser } from '../../context/UserContext';

export default function CodingArena() {
  const { getAuthHeaders } = useUser();
  const [activeTab, setActiveTab] = useState('browser'); // 'browser' | 'tracks' | 'oa' | 'progress'
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [problems, setProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [progressData, setProgressData] = useState({});

  const fetchProblems = async () => {
    setLoadingProblems(true);
    try {
      const res = await fetch('/api/coding/problems', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setProblems(data);
      }
    } catch (err) {
      console.error('Failed to fetch problems:', err);
    } finally {
      setLoadingProblems(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const res = await fetch('/api/coding/progress', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setProgressData(data);
      }
    } catch (err) {
      console.error('Failed to fetch progress:', err);
    }
  };

  useEffect(() => {
    fetchProblems();
    fetchProgress();
  }, []);

  const handleOpenProblem = async (prob) => {
    const probId = prob.id || prob.titleSlug;
    try {
      const res = await fetch(`/api/coding/${probId}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const fullProblem = await res.json();
        setSelectedProblem(fullProblem);
      } else {
        setSelectedProblem(prob);
      }
    } catch (e) {
      setSelectedProblem(prob);
    }
  };

  const handleBackToLobby = () => {
    setSelectedProblem(null);
    fetchProblems();
    fetchProgress();
  };

  // If a problem is open, render Problem Workspace
  if (selectedProblem) {
    return (
      <ProblemWorkspace
        problem={selectedProblem}
        onBack={handleBackToLobby}
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-background-base text-text-primary">
      {/* Top Header & Tab Navigation Bar */}
      <div className="border-b border-border-subtle bg-background-surface sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 pt-4 pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <Code className="w-6 h-6 text-accent-primary" />
                <span>Coding Arena</span>
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                Master DSA algorithms, practice placement coding problems, and simulate company OAs.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-6 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab('browser')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'browser'
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Problem Browser</span>
            </button>

            <button
              onClick={() => setActiveTab('tracks')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'tracks'
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Company Tracks</span>
            </button>

            <button
              onClick={() => setActiveTab('oa')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'oa'
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Timer className="w-4 h-4" />
              <span>Mock OA Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab('progress')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'progress'
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Progress Analytics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="py-6">
        {activeTab === 'browser' && (
          <ProblemBrowser
            problems={problems}
            onSelectProblem={handleOpenProblem}
            loading={loadingProblems}
            solvedIds={progressData.solvedIds || []}
            attemptedIds={progressData.attemptedIds || []}
          />
        )}

        {activeTab === 'tracks' && (
          <CompanyTracks
            onSelectTrack={(companyName) => {
              setActiveTab('browser');
              fetchProblems();
            }}
          />
        )}

        {activeTab === 'oa' && (
          <OASimulator
            onFinishOA={() => {
              setActiveTab('progress');
              fetchProgress();
            }}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressDashboard
            progressData={progressData}
            onSolveProblem={(prob) => {
              setSelectedProblem(prob);
            }}
          />
        )}
      </div>
    </div>
  );
}
