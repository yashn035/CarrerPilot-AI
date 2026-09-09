import React from 'react';
import { Target, TrendingUp } from 'lucide-react';

export default function InterviewProbabilityCard({ probabilityData }) {
  if (!probabilityData) return null;

  const { chance, confidence } = probabilityData;

  return (
    <div className="bg-background-surface border border-border-subtle rounded-card p-6 h-full flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-accent-gold" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Interview Probability</h3>
      </div>
      
      <div className="bg-background-elevated border border-accent-gold/20 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
           <span className="text-sm font-semibold text-text-primary">Estimated Chance</span>
           <span className="text-2xl font-bold text-accent-gold">{chance || 0}%</span>
        </div>
        <div className="w-full bg-border-subtle rounded-full h-2 mb-4">
           <div className="bg-accent-gold h-2 rounded-full transition-all duration-1000" style={{ width: `${chance || 0}%` }}></div>
        </div>
        <div className="text-xs text-text-secondary flex items-center gap-1.5">
           <TrendingUp className="w-3 h-3" />
           AI Confidence: <strong className="text-text-primary">{confidence || 'Medium'}</strong>
        </div>
      </div>
      <p className="text-[10px] text-text-muted mt-4 text-center leading-relaxed">
        Calculated using historical ATS conversion rates for similar profiles and matching keywords against industry standards.
      </p>
    </div>
  );
}
