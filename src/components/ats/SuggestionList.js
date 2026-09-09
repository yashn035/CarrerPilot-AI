import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function SuggestionList({ suggestions }) {
  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="bg-background-surface border border-border-subtle rounded-card p-6 h-full">
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">Actionable Feedback</h3>
        <p className="text-xs text-green-500 font-semibold flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Looking great!</p>
      </div>
    );
  }

  const getIcon = (priority) => {
    if (priority === 'High') return <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />;
    if (priority === 'Medium') return <Info className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />;
    return <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />;
  };

  return (
    <div className="bg-background-surface border border-border-subtle rounded-card p-6 h-full">
      <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">Actionable Feedback</h3>
      <ul className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
        {suggestions.map((sug, index) => (
          <li key={index} className="bg-background-elevated p-3 rounded-lg border border-border-subtle flex items-start gap-3">
            {getIcon(sug.priority)}
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${sug.priority === 'High' ? 'text-red-500' : sug.priority === 'Medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                {sug.priority} Priority
              </span>
              <p className="text-xs text-text-primary mt-1">{sug.advice}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
