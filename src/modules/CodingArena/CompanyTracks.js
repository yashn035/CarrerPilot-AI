import React, { useState } from 'react';
import { Building2, Award, Clock, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';

const COMPANY_TRACKS = [
  {
    id: 'google',
    name: 'Google',
    role: 'Software Engineer (L3/L4)',
    color: 'from-blue-500/20 to-green-500/20 border-blue-500/40',
    accentColor: 'text-blue-400',
    totalQuestions: 150,
    ratios: { easy: 20, medium: 60, hard: 20 },
    timeline: '4 Weeks Prep',
    topics: [
      { name: 'Graphs & BFS/DFS', percentage: 35 },
      { name: 'Dynamic Programming', percentage: 25 },
      { name: 'Trees & Tries', percentage: 20 },
      { name: 'Arrays & Sliding Window', percentage: 20 }
    ]
  },
  {
    id: 'amazon',
    name: 'Amazon',
    role: 'SDE I / SDE II',
    color: 'from-amber-500/20 to-orange-500/20 border-amber-500/40',
    accentColor: 'text-amber-400',
    totalQuestions: 180,
    ratios: { easy: 25, medium: 55, hard: 20 },
    timeline: '3 Weeks Prep',
    topics: [
      { name: 'Trees & Binary Search', percentage: 30 },
      { name: 'Greedy & Hash Maps', percentage: 25 },
      { name: 'Arrays & Strings', percentage: 25 },
      { name: 'Graphs & Union Find', percentage: 20 }
    ]
  },
  {
    id: 'meta',
    name: 'Meta',
    role: 'Rotational Software Engineer (E3)',
    color: 'from-cyan-500/20 to-blue-600/20 border-cyan-500/40',
    accentColor: 'text-cyan-400',
    totalQuestions: 140,
    ratios: { easy: 30, medium: 55, hard: 15 },
    timeline: '3 Weeks Prep',
    topics: [
      { name: 'Arrays & Strings', percentage: 40 },
      { name: 'Binary Trees & Recursion', percentage: 25 },
      { name: 'Hash Tables & Two Pointers', percentage: 20 },
      { name: 'Dynamic Programming', percentage: 15 }
    ]
  },
  {
    id: 'stripe',
    name: 'Stripe',
    role: 'Full Stack / Backend Engineer',
    color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/40',
    accentColor: 'text-purple-400',
    totalQuestions: 90,
    ratios: { easy: 15, medium: 65, hard: 20 },
    timeline: '2 Weeks Prep',
    topics: [
      { name: 'String Processing & Parsing', percentage: 35 },
      { name: 'Design & Data Structuring', percentage: 30 },
      { name: 'Hash Maps & LRU Caches', percentage: 20 },
      { name: 'Concurrency & Multi-threading', percentage: 15 }
    ]
  }
];

export default function CompanyTracks({ onSelectTrack }) {
  const [selectedCompany, setSelectedCompany] = useState(COMPANY_TRACKS[0]);

  return (
    <div className="max-w-6xl mx-auto w-full p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-accent-primary/20 via-purple-500/10 to-transparent p-6 rounded-card border border-border-subtle flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Building2 className="w-5 h-5 text-accent-primary" />
            <span>Target Company Placement Tracks</span>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Curated problem sets and frequency patterns compiled from recent interview experiences at top tech companies.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold bg-background-surface px-4 py-2 rounded-lg border border-border-subtle">
          <Clock className="w-4 h-4 text-accent-primary" />
          <span>Recommended Timeline: 2-4 Weeks</span>
        </div>
      </div>

      {/* Grid of Company Track Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {COMPANY_TRACKS.map((comp) => (
          <div
            key={comp.id}
            onClick={() => setSelectedCompany(comp)}
            className={`p-6 rounded-card border bg-background-surface transition-all cursor-pointer ${
              selectedCompany.id === comp.id
                ? `bg-gradient-to-br ${comp.color} shadow-lg ring-1 ring-accent-primary/50`
                : 'hover:border-border-subtle/80 hover:bg-background-elevated/40'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-text-primary">{comp.name}</h3>
                <span className="text-xs text-text-secondary font-medium">{comp.role}</span>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border bg-background-surface ${comp.accentColor}`}>
                {comp.totalQuestions} Questions
              </span>
            </div>

            {/* Difficulty Breakdown Bar */}
            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-[11px] text-text-muted font-medium">
                <span>Easy: {comp.ratios.easy}%</span>
                <span>Medium: {comp.ratios.medium}%</span>
                <span>Hard: {comp.ratios.hard}%</span>
              </div>
              <div className="h-2 w-full bg-background-elevated rounded-full overflow-hidden flex">
                <div style={{ width: `${comp.ratios.easy}%` }} className="bg-green-400 h-full" />
                <div style={{ width: `${comp.ratios.medium}%` }} className="bg-yellow-400 h-full" />
                <div style={{ width: `${comp.ratios.hard}%` }} className="bg-red-400 h-full" />
              </div>
            </div>

            {/* Topic Distribution */}
            <div className="space-y-2 mb-5">
              <div className="text-xs font-semibold text-text-secondary">Key Focus Areas:</div>
              <div className="grid grid-cols-2 gap-2">
                {comp.topics.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-background-elevated/70 px-2.5 py-1.5 rounded border border-border-subtle">
                    <span className="text-text-primary truncate">{t.name}</span>
                    <span className="font-mono text-text-muted text-[11px] ml-1">{t.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Start Practice Track Action */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectTrack) onSelectTrack(comp.name);
              }}
              className="w-full py-2.5 px-4 rounded font-semibold text-xs bg-accent-primary hover:bg-accent-primary/90 text-white flex items-center justify-center gap-2 transition-all shadow-glow"
            >
              <span>Practice {comp.name} Track Problems</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
