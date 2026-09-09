import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Award, Flame, Target, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ProgressDashboard({ progressData, onSolveProblem }) {
  const data = progressData || {};
  const radarData = data.radarData || [
    { topic: 'Arrays', accuracy: 80, solved: 12, total: 15 },
    { topic: 'Strings', accuracy: 65, solved: 8, total: 12 },
    { topic: 'Graphs', accuracy: 40, solved: 4, total: 10 },
    { topic: 'DP', accuracy: 35, solved: 3, total: 9 },
    { topic: 'Trees', accuracy: 70, solved: 7, total: 10 },
    { topic: 'Hash Table', accuracy: 90, solved: 9, total: 10 }
  ];

  const recommendedProblems = data.recommendedProblems || [
    { id: 'two-sum', title: 'Two Sum', difficulty: 'Easy', category: 'Arrays' },
    { id: 'coin-change', title: 'Coin Change', difficulty: 'Medium', category: 'DP' },
    { id: 'number-of-islands', title: 'Number of Islands', difficulty: 'Medium', category: 'Graphs' }
  ];

  return (
    <div className="max-w-6xl mx-auto w-full p-6 space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-background-surface border border-border-subtle rounded-card flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-text-muted font-medium">Problems Solved</div>
            <div className="text-2xl font-extrabold text-text-primary mt-1">{data.totalSolved || 0}</div>
          </div>
          <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-background-surface border border-border-subtle rounded-card flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-text-muted font-medium">Active Streak</div>
            <div className="text-2xl font-extrabold text-amber-400 mt-1">{data.streakDays || 5} Days</div>
          </div>
          <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-background-surface border border-border-subtle rounded-card flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-text-muted font-medium">Total Submissions</div>
            <div className="text-2xl font-extrabold text-accent-primary mt-1">{data.totalSubmissions || 0}</div>
          </div>
          <div className="w-10 h-10 bg-accent-primary/10 rounded-full flex items-center justify-center text-accent-primary">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-background-surface border border-border-subtle rounded-card flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-text-muted font-medium">Attempted Problems</div>
            <div className="text-2xl font-extrabold text-purple-400 mt-1">{data.totalAttempted || 0}</div>
          </div>
          <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-400">
            <Target className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Analytics Charts & Weak Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topic Skill Radar Chart */}
        <div className="lg:col-span-2 bg-background-surface border border-border-subtle rounded-card p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-primary" />
              <span>Topic Proficiency Breakdown</span>
            </h3>
            <span className="text-xs text-text-muted">Accuracy % per DSA Domain</span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={radarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} />
                <XAxis dataKey="topic" stroke="#A0AEC0" fontSize={11} tickLine={false} />
                <YAxis stroke="#A0AEC0" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A202C', borderColor: '#2D3748', borderRadius: '8px' }}
                  itemStyle={{ color: '#E2E8F0', fontSize: '12px' }}
                />
                <Bar dataKey="accuracy" name="Accuracy %" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recommended Weak Area Problems */}
        <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-4 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span>AI Weak Area Next Steps</span>
            </h3>
            <p className="text-[11px] text-text-muted mt-1">Recommended problems based on low accuracy topics</p>
          </div>

          <div className="space-y-3">
            {recommendedProblems.map((prob, idx) => (
              <div
                key={idx}
                onClick={() => onSolveProblem && onSolveProblem(prob)}
                className="p-3 bg-background-elevated border border-border-subtle hover:border-accent-primary/50 rounded-lg transition-all cursor-pointer group flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-xs text-text-primary group-hover:text-accent-primary transition-colors">
                    {prob.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-text-muted">{prob.category}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      prob.difficulty === 'Easy' ? 'text-green-400 bg-green-500/10' :
                      prob.difficulty === 'Medium' ? 'text-yellow-400 bg-yellow-500/10' :
                      'text-red-400 bg-red-500/10'
                    }`}>
                      {prob.difficulty}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
