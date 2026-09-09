import React, { useState } from 'react';
import { Download, FileCode, FileText, CheckCircle, RefreshCw } from 'lucide-react';

export default function ResumeExport({ resumeData }) {
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  const downloadFile = async (format) => {
    setDownloadingFormat(format);
    try {
      const endpoint = `/api/resumes/export/${format}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(resumeData)
      });

      if (!res.ok) throw new Error(`Export failed with status ${res.status}`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(resumeData.title || 'Resume').replace(/\s+/g, '_')}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download error:', e);
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="bg-[#111118] border border-border-subtle rounded-card p-8 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Download className="w-5 h-5 text-accent-primary" /> Export & Download Resume
        </h3>
        <p className="text-xs text-text-secondary mt-1">
          Choose your preferred download format. PDF is styled for applications, TXT is optimized for ATS screening, and JSON allows schema portability.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PDF EXPORT */}
        <div className="bg-[#0A0A0F] border border-border-subtle rounded-card p-6 flex flex-col justify-between space-y-4 hover:border-accent-primary transition-all">
          <div className="space-y-2">
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 w-fit rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-text-primary">PDF Document</h4>
            <p className="text-xs text-text-secondary">
              Pixel-perfect styled layout compiled with Handlebars and rendered for high quality print.
            </p>
          </div>
          <button
            onClick={() => downloadFile('pdf')}
            disabled={downloadingFormat === 'pdf'}
            className="w-full bg-accent-primary hover:bg-accent-primary/90 text-white font-bold text-xs py-2.5 rounded-btn flex items-center justify-center gap-2 transition-all shadow-md"
          >
            {downloadingFormat === 'pdf' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloadingFormat === 'pdf' ? 'Compiling PDF...' : 'Download PDF'}
          </button>
        </div>

        {/* TXT EXPORT */}
        <div className="bg-[#0A0A0F] border border-border-subtle rounded-card p-6 flex flex-col justify-between space-y-4 hover:border-accent-primary transition-all">
          <div className="space-y-2">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 w-fit rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-text-primary">ATS Plain Text (.TXT)</h4>
            <p className="text-xs text-text-secondary">
              Clean structured plain text format designed for 100% ATS parser compatibility.
            </p>
          </div>
          <button
            onClick={() => downloadFile('txt')}
            disabled={downloadingFormat === 'txt'}
            className="w-full bg-background-elevated hover:bg-background-surface border border-border-subtle text-text-primary font-bold text-xs py-2.5 rounded-btn flex items-center justify-center gap-2 transition-all"
          >
            {downloadingFormat === 'txt' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloadingFormat === 'txt' ? 'Generating TXT...' : 'Download TXT'}
          </button>
        </div>

        {/* JSON EXPORT */}
        <div className="bg-[#0A0A0F] border border-border-subtle rounded-card p-6 flex flex-col justify-between space-y-4 hover:border-accent-primary transition-all">
          <div className="space-y-2">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit rounded-xl">
              <FileCode className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-text-primary">JSON Resume Schema</h4>
            <p className="text-xs text-text-secondary">
              Export standardized JSON data format for easy backup or import into other platforms.
            </p>
          </div>
          <button
            onClick={() => downloadFile('json')}
            disabled={downloadingFormat === 'json'}
            className="w-full bg-background-elevated hover:bg-background-surface border border-border-subtle text-text-primary font-bold text-xs py-2.5 rounded-btn flex items-center justify-center gap-2 transition-all"
          >
            {downloadingFormat === 'json' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloadingFormat === 'json' ? 'Exporting JSON...' : 'Download JSON'}
          </button>
        </div>

      </div>
    </div>
  );
}
