import React from 'react';
import { Loader, Terminal, CheckCircle, XCircle } from 'lucide-react';

export default function ResultsPanel({ consoleOutput, submitting }) {
  if (submitting) {
    return (
      <div className="h-full flex items-center justify-center bg-background-elevated">
        <div className="flex items-center gap-2 text-text-secondary font-mono text-sm">
          <Loader className="w-4 h-4 animate-spin text-accent-primary" />
          Evaluating submission...
        </div>
      </div>
    );
  }

  if (!consoleOutput) {
    return (
      <div className="h-full flex items-center justify-center bg-background-elevated">
        <div className="flex items-center gap-2 text-text-muted font-mono text-xs">
          <Terminal className="w-4 h-4" />
          Run or Submit code to see execution results.
        </div>
      </div>
    );
  }

  const { status, passedCount, totalCount, error } = consoleOutput;
  const isSuccess = status === 'success';

  return (
    <div className="h-full bg-background-surface overflow-y-auto custom-scrollbar flex flex-col">
      <div className="p-3 border-b border-border-subtle bg-background-elevated flex items-center gap-2">
        <Terminal className="w-4 h-4 text-text-secondary" />
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Test Results</span>
      </div>
      
      <div className="p-4 flex-1">
        {status === 'compiling' ? (
           <div className="text-text-muted font-mono text-xs animate-pulse">Compiling and executing sandbox...</div>
        ) : (
          <div className="space-y-4">
            <h3 className={`text-xl font-bold flex items-center gap-2 ${isSuccess ? 'text-green-500' : 'text-red-500'}`}>
              {isSuccess ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              {isSuccess ? 'Accepted' : 'Wrong Answer'}
            </h3>
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-xs rounded whitespace-pre-wrap">
                {error}
              </div>
            )}
            
            {(passedCount !== undefined && totalCount !== undefined) && (
              <div className="text-sm font-mono text-text-secondary">
                Passed <span className={isSuccess ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{passedCount}</span> / {totalCount} test cases.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
