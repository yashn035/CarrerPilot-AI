import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { 
  Sparkles, FileText, Upload, RefreshCw, 
  Award, Eye, AlertCircle, CheckCircle, HelpCircle, ArrowRight 
} from 'lucide-react';

export default function ResumeAnalyzer() {
  const { getAuthHeaders, addToast, user, fetchProfile } = useUser();
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState(null);
  
  // Heatmap visibility
  const [showHeatmap, setShowHeatmap] = useState(false);

  const fetchResumes = async () => {
    try {
      const res = await fetch('/api/resumes', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setResumes(data);
        if (data.length > 0) {
          setSelectedResumeId(data[0].id);
          // Check if report already exists for this resume
          fetchExistingReport(data[0].id);
        } else {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchExistingReport = async (resumeId) => {
    try {
      const res = await fetch(`/api/resumes/${resumeId}/report`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      } else {
        setReport(null);
      }
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleResumeChange = (e) => {
    const rId = e.target.value;
    setSelectedResumeId(rId);
    setLoading(true);
    fetchExistingReport(rId);
  };

  const startAnalysis = async () => {
    if (!selectedResumeId) {
      addToast("Please create a resume first in the Builder tab", "info");
      return;
    }
    setScanning(true);
    try {
      const res = await fetch(`/api/resumes/${selectedResumeId}/analyze`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ jobDescription })
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
        addToast("ATS analysis compiled!", "success");
        await fetchProfile(); // Refetch profile to update dashboard scores
        if (data.leveledUp) addToast("Level Up!", "gold");
      } else {
        addToast("Analysis failed. Verify backend logs.", "error");
      }
    } catch (err) {
      addToast("Failed to connect to server.", "error");
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-accent-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-4 md:p-6 pb-20">
      
      {/* Title */}
      <div className="flex justify-between items-center pb-4 border-b border-border-subtle">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">AI Resume Analyzer 2.0</h1>
          <p className="text-xs text-text-secondary mt-1">Audit your resume matching compliance, grammar constraints, and recruiter attention spans.</p>
        </div>
      </div>

      {/* Upload Zone / Configuration Pane */}
      {!report && !scanning ? (
        <div className="max-w-3xl mx-auto bg-background-surface border border-border-subtle p-8 rounded-card shadow-lg text-center space-y-6">
          <div className="border-2 border-dashed border-border-subtle hover:border-accent-primary/50 rounded-card p-10 flex flex-col items-center justify-center transition-all cursor-pointer bg-background-elevated/40 relative">
            <Upload className="w-10 h-10 text-accent-primary mb-3" />
            <h3 className="text-sm font-semibold text-text-primary">Select one of your saved Resumes to scan</h3>
            
            {resumes.length > 0 ? (
              <select
                className="mt-4 bg-background-surface border border-border-subtle rounded-input px-4 py-2 text-xs font-semibold focus:outline-none focus:border-accent-primary text-text-primary"
                value={selectedResumeId}
                onChange={handleResumeChange}
                onClick={(e) => e.stopPropagation()}
              >
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>{r.title} (v{r.version})</option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-accent-danger mt-2">No active resumes found. Please create one in the Resume Builder first.</p>
            )}
            
            <span className="text-[10px] text-text-muted mt-2">PDF, DOCX format metadata auto-synchronized</span>
          </div>

          <div className="space-y-2 text-left">
            <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest">Compare against Target Job Description (Optional)</label>
            <textarea
              rows={5}
              placeholder="Paste target job requirements to isolate missing technical skills and custom keywords compliance..."
              className="w-full bg-background-elevated border border-border-subtle rounded-input p-4 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <button
            onClick={startAnalysis}
            disabled={resumes.length === 0}
            className="w-full bg-accent-primary hover:bg-accent-primary/95 text-white py-3 rounded-btn font-semibold text-sm flex items-center justify-center gap-1.5 transition-all transform active:scale-[0.98] disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-white" /> Start AI Placement Compliance Review
          </button>
        </div>
      ) : scanning ? (
        <div className="max-w-md mx-auto bg-background-surface border border-border-subtle p-8 rounded-card shadow-lg text-center space-y-6 min-h-[350px] flex flex-col justify-center items-center">
          <div className="relative mb-4">
            <RefreshCw className="w-12 h-12 text-accent-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent-secondary" />
            </div>
          </div>
          <h3 className="text-lg font-display font-bold text-text-primary">Scanning Document Structures</h3>
          <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
            Parsing sections, validating action verbs, matching skills catalogs against company matrices, and executing recruiter attention simulations.
          </p>
          <div className="w-full bg-background-elevated h-1 rounded-full overflow-hidden">
            <div className="bg-accent-primary h-full w-2/3 animate-pulse"></div>
          </div>
        </div>
      ) : (
        /* ANALYSIS RESULTS DASHBOARD */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Column 1: Scores & heatmaps */}
          <div className="space-y-6 xl:col-span-1">
            
            {/* ATS circular grade widget */}
            <div className="bg-background-surface border border-border-subtle rounded-card p-6 flex flex-col items-center text-center">
              <div className="flex justify-between items-center w-full mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">ATS Score Indicator</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-accent-primary/10 border border-accent-primary/20 text-accent-primary rounded font-mono">Grade {report.grade}</span>
              </div>
              
              <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="68" className="stroke-background-elevated" strokeWidth="10" fill="transparent" />
                  <circle 
                    cx="80" cy="80" r="68" 
                    className="stroke-accent-primary gauge-ring-path" 
                    strokeWidth="10" 
                    fill="transparent" 
                    strokeDasharray={427}
                    strokeDashoffset={427 - (427 * report.score) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold text-text-primary font-mono">{report.score}</span>
                  <span className="text-[9px] text-text-secondary uppercase tracking-widest font-semibold mt-1">Matching Weight</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-border-subtle text-left">
                {Object.keys(report.sections).map((sec) => (
                  <div key={sec}>
                    <div className="flex justify-between text-[10px] uppercase tracking-wider text-text-secondary mb-1">
                      <span>{sec}</span>
                      <span className="font-mono text-text-primary">{report.sections[sec]}%</span>
                    </div>
                    <div className="w-full bg-background-elevated h-1 rounded-full overflow-hidden">
                      <div className="bg-accent-secondary h-full" style={{ width: `${report.sections[sec]}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recruiter Attention Eye-tracking Heatmap */}
            <div className="bg-background-surface border border-border-subtle rounded-card p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Recruiter Heatmap Preview</h3>
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className="bg-background-elevated hover:bg-background-elevated/85 border border-border-subtle text-text-primary text-[10px] font-bold px-2.5 py-1.5 rounded-btn flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> {showHeatmap ? 'Hide Hotspots' : 'Overlay Hotspots'}
                </button>
              </div>

              <div className="relative border border-border-subtle rounded-card overflow-hidden bg-white p-6 min-h-[300px]">
                
                {/* Simulated Heatmap Blobs */}
                {showHeatmap && (
                  <div className="absolute inset-0 z-20 pointer-events-none mix-blend-multiply opacity-75">
                    {/* Top hotspot (Name & Links) */}
                    <div className="absolute top-[10%] left-[25%] right-[25%] h-14 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,0,0,0.5) 0%, rgba(255,200,0,0.2) 60%, transparent 100%)' }}></div>
                    {/* Secondary hotspot (First Experience Company/Role) */}
                    <div className="absolute top-[30%] left-[15%] w-64 h-12 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,0,0,0.45) 0%, rgba(255,180,0,0.15) 55%, transparent 100%)' }}></div>
                    {/* Projects focus */}
                    <div className="absolute top-[55%] left-[20%] w-72 h-10 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,100,0,0.35) 0%, rgba(255,200,0,0.1) 50%, transparent 100%)' }}></div>
                    {/* Education spot */}
                    <div className="absolute top-[75%] left-[15%] w-48 h-8 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,150,0,0.25) 0%, rgba(255,220,0,0.05) 50%, transparent 100%)' }}></div>
                  </div>
                )}

                {/* Mock mini document content */}
                <div className="text-[7px] text-gray-800 space-y-3 font-serif select-none select-none opacity-40">
                  <div className="text-center space-y-1 pb-1 border-b border-gray-300">
                    <div className="text-xs font-bold text-gray-900">ALEX MERCER</div>
                    <div className="text-[6px] text-gray-500">alex.mercer@gmail.com | +1 (555) 019-2834 | linkedin.com/in/alexmercer</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold border-b border-gray-200 text-[8px] uppercase">Education</div>
                    <div className="flex justify-between">
                      <span className="font-bold">Tech Institute of Technology</span>
                      <span>2022 - 2026</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="font-bold border-b border-gray-200 text-[8px] uppercase">Experience</div>
                    <div>
                      <div className="font-bold">ByteCraft Solutions — Frontend Developer Intern</div>
                      <p>• Engineered responsive React front-end templates, reducing page load constraints.</p>
                      <p>• Resolved styling discrepancies across core dashboards.</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="font-bold border-b border-gray-200 text-[8px] uppercase">Projects</div>
                    <div>
                      <div className="font-bold">DevRank - Developer Portfolio Engine</div>
                      <p>• Created open-source developer diagnostics panels.</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-text-muted mt-2 text-center leading-relaxed">
                Hotspots show high eye-tracking dwell times based on standard recruiter scans. Use active formatting at these spots.
              </p>
            </div>

          </div>

          {/* Column 2 & 3: Keyword Analysis & grammar */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Recruiter 7-second simulation */}
            <div className="bg-background-elevated border border-accent-primary/20 rounded-card p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full blur-xl"></div>
              <div className="flex gap-4">
                <div className="bg-accent-primary/10 border border-accent-primary/20 p-2.5 rounded-lg text-accent-primary h-fit">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">Recruiter Simulation Log</h3>
                  <p className="text-xs text-text-secondary mt-1.5 leading-relaxed italic">
                    "{report.recruiterSimulation}"
                  </p>
                </div>
              </div>
            </div>

            {/* Keyword found vs missing cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="bg-background-surface border border-border-subtle rounded-card p-5">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-accent-secondary" /> Keywords Match Found
                </h4>
                <div className="flex flex-wrap gap-2">
                  {report.keywords.found.map((kw, i) => (
                    <span key={i} className="text-[10px] font-semibold px-2.5 py-1 rounded bg-accent-secondary/10 border border-accent-secondary/20 text-accent-secondary">
                      {kw}
                    </span>
                  ))}
                  {report.keywords.found.length === 0 && <span className="text-xs text-text-muted italic">No matching keywords.</span>}
                </div>
              </div>

              <div className="bg-background-surface border border-border-subtle rounded-card p-5">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-accent-danger" /> Missing Keywords Detected
                </h4>
                <div className="flex flex-wrap gap-2">
                  {report.keywords.missing.map((kw, i) => (
                    <span key={i} className="text-[10px] font-semibold px-2.5 py-1 rounded bg-accent-danger/10 border border-accent-danger/20 text-accent-danger">
                      {kw}
                    </span>
                  ))}
                  {report.keywords.missing.length === 0 && <span className="text-xs text-accent-secondary italic">Perfect keywords matched!</span>}
                </div>
              </div>

            </div>

            {/* Grammar Clarity suggestions */}
            <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Grammar, Phrasing & Clarity Audits</h3>
              
              <div className="divide-y divide-border-subtle">
                {report.grammarIssues.map((issue, idx) => (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-text-primary">Detected Line: <span className="text-text-muted font-mono font-normal">"{issue.line}"</span></span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-accent-danger/10 border border-accent-danger/25 text-accent-danger uppercase">Clarity Gap</span>
                    </div>
                    <p className="text-xs text-text-secondary">{issue.issue}</p>
                    <div className="p-3 bg-background-elevated border border-border-subtle rounded-card text-xs flex justify-between items-center gap-4">
                      <div>
                        <span className="text-[9px] font-bold text-accent-secondary uppercase tracking-widest block mb-0.5">AI Recommendation</span>
                        <span className="text-text-primary">"{issue.suggestion}"</span>
                      </div>
                      <button
                        onClick={() => {
                          addToast("Copy suggestion text to builder clipboard!", "info");
                        }}
                        className="bg-accent-primary hover:bg-accent-primary/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-btn shrink-0"
                      >
                        Copy Edit
                      </button>
                    </div>
                  </div>
                ))}
                {report.grammarIssues.length === 0 && <p className="text-xs text-text-secondary italic py-2">No formatting or passive tone errors identified.</p>}
              </div>
            </div>

            {/* Top Suggestions Checklist */}
            <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Priority Improvements Actions checklist</h3>
              
              <div className="space-y-3">
                {report.suggestions.map((sug, i) => (
                  <div key={i} className="flex gap-3 p-3.5 bg-background-elevated/40 border border-border-subtle rounded-card">
                    <span className="text-xs font-bold text-accent-primary font-mono select-none">0{i+1}.</span>
                    <p className="text-xs text-text-primary leading-relaxed">{sug}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={() => setReport(null)}
                  className="bg-background-elevated hover:bg-background-elevated/85 border border-border-subtle text-text-primary text-xs font-bold px-4 py-2 rounded-btn transition-all"
                >
                  Analyze another Resume
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
