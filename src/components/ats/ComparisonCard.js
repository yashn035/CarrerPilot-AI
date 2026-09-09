import React from 'react';
import { Users, ChevronRight } from 'lucide-react';

export default function ComparisonCard({ comparisonText }) {
  return (
    <div className="bg-background-surface border border-border-subtle rounded-card p-6 h-full flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-accent-secondary" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Peer Comparison</h3>
      </div>
      
      <div className="bg-accent-secondary/5 border border-accent-secondary/20 rounded-lg p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent-secondary/10 rounded-full blur-2xl pointer-events-none"></div>
        <p className="text-sm text-text-primary leading-relaxed relative z-10">
          "{comparisonText || 'Your resume is slightly below average compared to peers. Adding more quantifiable metrics will elevate you to the top 20%.'}"
        </p>
      </div>

      <button className="mt-4 text-xs text-accent-secondary font-bold flex items-center hover:underline group w-fit">
        View Detailed Peer Matrix <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
