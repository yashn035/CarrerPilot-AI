import React from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send, Loader2, Code2 } from 'lucide-react';

const LANGUAGE_VERSIONS = [
  { id: 'javascript', label: 'JavaScript (Node.js v18)' },
  { id: 'python', label: 'Python 3.10' },
  { id: 'java', label: 'Java 15' },
  { id: 'cpp', label: 'C++ 17' }
];

export default function EditorPanel({
  language,
  setLanguage,
  code,
  setCode,
  onRun,
  onSubmit,
  running,
  submitting
}) {
  const getMonacoLanguage = (lang) => {
    switch (lang) {
      case 'python': return 'python';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-surface border border-border-subtle rounded-card overflow-hidden">
      {/* Editor Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-background-elevated border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-accent-primary" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-background-surface border border-border-subtle rounded px-3 py-1 text-xs text-text-primary outline-none focus:border-accent-primary font-medium"
          >
            {LANGUAGE_VERSIONS.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRun}
            disabled={running || submitting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-background-surface hover:bg-background-elevated border border-border-subtle text-text-primary transition-all disabled:opacity-50"
          >
            {running ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-primary" />
            ) : (
              <Play className="w-3.5 h-3.5 text-green-400 fill-green-400" />
            )}
            <span>Run Code</span>
          </button>

          <button
            onClick={onSubmit}
            disabled={running || submitting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-semibold bg-accent-primary hover:bg-accent-primary/90 text-white transition-all shadow-glow disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Submit Solution</span>
          </button>
        </div>
      </div>

      {/* Monaco Editor Component */}
      <div className="flex-1 min-h-[350px] relative">
        <Editor
          height="100%"
          language={getMonacoLanguage(language)}
          value={code}
          onChange={(val) => setCode(val || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            padding: { top: 12, bottom: 12 },
            fontFamily: "'Fira Code', 'Courier New', monospace"
          }}
        />
      </div>
    </div>
  );
}
