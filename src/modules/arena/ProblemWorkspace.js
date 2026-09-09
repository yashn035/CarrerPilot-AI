import React from 'react';
import EditorPanel from './EditorPanel';
import ResultsPanel from './ResultsPanel';
import BlindModeToggle from './BlindModeToggle';

export default function ProblemWorkspace({ 
  problem, code, setCode, activeLang, setActiveLang,
  blindMode, setBlindMode, peeking, triggerPeek, peeksUsed, secondsLeft,
  submitting, consoleOutput, handleSubmit, addToast
}) {
  
  if (!problem) return null;

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#0A0A0F]">
      
      {/* Left Pane: Problem Description */}
      <div className="w-full md:w-1/2 flex flex-col border-r border-border-subtle overflow-hidden relative">
        <div className="p-4 bg-background-surface border-b border-border-subtle flex justify-between items-center z-10 shrink-0">
          <h2 className="font-display font-bold text-lg text-text-primary">{problem.title}</h2>
          <BlindModeToggle 
            blindMode={blindMode} setBlindMode={setBlindMode} 
            peeking={peeking} triggerPeek={triggerPeek} peeksUsed={peeksUsed}
            secondsLeft={secondsLeft} 
          />
        </div>
        
        <div className={`p-6 overflow-y-auto custom-scrollbar flex-1 transition-all duration-700 ${blindMode && !peeking ? 'blur-md opacity-40 select-none' : ''}`}>
          <div className="prose prose-invert max-w-none text-sm text-text-secondary space-y-4">
            <div dangerouslySetInnerHTML={{ __html: problem.description || problem.statement || 'No description provided.' }} />
            
            {problem.examples?.map((ex, i) => (
              <div key={i} className="bg-background-elevated p-4 rounded border border-border-subtle mt-4">
                <p className="font-bold text-xs text-text-primary mb-2">Example {i+1}:</p>
                <div className="font-mono text-[11px] text-text-secondary space-y-1">
                  <p><strong className="text-text-primary">Input:</strong> {ex.input}</p>
                  <p><strong className="text-text-primary">Output:</strong> {ex.output}</p>
                  {ex.explanation && <p><strong className="text-text-primary">Explanation:</strong> {ex.explanation}</p>}
                </div>
              </div>
            ))}
            
            {problem.constraints && problem.constraints.length > 0 && (
              <div className="mt-4">
                <p className="font-bold text-xs text-text-primary mb-2">Constraints:</p>
                <ul className="list-disc pl-4 font-mono text-[11px] space-y-1">
                  {problem.constraints.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Pane: Editor & Results */}
      <div className="w-full md:w-1/2 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0">
          <EditorPanel 
            code={code} setCode={setCode} 
            activeLang={activeLang} setActiveLang={setActiveLang} 
            submitting={submitting} handleSubmit={handleSubmit}
          />
        </div>
        <div className="h-64 border-t border-border-subtle shrink-0">
          <ResultsPanel consoleOutput={consoleOutput} submitting={submitting} />
        </div>
      </div>

    </div>
  );
}
