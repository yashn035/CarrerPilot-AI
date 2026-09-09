import React, { useState } from 'react';
import { Search, ChevronRight, CheckCircle, Circle, PlayCircle } from 'lucide-react';

export default function ProblemList({ problems, enterArena, loadingLobby }) {
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState('All');

  const allTags = Array.from(new Set(problems.flatMap(p => p.tags || [])));

  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesDiff = difficultyFilter === 'All' || p.difficulty === difficultyFilter;
    const matchesTag = tagFilter === 'All' || (p.tags && p.tags.includes(tagFilter));
    return matchesSearch && matchesDiff && matchesTag;
  });

  if (loadingLobby) {
    return <div className="p-8 text-center text-text-muted">Loading problems...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto w-full p-6 space-y-6">
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-background-surface p-4 rounded-card border border-border-subtle">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text"
            placeholder="Search problems..."
            className="w-full bg-background-elevated border border-border-subtle rounded px-9 py-2 text-sm text-text-primary focus:border-accent-primary outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <select 
          className="bg-background-elevated border border-border-subtle rounded px-4 py-2 text-sm text-text-primary outline-none focus:border-accent-primary"
          value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}
        >
          <option value="All">Difficulty</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        <select 
          className="bg-background-elevated border border-border-subtle rounded px-4 py-2 text-sm text-text-primary outline-none focus:border-accent-primary"
          value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}
        >
          <option value="All">Tags</option>
          {allTags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Problem Table */}
      <div className="bg-background-surface border border-border-subtle rounded-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-subtle bg-background-elevated">
              <th className="p-4 text-xs font-semibold text-text-secondary w-16">Status</th>
              <th className="p-4 text-xs font-semibold text-text-secondary">Title</th>
              <th className="p-4 text-xs font-semibold text-text-secondary">Difficulty</th>
              <th className="p-4 text-xs font-semibold text-text-secondary hidden md:table-cell">Tags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {filteredProblems.map((p, i) => (
              <tr key={p.id || i} className="hover:bg-background-elevated/50 transition-colors group cursor-pointer" onClick={() => enterArena(p)}>
                <td className="p-4 text-center">
                  {p.status === 'solved' ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                  ) : p.status === 'attempted' ? (
                    <PlayCircle className="w-5 h-5 text-yellow-500 mx-auto" />
                  ) : (
                    <Circle className="w-5 h-5 text-text-muted mx-auto" />
                  )}
                </td>
                <td className="p-4">
                  <span className="font-semibold text-text-primary group-hover:text-accent-primary transition-colors">{p.title}</span>
                </td>
                <td className="p-4">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                    p.difficulty === 'Easy' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                    p.difficulty === 'Medium' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                    'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {p.difficulty}
                  </span>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {p.tags?.slice(0,3).map((t, idx) => (
                      <span key={idx} className="bg-background-elevated border border-border-subtle text-text-secondary text-[10px] px-2 py-0.5 rounded-full">
                        {t}
                      </span>
                    ))}
                    {p.tags?.length > 3 && <span className="text-[10px] text-text-muted">+{p.tags.length - 3}</span>}
                  </div>
                </td>
              </tr>
            ))}
            {filteredProblems.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-text-muted italic">No problems match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
