import React from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send, Loader } from 'lucide-react';

export default function EditorPanel({ code, setCode, activeLang, setActiveLang, submitting, handleSubmit }) {
  return (
    <div className="flex flex-col h-full bg-[#1E1E2E]">
      <div className="flex items-center justify-between p-2 bg-[#181825] border-b border-[#313244]">
        <select 
          className="bg-[#313244] border-none rounded px-3 py-1 text-xs text-[#CDD6F4] outline-none cursor-pointer"
          value={activeLang} onChange={(e) => setActiveLang(e.target.value)}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>

        <div className="flex gap-2">
          <button 
            disabled={submitting}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#313244] hover:bg-[#45475A] text-[#CDD6F4] text-xs font-bold transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" /> Run
          </button>
          <button 
            onClick={handleSubmit} disabled={submitting}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-green-500 hover:bg-green-600 text-white text-xs font-bold transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Submit
          </button>
        </div>
      </div>
      
      <div className="flex-1 min-h-0 relative">
        <Editor
          height="100%"
          language={activeLang}
          theme="vs-dark"
          value={code}
          onChange={(val) => setCode(val || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: 'JetBrains Mono, monospace',
            padding: { top: 16 },
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
}
