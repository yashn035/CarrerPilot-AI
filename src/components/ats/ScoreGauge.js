import React from 'react';

export default function ScoreGauge({ score }) {
  const getColor = (s) => {
    if (s >= 80) return 'text-green-500';
    if (s >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStroke = (s) => {
    if (s >= 80) return '#22c55e'; // green-500
    if (s >= 50) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  return (
    <div className="bg-background-surface border border-border-subtle rounded-card p-6 flex flex-col items-center justify-center h-full">
      <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">Overall ATS Score</h3>
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="80" cy="80" r="68" className="stroke-background-elevated" strokeWidth="12" fill="transparent" />
          <circle 
            cx="80" cy="80" r="68" 
            stroke={getStroke(score)} 
            strokeWidth="12" 
            fill="transparent" 
            strokeDasharray={427}
            strokeDashoffset={427 - (427 * score) / 100}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-extrabold font-mono ${getColor(score)}`}>{score}</span>
          <span className="text-[9px] text-text-secondary uppercase tracking-widest font-semibold mt-1">/ 100</span>
        </div>
      </div>
      <p className="text-xs text-text-muted mt-4 text-center">
        {score >= 80 ? 'Excellent! Highly parseable and well-structured.' : score >= 50 ? 'Good, but needs optimization for top-tier companies.' : 'Needs significant revision for ATS compliance.'}
      </p>
    </div>
  );
}
