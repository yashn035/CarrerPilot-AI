import React from 'react';
import ReactWordcloud from 'react-wordcloud';

export default function KeywordCloud({ keywordGaps }) {
  if (!keywordGaps || !keywordGaps.missing || keywordGaps.missing.length === 0) {
    return (
      <div className="bg-background-surface border border-border-subtle rounded-card p-6 flex flex-col items-center justify-center h-full">
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-2">Missing Keywords</h3>
        <p className="text-xs text-green-500 font-semibold">Perfect! No major missing keywords detected.</p>
      </div>
    );
  }

  return (
    <div className="bg-background-surface border border-border-subtle rounded-card p-6 h-full">
      <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">Missing Keywords</h3>
      <div className="h-48 w-full bg-background-elevated rounded-lg border border-border-subtle p-2">
        <ReactWordcloud 
          words={keywordGaps.missing} 
          options={{
            colors: ['#FF5A5F', '#FFB400', '#00A699', '#ffffff'],
            enableTooltip: true,
            deterministic: true,
            fontFamily: 'Inter',
            fontSizes: [12, 35],
            fontStyle: 'normal',
            fontWeight: 'bold',
            padding: 2,
            rotations: 2,
            rotationAngles: [0, 90],
            scale: 'sqrt',
            spiral: 'archimedean',
          }} 
        />
      </div>
      <p className="text-[10px] text-text-muted mt-3 text-center">Add these keywords organically to your experience or skills sections.</p>
    </div>
  );
}
