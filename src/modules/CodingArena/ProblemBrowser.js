import React, { useState, useMemo } from 'react';
import { Search, CheckCircle2, Circle, PlayCircle, ChevronLeft, ChevronRight, Filter, Tag } from 'lucide-react';

const ITEMS_PER_PAGE = 20;

export default function ProblemBrowser({ problems, onSelectProblem, loading, solvedIds = [], attemptedIds = [] }) {
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [selectedTag, setSelectedTag] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Extract unique tags across all loaded problems
  const allTags = useMemo(() => {
    const set = new Set();
    problems.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => set.add(t));
      }
    });
    return Array.from(set).sort();
  }, [problems]);

  // Filter problems based on user query and dropdown selection
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(search.toLowerCase().trim()) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase().trim())));

      const matchesDiff = difficultyFilter === 'All' || p.difficulty === difficultyFilter;
      const matchesTag = selectedTag === 'All' || (p.tags && p.tags.includes(selectedTag));

      return matchesSearch && matchesDiff && matchesTag;
    });
  }, [problems, search, difficultyFilter, selectedTag]);

  // Pagination Math
  const totalPages = Math.max(1, Math.ceil(filteredProblems.length / ITEMS_PER_PAGE));
  const paginatedProblems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProblems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProblems, currentPage]);

  const getProblemStatus = (p) => {
    const pid = p.id || p.titleSlug;
    if (solvedIds.includes(pid)) return 'solved';
    if (attemptedIds.includes(pid)) return 'attempted';
    return 'unsolved';
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-text-muted flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Loading Coding Arena problem library...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full p-6 space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-background-surface p-4 rounded-card border border-border-subtle shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search problem title or topic tag..."
            className="w-full bg-background-elevated border border-border-subtle rounded px-9 py-2 text-sm text-text-primary focus:border-accent-primary outline-none transition-all"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Filter className="w-3.5 h-3.5" />
            <span>Difficulty:</span>
          </div>
          <select
            className="bg-background-elevated border border-border-subtle rounded px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-primary cursor-pointer"
            value={difficultyFilter}
            onChange={(e) => {
              setDifficultyFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        {/* Tag Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Tag className="w-3.5 h-3.5" />
            <span>Topic:</span>
          </div>
          <select
            className="bg-background-elevated border border-border-subtle rounded px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-primary cursor-pointer max-w-[160px]"
            value={selectedTag}
            onChange={(e) => {
              setSelectedTag(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All">All Topics</option>
            {allTags.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Problem Table */}
      <div className="bg-background-surface border border-border-subtle rounded-card overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-subtle bg-background-elevated">
              <th className="p-4 text-xs font-semibold text-text-secondary w-16 text-center">Status</th>
              <th className="p-4 text-xs font-semibold text-text-secondary">Title</th>
              <th className="p-4 text-xs font-semibold text-text-secondary w-28">Difficulty</th>
              <th className="p-4 text-xs font-semibold text-text-secondary hidden md:table-cell">Tags</th>
              <th className="p-4 text-xs font-semibold text-text-secondary w-28 text-right">Acceptance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {paginatedProblems.map((p, i) => {
              const status = getProblemStatus(p);
              return (
                <tr
                  key={p.id || p.titleSlug || i}
                  onClick={() => onSelectProblem(p)}
                  className="hover:bg-background-elevated/50 transition-colors group cursor-pointer"
                >
                  {/* Status Indicator */}
                  <td className="p-4 text-center">
                    {status === 'solved' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto" />
                    ) : status === 'attempted' ? (
                      <PlayCircle className="w-5 h-5 text-yellow-400 mx-auto" />
                    ) : (
                      <Circle className="w-5 h-5 text-text-muted/40 mx-auto" />
                    )}
                  </td>

                  {/* Title */}
                  <td className="p-4">
                    <span className="font-semibold text-text-primary group-hover:text-accent-primary transition-colors">
                      {p.title}
                    </span>
                  </td>

                  {/* Difficulty Badge */}
                  <td className="p-4">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded border ${
                        p.difficulty === 'Easy'
                          ? 'bg-green-500/10 border-green-500/20 text-green-400'
                          : p.difficulty === 'Medium'
                          ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}
                    >
                      {p.difficulty}
                    </span>
                  </td>

                  {/* Tags */}
                  <td className="p-4 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {p.tags?.slice(0, 3).map((t, idx) => (
                        <span
                          key={idx}
                          className="bg-background-elevated border border-border-subtle text-text-secondary text-[10px] px-2 py-0.5 rounded-full"
                        >
                          {t}
                        </span>
                      ))}
                      {p.tags?.length > 3 && (
                        <span className="text-[10px] text-text-muted">+{p.tags.length - 3}</span>
                      )}
                    </div>
                  </td>

                  {/* Acceptance */}
                  <td className="p-4 text-right font-mono text-xs text-text-secondary">
                    {p.acceptance ? `${p.acceptance.toFixed(1)}%` : '50.0%'}
                  </td>
                </tr>
              );
            })}

            {filteredProblems.length === 0 && (
              <tr>
                <td colSpan="5" className="p-12 text-center text-text-muted italic">
                  No problems match your current search and filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        {filteredProblems.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-background-elevated border-t border-border-subtle">
            <span className="text-xs text-text-secondary font-medium">
              Showing <span className="text-text-primary font-bold">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredProblems.length)}</span> to{' '}
              <span className="text-text-primary font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProblems.length)}</span> of{' '}
              <span className="text-text-primary font-bold">{filteredProblems.length}</span> problems
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded bg-background-surface border border-border-subtle text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-semibold px-3 text-text-primary">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded bg-background-surface border border-border-subtle text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
