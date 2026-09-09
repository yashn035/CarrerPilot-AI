import React from 'react';
import {
  ShieldCheck, AlertTriangle, CheckCircle, Lightbulb, Zap, FileText, ArrowUpRight
} from 'lucide-react';

export default function ATSScorePanel({ atsResult }) {
  if (!atsResult) {
    return (
      <div className="bg-[#111118] border border-border-subtle rounded-card p-12 text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-text-muted mx-auto" />
        <h3 className="text-base font-bold text-text-primary">No ATS Analysis Performed Yet</h3>
        <p className="text-xs text-text-secondary max-w-md mx-auto">
          Upload your PDF resume or click "Analyze ATS Score" in the Upload & Analyzer tab to get instant feedback and keywords optimization suggestions powered by Groq AI.
        </p>
      </div>
    );
  }

  const { overallScore, breakdown, foundKeywords, missingKeywords, bulletSuggestions, sectionFeedback } = atsResult;

  // Determine score color
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Moderate Match';
    return 'Needs Optimization';
  };

  return (
    <div className="space-y-6">
      
      {/* OVERALL SCORE & BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Meter Card */}
        <div className="bg-[#111118] border border-border-subtle rounded-card p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="text-xs font-mono uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-accent-primary" /> Overall ATS Compatibility
          </div>
          
          {/* Circular Score Gauge */}
          <div className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center my-3 shadow-2xl ${getScoreColor(overallScore)}`}>
            <span className="text-4xl font-extrabold tracking-tight font-mono">{overallScore}</span>
            <span className="text-[10px] uppercase font-bold text-text-muted">/ 100</span>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getScoreColor(overallScore)}`}>
            {getScoreBadge(overallScore)}
          </span>
        </div>

        {/* 4 Breakdown Sub-Scores */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-[#111118] border border-border-subtle rounded-card p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-text-secondary">
              <span>Formatting & Parser</span>
              <span className="font-mono text-text-primary font-bold">{breakdown?.formattingScore || 85}%</span>
            </div>
            <div className="w-full bg-[#0A0A0F] h-2 rounded-full overflow-hidden border border-border-subtle">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${breakdown?.formattingScore || 85}%` }}></div>
            </div>
            <p className="text-[10px] text-text-muted">Standard headers, clean layout structure, and font compatibility.</p>
          </div>

          <div className="bg-[#111118] border border-border-subtle rounded-card p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-text-secondary">
              <span>Keyword Match</span>
              <span className="font-mono text-text-primary font-bold">{breakdown?.keywordScore || 75}%</span>
            </div>
            <div className="w-full bg-[#0A0A0F] h-2 rounded-full overflow-hidden border border-border-subtle">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: `${breakdown?.keywordScore || 75}%` }}></div>
            </div>
            <p className="text-[10px] text-text-muted">Direct match count against target job description requirements.</p>
          </div>

          <div className="bg-[#111118] border border-border-subtle rounded-card p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-text-secondary">
              <span>Content Quality</span>
              <span className="font-mono text-text-primary font-bold">{breakdown?.contentScore || 80}%</span>
            </div>
            <div className="w-full bg-[#0A0A0F] h-2 rounded-full overflow-hidden border border-border-subtle">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${breakdown?.contentScore || 80}%` }}></div>
            </div>
            <p className="text-[10px] text-text-muted">Action-oriented verb density and professional tone clarity.</p>
          </div>

          <div className="bg-[#111118] border border-border-subtle rounded-card p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-text-secondary">
              <span>Quantified Impact</span>
              <span className="font-mono text-text-primary font-bold">{breakdown?.impactScore || 70}%</span>
            </div>
            <div className="w-full bg-[#0A0A0F] h-2 rounded-full overflow-hidden border border-border-subtle">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${breakdown?.impactScore || 70}%` }}></div>
            </div>
            <p className="text-[10px] text-text-muted">X-Y-Z metrics density (percentages, revenue, scale).</p>
          </div>
        </div>

      </div>

      {/* KEYWORD GAP ANALYSIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Found Keywords */}
        <div className="bg-[#111118] border border-border-subtle rounded-card p-5 space-y-3">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> Matched Keywords ({foundKeywords?.length || 0})
          </h4>
          <div className="flex flex-wrap gap-2">
            {(foundKeywords || []).map((kw, idx) => (
              <span key={idx} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded text-xs font-mono font-medium">
                ✓ {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Missing Keywords */}
        <div className="bg-[#111118] border border-border-subtle rounded-card p-5 space-y-3">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" /> Missing Job Keywords ({missingKeywords?.length || 0})
          </h4>
          <p className="text-[11px] text-text-secondary">Consider incorporating these relevant skills into your experience or skills section.</p>
          <div className="flex flex-wrap gap-2">
            {(missingKeywords || []).map((kw, idx) => (
              <span key={idx} className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2.5 py-1 rounded text-xs font-mono font-medium">
                + {kw}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* BULLET SUGGESTIONS & IMPROVEMENTS */}
      {bulletSuggestions && bulletSuggestions.length > 0 && (
        <div className="bg-[#111118] border border-border-subtle rounded-card p-5 space-y-4">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" /> High-Impact Bullet Rewrites
          </h4>
          <div className="space-y-3">
            {bulletSuggestions.map((sug, idx) => (
              <div key={idx} className="bg-[#0A0A0F] border border-border-subtle rounded-card p-4 space-y-2 text-xs">
                <div className="text-rose-400/90 line-through leading-relaxed">
                  <span className="font-bold font-mono text-[10px] text-text-muted uppercase mr-2">[Before]</span> {sug.original}
                </div>
                <div className="text-emerald-400 font-semibold leading-relaxed flex items-start gap-2">
                  <ArrowUpRight className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold font-mono text-[10px] uppercase mr-2">[Improved]</span> {sug.improved}
                  </div>
                </div>
                {sug.reason && <p className="text-[10px] text-text-muted italic pt-1">{sug.reason}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION FEEDBACK */}
      {sectionFeedback && (
        <div className="bg-[#111118] border border-border-subtle rounded-card p-5 space-y-4">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent-primary" /> Section-by-Section Coaching
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {Object.entries(sectionFeedback).map(([section, feedback]) => (
              <div key={section} className="bg-[#0A0A0F] border border-border-subtle p-3 rounded space-y-1">
                <span className="font-bold uppercase text-[10px] text-accent-primary font-mono">{section}</span>
                <p className="text-text-secondary leading-relaxed">{feedback}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
