import React, { useState } from 'react';
import { Upload, FileText, Sparkles, RefreshCw, Briefcase } from 'lucide-react';
import ATSScorePanel from './ATSScorePanel';

export default function UploadAnalyzer({ currentResumeData }) {
  const [file, setFile] = useState(null);
  const [jobTitle, setJobTitle] = useState('Software Engineer');
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [atsResult, setAtsResult] = useState(null);
  const [mode, setMode] = useState('active'); // 'active' (current resume in builder) or 'upload' (PDF file upload)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('jobTitle', jobTitle);
      formData.append('jobDescription', jobDescription);

      if (mode === 'upload' && file) {
        formData.append('resumeFile', file);
      } else {
        // Send JSON representation as text
        formData.append('resumeText', JSON.stringify(currentResumeData));
      }

      const res = await fetch('/api/resumes/groq/analyze-ats', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.status === 'success') {
        setAtsResult(data.data);
      }
    } catch (e) {
      console.error('ATS Analysis Error:', e);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Mode Selection & Target Role Input */}
      <div className="bg-[#111118] border border-border-subtle rounded-card p-6 space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-subtle pb-4">
          <div>
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-primary" /> Groq AI ATS Score Analyzer
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Evaluate your resume match score against job specifications and extract key keyword gaps.
            </p>
          </div>

          <div className="flex bg-[#0A0A0F] p-1 border border-border-subtle rounded-btn text-xs font-semibold">
            <button
              onClick={() => setMode('active')}
              className={`px-3 py-1.5 rounded ${mode === 'active' ? 'bg-accent-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Analyze Active Resume
            </button>
            <button
              onClick={() => setMode('upload')}
              className={`px-3 py-1.5 rounded ${mode === 'upload' ? 'bg-accent-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Upload PDF File
            </button>
          </div>
        </div>

        {/* Upload Zone (if PDF file mode selected) */}
        {mode === 'upload' && (
          <div className="border-2 border-dashed border-border-subtle hover:border-accent-primary rounded-card p-6 text-center space-y-3 bg-[#0A0A0F] transition-all">
            <Upload className="w-10 h-10 text-accent-primary mx-auto" />
            <div className="text-xs font-bold text-text-primary">
              {file ? file.name : 'Drag and drop your PDF resume here, or browse'}
            </div>
            <p className="text-[10px] text-text-muted">Supports .PDF files up to 10MB</p>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="pdf-upload-input"
            />
            <label
              htmlFor="pdf-upload-input"
              className="inline-block cursor-pointer bg-background-elevated hover:bg-background-surface border border-border-subtle text-text-primary text-xs font-bold px-4 py-2 rounded-btn transition-all"
            >
              Select File
            </label>
          </div>
        )}

        {/* Job Description Inputs */}
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider block mb-1">
              Target Job Title
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              className="w-full bg-[#0A0A0F] border border-border-subtle rounded p-2.5 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider block mb-1">
              Job Description (Paste JD Text)
            </label>
            <textarea
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job posting description here to calculate keyword match precision..."
              className="w-full bg-[#0A0A0F] border border-border-subtle rounded p-3 text-xs text-text-primary focus:outline-none focus:border-accent-primary leading-relaxed"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing || (mode === 'upload' && !file)}
            className="w-full bg-accent-primary hover:bg-accent-primary/90 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-btn flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {analyzing ? 'Evaluating ATS Score with Groq AI...' : 'Run ATS Score Analysis'}
          </button>
        </div>

      </div>

      {/* RESULT REPORT */}
      <ATSScorePanel atsResult={atsResult} />

    </div>
  );
}
