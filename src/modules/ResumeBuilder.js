import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { 
  Sparkles, Save, FileText, Plus, Trash2, 
  Download, RefreshCw, ZoomIn, ZoomOut, Check, 
  ArrowRight, Award, Eye, AlertCircle, CheckCircle,
  Upload, X
} from 'lucide-react';

export default function ResumeBuilder() {
  const { getAuthHeaders, addToast, user, fetchProfile } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resume, setResume] = useState(null);
  const [activeFormTab, setActiveFormTab] = useState('Personal');
  const [zoom, setZoom] = useState(0.85);

  // AI & Analysis States
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  
  // Bullet Rewrite State
  const [rewriteTarget, setRewriteTarget] = useState({ section: '', index: '', text: '' });
  const [rewriteOptions, setRewriteOptions] = useState(null);
  const [rewriting, setRewriting] = useState(false);

  // Portfolio Generator States
  const [portfolioHtml, setPortfolioHtml] = useState('');
  const [generatingPortfolio, setGeneratingPortfolio] = useState(false);
  const [portfolioViewMode, setPortfolioViewMode] = useState('Preview');

  // Resume Upload & ATS Analyzer States
  const [builderMode, setBuilderMode] = useState('manual'); // 'manual' or 'upload'
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadText, setUploadText] = useState('');
  const [uploadJd, setUploadJd] = useState('');
  const [uploadAnalyzing, setUploadAnalyzing] = useState(false);
  const [uploadReport, setUploadReport] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleFile = (file) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown',
      'application/rtf',
      'application/vnd.oasis.opendocument.text'
    ];
    const ext = file.name.split('.').pop().toLowerCase();
    const allowedExts = ['pdf', 'docx', 'doc', 'txt', 'rtf', 'odt', 'md'];
    
    if (allowedTypes.includes(file.type) || allowedExts.includes(ext)) {
      setUploadFile(file);
      setUploadText('');
      addToast(`Selected file: ${file.name}`, "success");
    } else {
      addToast("Unsupported format. Please upload PDF, DOCX, DOC, TXT, RTF, ODT, or MD.", "error");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAnalyze = async () => {
    if (!uploadFile && !uploadText.trim()) {
      addToast("Please upload a file or paste your resume text.", "warning");
      return;
    }
    setUploadAnalyzing(true);
    addToast("Analyzing resume file & matching job description...", "info");
    
    try {
      let payload = {
        fileName: uploadFile ? uploadFile.name : 'pasted_resume.txt',
        mimeType: uploadFile ? uploadFile.type : 'text/plain',
        jobDescription: uploadJd
      };
      
      if (uploadFile) {
        const reader = new FileReader();
        const filePromise = new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = (error) => reject(error);
        });
        reader.readAsDataURL(uploadFile);
        const base64Data = await filePromise;
        payload.fileData = base64Data;
      } else {
        payload.text = uploadText;
      }
      
      const res = await fetch('/api/resumes/upload-and-analyze', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const data = await res.json();
        setUploadReport(data.report);
        addToast("ATS scorecard successfully generated!", "success");
        await fetchProfile();
        if (data.leveledUp) addToast("Level Up!", "gold");
      } else {
        const errData = await res.json();
        addToast(errData.message || "Failed to analyze resume file.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Error communicating with resume analyzer endpoint.", "error");
    } finally {
      setUploadAnalyzing(false);
    }
  };

  // Fetch resume and existing reports
  const fetchResumeAndReport = async () => {
    try {
      const res = await fetch('/api/resumes', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setResume(data[0]);
          const reportRes = await fetch(`/api/resumes/${data[0].id}/report`, { headers: getAuthHeaders() });
          if (reportRes.ok) {
            const reportData = await reportRes.json();
            setReport(reportData);
          }
        } else {
          createDefaultResume();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultResume = async () => {
    const defaultData = {
      title: "My Placement Resume",
      personalInfo: {
        name: "Alex Mercer",
        email: "alex.mercer@gmail.com",
        phone: "+1 (555) 019-2834",
        linkedin: "linkedin.com/in/alexmercer",
        github: "github.com/alexmercer",
        portfolio: "alexmercer.dev",
        summary: "Full-Stack Developer with experience building responsive web applications and AI-driven platforms. Highly skilled in React, Node.js, and Python."
      },
      education: [
        { id: 'edu-1', school: "Tech Institute of Technology", degree: "B.S. in Computer Science", location: "San Francisco, CA", date: "2022 - 2026", gpa: "3.8/4.0" }
      ],
      experience: [
        { id: 'exp-1', company: "ByteCraft Solutions", role: "Frontend Developer Intern", location: "Remote", date: "Summer 2025", description: "Worked in a team to build UI elements.\nFixed responsiveness bugs across 15+ pages.\nCollaborated on REST API integration using React." }
      ],
      projects: [
        { id: 'proj-1', title: "DevRank - Developer Portfolio Engine", date: "Fall 2025", technologies: "React, Express, Tailwind CSS", description: "Created an open-source tool for developer statistics.\nIntegrated GitHub GraphQL API to fetch user profile data.\nBuilt dynamic charts and graphs displaying language distributions." }
      ],
      skills: ["React", "JavaScript", "HTML5", "CSS3", "Node.js", "Express", "Tailwind CSS", "Git"],
      certifications: ["AWS Certified Cloud Practitioner", "Meta Front-End Developer Certificate"]
    };

    try {
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(defaultData)
      });
      if (res.ok) {
        const data = await res.json();
        setResume(data.resume);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchResumeAndReport();
  }, []);

  const handleSave = async () => {
    if (!resume) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/resumes/${resume.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(resume)
      });
      if (res.ok) {
        const data = await res.json();
        setResume(data.resume);
        addToast("Resume saved successfully!", "success");
      }
    } catch (err) {
      addToast("Failed to save resume.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Run ATS compliance review
  const runAtsAnalysis = async () => {
    if (!resume) return;
    setAnalyzing(true);
    addToast("Initializing AI ATS compliance check...", "info");

    try {
      // Auto-save changes first
      await fetch(`/api/resumes/${resume.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(resume)
      });

      const res = await fetch(`/api/resumes/${resume.id}/analyze`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ jobDescription })
      });

      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
        addToast("ATS analysis compiled successfully!", "success");
        await fetchProfile(); // Sync readiness scores
        setActiveFormTab('AI Insights'); // Activate insights tab
        if (data.leveledUp) addToast("Level Up!", "gold");
      }
    } catch (err) {
      addToast("Failed to analyze resume.", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  // Input bindings
  const updatePersonalInfo = (field, val) => {
    setResume({
      ...resume,
      personalInfo: { ...resume.personalInfo, [field]: val }
    });
  };

  const handleTemplateChange = (newTemplate) => {
    setResume({
      ...resume,
      template: newTemplate
    });
  };

  const handleLayoutChange = (newLayout) => {
    setResume({
      ...resume,
      layout: newLayout,
      template: newLayout === 'ats' ? 'ats' : resume.template
    });
  };

  const updateListField = (section, id, field, val) => {
    const list = [...resume[section]];
    const idx = list.findIndex(item => item.id === id);
    if (idx !== -1) {
      list[idx][field] = val;
      setResume({ ...resume, [section]: list });
    }
  };

  const addItem = (section) => {
    const newItem = section === 'education' ? {
      id: 'edu-' + Math.random().toString(36).substring(2, 9),
      school: '', degree: '', location: '', date: '', gpa: ''
    } : {
      id: 'item-' + Math.random().toString(36).substring(2, 9),
      company: '', role: '', location: '', date: '', description: '', title: '', technologies: ''
    };
    setResume({
      ...resume,
      [section]: [...resume[section], newItem]
    });
  };

  const removeItem = (section, id) => {
    setResume({
      ...resume,
      [section]: resume[section].filter(item => item.id !== id)
    });
  };

  // Trigger AI Bullet Rewrite
  const triggerAiRewrite = async (section, index, text) => {
    if (!text.trim()) {
      addToast("Please enter some description first", "info");
      return;
    }
    setRewriteTarget({ section, index, text });
    setRewriting(true);
    setRewriteOptions(null);

    try {
      const res = await fetch(`/api/resumes/${resume.id}/rewrite-bullet`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ bullet: text })
      });
      if (res.ok) {
        const options = await res.json();
        setRewriteOptions(options);
      }
    } catch (err) {
      addToast("AI rewrite failed.", "error");
    } finally {
      setRewriting(false);
    }
  };

  const applyRewrite = (chosenText) => {
    const { section, index } = rewriteTarget;
    updateListField(section, index, 'description', chosenText);
    setRewriteTarget({ section: '', index: '', text: '' });
    setRewriteOptions(null);
    addToast("AI suggestion applied!", "success");
  };

  const downloadPdf = () => {
    // Create a hidden iframe for print-based PDF rendering
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-1000';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    // Copy all style sheets and style elements from parent window to ensure CSS variables, fonts, and Tailwind styles carry over
    const head = doc.head || doc.getElementsByTagName('head')[0];
    
    // Copy stylesheets
    Array.from(document.querySelectorAll('link[rel="stylesheet"]')).forEach(link => {
      const newLink = doc.createElement('link');
      newLink.rel = 'stylesheet';
      newLink.href = link.href;
      head.appendChild(newLink);
    });

    // Copy CSS style blocks
    Array.from(document.querySelectorAll('style')).forEach(style => {
      const newStyle = doc.createElement('style');
      newStyle.textContent = style.textContent;
      head.appendChild(newStyle);
    });

    // Add print-specific page styling to lock layouts
    const pageStyle = doc.createElement('style');
    pageStyle.textContent = `
      @page {
        size: A4;
        margin: 0 !important;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }
      #resume-print-area {
        width: 210mm !important;
        min-height: 297mm !important;
        max-height: 297mm !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        padding: 12mm 15mm !important;
        margin: 0 auto !important;
        transform: none !important;
        box-shadow: none !important;
        background: white !important;
        color: black !important;
        display: block !important;
      }
      /* Standardize list indentation for bullet points */
      #resume-print-area .relative.pl-3\\.5 {
        padding-left: 20px !important;
      }
      #resume-print-area * {
        line-height: 1.45 !important;
      }
      /* Avoid breaking section blocks across pages */
      #resume-print-area > div {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    `;
    head.appendChild(pageStyle);

    // Copy target print area DOM clone
    const printArea = document.getElementById('resume-print-area');
    const clone = printArea.cloneNode(true);
    
    // Remove the scale transform from the print layout clone
    clone.style.transform = 'none';
    clone.style.width = '210mm';
    clone.style.minHeight = '297mm';
    clone.style.boxShadow = 'none';

    doc.body.appendChild(clone);

    // Wait for styling/font resources to calculate and trigger native print dialog
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  const renderHeading = (text) => {
    const isModern = resume?.template === 'modern';
    const isMinimal = resume?.template === 'minimal';
    const isAts = resume?.template === 'ats';
    if (isModern) {
      return (
        <h3 className="text-xs font-bold uppercase tracking-widest text-accent-primary border-b border-accent-primary/20 pb-1 font-sans">
          {text}
        </h3>
      );
    }
    if (isMinimal) {
      return (
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 border-l-4 border-gray-800 pl-2.5 pb-0.5 font-sans">
          {text}
        </h3>
      );
    }
    if (isAts) {
      return (
        <h3 className="text-xs font-bold uppercase tracking-wider text-black border-b border-gray-900 pb-0.5 mt-2.5 mb-1.5 font-sans">
          {text}
        </h3>
      );
    }
    return (
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 border-b border-gray-200 pb-0.5 font-sans">
        {text}
      </h3>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-accent-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[90vh] bg-background-primary p-4 md:p-6 gap-6 print-parent-collapse">
      
      {/* Mode Switcher Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-background-surface border border-border-subtle rounded-card p-4 md:p-5 gap-4 no-print select-none">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-accent-primary/10 rounded-lg text-accent-primary">
            <FileText className="w-5.5 h-5.5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-text-primary tracking-wide uppercase font-display">Resume Suite & ATS Optimizer</h2>
            <p className="text-[11px] text-text-secondary mt-0.5">Build a high-performance profile from scratch or analyze existing documents for compliance.</p>
          </div>
        </div>
        <div className="flex border border-border-subtle bg-background-elevated rounded-btn p-1 overflow-hidden select-none w-full md:w-auto">
          <button
            onClick={() => setBuilderMode('manual')}
            className={`flex-grow md:flex-grow-0 px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-btn transition-all duration-200 ${
              builderMode === 'manual' 
                ? 'bg-accent-primary text-white shadow-md' 
                : 'text-text-secondary hover:text-text-primary hover:bg-background-surface/30'
            }`}
          >
            Manual Builder
          </button>
          <button
            onClick={() => setBuilderMode('upload')}
            className={`flex-grow md:flex-grow-0 px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-btn transition-all duration-200 ${
              builderMode === 'upload' 
                ? 'bg-accent-primary text-white shadow-md' 
                : 'text-text-secondary hover:text-text-primary hover:bg-background-surface/30'
            }`}
          >
            ATS File Scan
          </button>
        </div>
      </div>

      {builderMode === 'manual' ? (
        <div className="flex flex-col lg:flex-row gap-6 print-parent-collapse w-full flex-grow">
      
      {/* Print styles for window.print shortcut compatibility */}
      <style>{`
        @media print {
          /* Hide all non-printable dashboard and editor elements */
          aside, header, nav, button, select, textarea, input,
          .no-print,
          .fixed,
          div.w-full.lg\\:w-\\[44\\%\\] {
            display: none !important;
          }

          /* Collapse targeted parents only to preserve resume grid/flex layout */
          html, body, #root, #root > div, #root > div > div, main,
          .print-parent-collapse {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            display: block !important;
            position: static !important;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            width: auto !important;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Hide other page parts */
          body * {
            visibility: hidden;
          }
          
          /* Keep resume text and print container visible */
          #resume-print-area, #resume-print-area * {
            visibility: visible;
          }
          
          /* Anchor print container to standard A4 specifications */
          #resume-print-area {
            position: static !important;
            width: 210mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            padding: 12mm 15mm !important;
            margin: 0 auto !important;
            background: white !important;
            color: black !important;
            transform: none !important;
            box-shadow: none !important;
            display: block !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          /* Enforce list spacing */
          #resume-print-area .relative.pl-3\\.5 {
            padding-left: 20px !important;
          }

          #resume-print-area * {
            line-height: 1.45 !important;
          }

          /* Prevent splitting sections across pages */
          #resume-print-area > div {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
        
        @page {
          size: A4;
          margin: 0 !important;
        }
      `}</style>

      {/* Left Pane - Forms & AI Insights Tabs (44% width) */}
      <div className="w-full lg:w-[44%] flex flex-col bg-background-surface border border-border-subtle rounded-card overflow-hidden">
        
        {/* Navigation Tabs */}
        <div className="flex bg-background-elevated border-b border-border-subtle overflow-x-auto">
          {['Personal', 'Education', 'Experience', 'Projects', 'Skills', 'AI Insights', 'Portfolio'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFormTab(tab)}
              className={`px-4 py-3.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap flex items-center gap-1 ${
                activeFormTab === tab 
                  ? 'border-accent-primary text-text-primary bg-background-primary/30' 
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {(tab === 'AI Insights' || tab === 'Portfolio') && <Sparkles className="w-3.5 h-3.5 text-accent-primary shrink-0" />}
              {tab}
            </button>
          ))}
        </div>

        {/* Editor & Insights Body */}
        <div className="p-6 flex-grow overflow-y-auto space-y-5 max-h-[620px]">
          
          {/* PERSONAL INFO TAB */}
          {activeFormTab === 'Personal' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">Personal Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Candidate Name</label>
                  <input
                    type="text"
                    className="w-full bg-background-elevated border border-border-subtle rounded-input px-3.5 py-2 text-xs focus:outline-none focus:border-accent-primary text-text-primary font-semibold"
                    value={resume.personalInfo.name || ''}
                    onChange={(e) => updatePersonalInfo('name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Email Address</label>
                  <input
                    type="email"
                    className="w-full bg-background-elevated border border-border-subtle rounded-input px-3.5 py-2 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                    value={resume.personalInfo.email || ''}
                    onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    className="w-full bg-background-elevated border border-border-subtle rounded-input px-3.5 py-2 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                    value={resume.personalInfo.phone || ''}
                    onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">LinkedIn URL</label>
                  <input
                    type="text"
                    className="w-full bg-background-elevated border border-border-subtle rounded-input px-3.5 py-2 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                    value={resume.personalInfo.linkedin || ''}
                    onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">GitHub URL</label>
                  <input
                    type="text"
                    className="w-full bg-background-elevated border border-border-subtle rounded-input px-3.5 py-2 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                    value={resume.personalInfo.github || ''}
                    onChange={(e) => updatePersonalInfo('github', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Portfolio URL</label>
                  <input
                    type="text"
                    className="w-full bg-background-elevated border border-border-subtle rounded-input px-3.5 py-2 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                    value={resume.personalInfo.portfolio || ''}
                    onChange={(e) => updatePersonalInfo('portfolio', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Professional Summary</label>
                  <textarea
                    rows={3}
                    placeholder="Short 2-3 sentence overview of your skills and career objectives..."
                    className="w-full bg-background-elevated border border-border-subtle rounded-input px-3.5 py-2 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                    value={resume.personalInfo.summary || ''}
                    onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* EDUCATION TAB */}
          {activeFormTab === 'Education' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Education Credentials</h3>
                <button
                  onClick={() => addItem('education')}
                  className="bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-[10px] font-bold px-3 py-1.5 rounded-btn flex items-center gap-1 hover:bg-accent-primary/20"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Degree
                </button>
              </div>

              {resume.education.map((edu) => (
                <div key={edu.id} className="p-4 bg-background-elevated rounded-card border border-border-subtle relative space-y-3">
                  <button
                    onClick={() => removeItem('education', edu.id)}
                    className="absolute top-4 right-4 text-text-muted hover:text-accent-danger"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-1 uppercase tracking-widest">School / University</label>
                      <input
                        type="text"
                        className="w-full bg-background-surface border border-border-subtle rounded-input px-3 py-1.5 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                        value={edu.school}
                        onChange={(e) => updateListField('education', edu.id, 'school', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-1 uppercase tracking-widest">Degree Program</label>
                      <input
                        type="text"
                        className="w-full bg-background-surface border border-border-subtle rounded-input px-3 py-1.5 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                        value={edu.degree}
                        onChange={(e) => updateListField('education', edu.id, 'degree', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-1 uppercase tracking-widest">Date Duration</label>
                      <input
                        type="text"
                        className="w-full bg-background-surface border border-border-subtle rounded-input px-3 py-1.5 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                        value={edu.date}
                        onChange={(e) => updateListField('education', edu.id, 'date', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-1 uppercase tracking-widest">GPA Metrics</label>
                      <input
                        type="text"
                        className="w-full bg-background-surface border border-border-subtle rounded-input px-3 py-1.5 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                        value={edu.gpa}
                        onChange={(e) => updateListField('education', edu.id, 'gpa', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* EXPERIENCE TAB */}
          {activeFormTab === 'Experience' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Work Experience</h3>
                <button
                  onClick={() => addItem('experience')}
                  className="bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-[10px] font-bold px-3 py-1.5 rounded-btn flex items-center gap-1 hover:bg-accent-primary/20"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Experience
                </button>
              </div>

              {resume.experience.map((exp) => (
                <div key={exp.id} className="p-4 bg-background-elevated rounded-card border border-border-subtle relative space-y-3">
                  <button
                    onClick={() => removeItem('experience', exp.id)}
                    className="absolute top-4 right-4 text-text-muted hover:text-accent-danger"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-1 uppercase tracking-widest">Company Name</label>
                      <input
                        type="text"
                        className="w-full bg-background-surface border border-border-subtle rounded-input px-3 py-1.5 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                        value={exp.company}
                        onChange={(e) => updateListField('experience', exp.id, 'company', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-1 uppercase tracking-widest">Role Title</label>
                      <input
                        type="text"
                        className="w-full bg-background-surface border border-border-subtle rounded-input px-3 py-1.5 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                        value={exp.role}
                        onChange={(e) => updateListField('experience', exp.id, 'role', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-text-secondary mb-1 uppercase tracking-widest">Date / Location</label>
                      <input
                        type="text"
                        className="w-full bg-background-surface border border-border-subtle rounded-input px-3 py-1.5 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                        value={exp.date}
                        onChange={(e) => updateListField('experience', exp.id, 'date', e.target.value)}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest">Responsibilities</label>
                        <button
                          onClick={() => triggerAiRewrite('experience', exp.id, exp.description)}
                          className="text-accent-primary text-[9px] font-bold flex items-center gap-0.5 hover:underline"
                        >
                          <Sparkles className="w-3 h-3 animate-pulse" /> ✨ AI Rewrite
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        className="w-full bg-background-surface border border-border-subtle rounded-input px-3 py-2 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                        value={exp.description}
                        onChange={(e) => updateListField('experience', exp.id, 'description', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeFormTab === 'Projects' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Key Projects</h3>
                <button
                  onClick={() => addItem('projects')}
                  className="bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-[10px] font-bold px-3 py-1.5 rounded-btn flex items-center gap-1 hover:bg-accent-primary/20"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Project
                </button>
              </div>

              {resume.projects.map((proj) => (
                <div key={proj.id} className="p-4 bg-background-elevated rounded-card border border-border-subtle relative space-y-3">
                  <button
                    onClick={() => removeItem('projects', proj.id)}
                    className="absolute top-4 right-4 text-text-muted hover:text-accent-danger"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-1 uppercase tracking-widest">Project Name</label>
                      <input
                        type="text"
                        className="w-full bg-background-surface border border-border-subtle rounded-input px-3 py-1.5 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                        value={proj.title}
                        onChange={(e) => updateListField('projects', proj.id, 'title', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-1 uppercase tracking-widest">Technologies</label>
                      <input
                        type="text"
                        className="w-full bg-background-surface border border-border-subtle rounded-input px-3 py-1.5 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                        value={proj.technologies}
                        onChange={(e) => updateListField('projects', proj.id, 'technologies', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest">Description</label>
                        <button
                          onClick={() => triggerAiRewrite('projects', proj.id, proj.description)}
                          className="text-accent-primary text-[9px] font-bold flex items-center gap-0.5 hover:underline"
                        >
                          <Sparkles className="w-3 h-3" /> ✨ AI Rewrite
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        className="w-full bg-background-surface border border-border-subtle rounded-input px-3 py-2 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                        value={proj.description}
                        onChange={(e) => updateListField('projects', proj.id, 'description', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SKILLS TAB */}
          {activeFormTab === 'Skills' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Skills & Competencies</h3>
              <p className="text-[11px] text-text-secondary">List your primary technical skills separated by commas:</p>
              <textarea
                rows={6}
                placeholder="React, JavaScript, Node.js, Express, Docker, Git..."
                className="w-full bg-background-elevated border border-border-subtle rounded-input p-4 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                value={resume.skills.join(', ')}
                onChange={(e) => setResume({ ...resume, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              />
            </div>
          )}

          {/* AI INSIGHTS & ATS TAB */}
          {activeFormTab === 'AI Insights' && (
            <div className="space-y-5">
              
              {/* Analysis Configuration */}
              <div className="p-4 bg-background-elevated border border-border-subtle rounded-card space-y-3">
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest">Target Job Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Paste vacancy requirements here to check for missing keywords..."
                  className="w-full bg-background-surface border border-border-subtle rounded-input p-3 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
                
                <button
                  onClick={runAtsAnalysis}
                  disabled={analyzing}
                  className="w-full bg-accent-primary hover:bg-accent-primary/95 text-white py-2 rounded-btn font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  {analyzing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Analyze ATS & Match Keywords
                    </>
                  )}
                </button>
              </div>

              {/* Analysis Results */}
              {report ? (
                <div className="space-y-5">
                  
                  {/* ATS Score circle */}
                  <div className="flex items-center gap-5 p-4 bg-background-elevated/40 border border-border-subtle rounded-card">
                    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="38" className="stroke-background-elevated" strokeWidth="6" fill="transparent" />
                        <circle 
                          cx="48" cy="48" r="38" 
                          className="stroke-accent-primary gauge-ring-path" 
                          strokeWidth="6" 
                          fill="transparent" 
                          strokeDasharray={238}
                          strokeDashoffset={238 - (238 * report.score) / 100}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold font-mono text-text-primary">{report.score}</span>
                        <span className="text-[7px] text-text-secondary uppercase">ATS Score</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-accent-secondary uppercase tracking-wider">ATS Score Calibrated</span>
                      <h4 className="text-xs font-bold text-text-primary">Grade Tier: {report.grade}</h4>
                      <p className="text-[11px] text-text-secondary leading-normal">
                        Based on structural density, section completeness, and keyword matching.
                      </p>
                    </div>
                  </div>

                  {/* Recruiter 7 second simulator */}
                  <div className="p-4 bg-accent-primary/5 border border-accent-primary/20 rounded-card">
                    <span className="text-[9px] font-bold text-accent-primary uppercase tracking-widest block mb-1">Recruiter 7-Second Simulation</span>
                    <p className="text-xs text-text-secondary leading-relaxed italic">"{report.recruiterSimulation}"</p>
                  </div>

                  {/* Missing Keywords chips */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Missing Job Keywords</span>
                    <div className="flex flex-wrap gap-1.5">
                      {report.keywords.missing.map((kw, i) => (
                        <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-accent-danger/10 border border-accent-danger/25 text-accent-danger">
                          {kw}
                        </span>
                      ))}
                      {report.keywords.missing.length === 0 && <span className="text-xs text-accent-secondary italic">Perfect keyword match!</span>}
                    </div>
                  </div>

                  {/* Grammar Audits list */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Grammar & Phrasing Audits</span>
                    <div className="divide-y divide-border-subtle">
                      {report.grammarIssues.map((issue, idx) => (
                        <div key={idx} className="py-3 first:pt-0 last:pb-0 space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="font-bold text-text-primary">Line: <span className="text-text-muted font-normal">"{issue.line}"</span></span>
                            <span className="text-[9px] text-accent-danger font-bold uppercase">passive</span>
                          </div>
                          <p className="text-[11px] text-text-secondary">{issue.issue}</p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(issue.suggestion);
                              addToast("Copied suggestion text to clipboard!", "info");
                            }}
                            className="bg-background-elevated border border-border-subtle text-text-primary px-3 py-1 rounded text-[10px] font-semibold hover:bg-background-surface"
                          >
                            Copy Suggestion: "{issue.suggestion}"
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top suggestions */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Priority Checklist</span>
                    <ul className="space-y-2 text-xs text-text-secondary">
                      {report.suggestions.map((sug, i) => (
                        <li key={i} className="flex gap-2 p-2 bg-background-elevated/30 border border-border-subtle rounded">
                          <span className="text-accent-primary font-bold">{i+1}.</span>
                          <span>{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              ) : (
                <div className="text-center py-6 text-xs text-text-muted italic">
                  No analysis report generated yet. Click the button above to execute a scan.
                </div>
              )}

            </div>
          )}

          {/* PORTFOLIO TAB */}
          {activeFormTab === 'Portfolio' && (
            <div className="space-y-4">
              <div className="p-4 bg-background-elevated border border-border-subtle rounded-card space-y-3 text-left">
                <span className="text-[9px] font-bold text-accent-secondary uppercase tracking-widest block font-mono">Deployable Output</span>
                <h4 className="text-xs font-bold text-text-primary">One-Click Portfolio Site Generator</h4>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Export your compiled professional resume as a complete premium landing portfolio site code styled with Tailwind CSS.
                </p>
                <button
                  onClick={async () => {
                    setGeneratingPortfolio(true);
                    addToast("Orchestrating AI Portfolio Builder...", "info");
                    try {
                      const res = await fetch('/api/portfolio/generate', {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ resumeId: resume.id })
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setPortfolioHtml(data.html);
                        addToast("Stunning developer portfolio website built!", "success");
                        setPortfolioViewMode('Preview');
                      }
                    } catch (err) {
                      addToast("Failed to compile portfolio.", "error");
                    } finally {
                      setGeneratingPortfolio(false);
                    }
                  }}
                  disabled={generatingPortfolio}
                  className="w-full bg-accent-secondary hover:bg-accent-secondary/95 text-background-primary py-2 rounded-btn font-bold text-xs flex items-center justify-center gap-1.5 transition-all transform active:scale-95 disabled:opacity-50 font-mono"
                >
                  {generatingPortfolio ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" /> Compile Portfolio Website
                    </>
                  )}
                </button>
              </div>

              {portfolioHtml && (
                <div className="space-y-3 pt-2 text-left">
                  <div className="flex border border-border-subtle bg-background-elevated rounded overflow-hidden select-none">
                    {['Preview', 'Code Source'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => setPortfolioViewMode(mode)}
                        className={`flex-grow text-center py-2 text-[10px] font-bold uppercase transition-all ${
                          portfolioViewMode === mode 
                            ? 'bg-accent-primary text-white' 
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  {portfolioViewMode === 'Preview' ? (
                    <div className="border border-border-subtle rounded-card bg-white overflow-hidden h-96 relative">
                      <iframe 
                        title="Portfolio Live Preview" 
                        srcDoc={portfolioHtml} 
                        className="w-full h-full border-none"
                      />
                    </div>
                  ) : (
                    <textarea
                      readOnly
                      rows={12}
                      className="w-full bg-[#0E0F14] border border-border-subtle rounded-input p-3 text-[10px] font-mono text-cyan-400 focus:outline-none select-text whitespace-pre"
                      value={portfolioHtml}
                    />
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(portfolioHtml);
                        addToast("HTML source code copied to clipboard!", "success");
                      }}
                      className="flex-grow bg-background-elevated hover:bg-[#1A1A26] border border-border-subtle text-text-primary py-2 rounded text-[10px] font-bold transition-all"
                    >
                      Copy Source Code
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([portfolioHtml], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'index.html';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        addToast("Downloaded index.html portfolio artifact!", "success");
                      }}
                      className="flex-grow bg-accent-primary hover:bg-accent-primary/95 text-white py-2 rounded text-[10px] font-bold transition-all"
                    >
                      Download HTML
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Left pane actions footer */}
        <div className="p-4 bg-background-elevated border-t border-border-subtle flex gap-3 mt-auto select-none">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-grow bg-background-surface hover:bg-background-elevated border border-border-subtle text-text-primary py-2 rounded-btn font-semibold text-xs flex items-center justify-center gap-1.5 transition-all transform active:scale-95 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
          </button>
          
          <button
            onClick={runAtsAnalysis}
            disabled={analyzing}
            className="flex-grow bg-accent-primary hover:bg-accent-primary/95 text-white py-2 rounded-btn font-bold text-xs flex items-center justify-center gap-1.5 transition-all transform active:scale-95 disabled:opacity-50"
          >
            {analyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><Sparkles className="w-3.5 h-3.5" /> AI Scan Resume</>}
          </button>
        </div>

      </div>

      {/* Right Pane - Live A4 preview & heatmap (56% width) */}
      <div className="flex-grow flex flex-col items-center bg-background-surface border border-border-subtle rounded-card p-6 min-h-[500px] overflow-hidden relative print-parent-collapse">
        
        {/* Preview Toolbar */}
        <div className="w-full flex justify-between items-center border-b border-border-subtle pb-4 mb-6 select-none no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-4.5 h-4.5 text-accent-primary" />
            <span className="text-xs font-semibold text-text-primary">Live A4 Document Workspace</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Format Selector dropdown */}
            <div className="flex items-center gap-1.5 border-r border-border-subtle pr-3.5 mr-0.5">
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Format:</span>
              <select
                value={resume?.layout || 'chronological'}
                onChange={(e) => handleLayoutChange(e.target.value)}
                className="bg-[#1A1A26] border border-border-subtle text-text-primary text-[10px] font-bold px-2 py-1 rounded focus:outline-none focus:border-accent-primary cursor-pointer hover:border-text-muted transition-all"
              >
                <option value="chronological">Chronological (Standard)</option>
                <option value="functional">Functional (Skill-Based)</option>
                <option value="combination">Combination (Hybrid)</option>
                <option value="targeted">Targeted (Role Focused)</option>
                <option value="ats">ATS-Friendly Layout</option>
              </select>
            </div>

            {/* Template Selector dropdown */}
            <div className="flex items-center gap-1.5 border-r border-border-subtle pr-3.5 mr-0.5">
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Style:</span>
              <select
                value={resume?.template || 'classic'}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="bg-[#1A1A26] border border-border-subtle text-text-primary text-[10px] font-bold px-2 py-1 rounded focus:outline-none focus:border-accent-primary cursor-pointer hover:border-text-muted transition-all"
              >
                <option value="classic">Classic Serif</option>
                <option value="modern">Modern Sans</option>
                <option value="minimal">Minimal Bold</option>
                <option value="ats">ATS Plain Sans</option>
              </select>
            </div>

            {/* Heatmap overlay toggle */}
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`text-[10px] font-bold px-2.5 py-1.5 rounded-btn flex items-center gap-1.5 transition-all border ${
                showHeatmap 
                  ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary' 
                  : 'bg-background-elevated border-border-subtle text-text-secondary hover:text-text-primary'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> {showHeatmap ? 'Eye-Tracking Overlay: ON' : 'Recruiter Heatmap'}
            </button>

            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-background-elevated border border-border-subtle rounded px-2 py-1">
              <button onClick={() => setZoom(Math.max(zoom - 0.05, 0.5))} className="text-text-secondary hover:text-text-primary p-0.5"><ZoomOut className="w-3.5 h-3.5" /></button>
              <span className="text-[10px] font-bold text-text-primary font-mono px-1.5">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(Math.min(zoom + 0.05, 1.2))} className="text-text-secondary hover:text-text-primary p-0.5"><ZoomIn className="w-3.5 h-3.5" /></button>
            </div>

            {/* PDF export */}
            <button
              onClick={downloadPdf}
              className="bg-accent-secondary text-background-primary hover:bg-accent-secondary/95 text-xs font-bold px-3.5 py-1.5 rounded-btn flex items-center gap-1 transform active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>
        </div>

        {/* Live A4 sheet with absolute heatmap overlay */}
        <div className="flex-grow overflow-auto w-full flex justify-center p-2 relative print-parent-collapse">
          <div className="relative print-parent-collapse">
            
            {/* Translucent Heatmap Overlays */}
            {showHeatmap && (
              <div className="absolute inset-0 z-20 pointer-events-none mix-blend-multiply opacity-65 w-full h-full" style={{ width: '210mm', minHeight: '297mm' }}>
                {/* Hotspot 1: Header name */}
                <div className="absolute top-[3%] left-[25%] right-[25%] h-16 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,0,0,0.55) 0%, rgba(255,200,0,0.2) 65%, transparent 100%)' }}></div>
                {/* Hotspot 2: First job role */}
                <div className="absolute top-[26%] left-[12%] w-[420px] h-16 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,0,0,0.45) 0%, rgba(255,180,0,0.15) 55%, transparent 100%)' }}></div>
                {/* Hotspot 3: First project title */}
                <div className="absolute top-[52%] left-[15%] w-[380px] h-14 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,100,0,0.35) 0%, rgba(255,200,0,0.1) 50%, transparent 100%)' }}></div>
                {/* Hotspot 4: Skills list */}
                <div className="absolute top-[76%] left-[12%] w-[500px] h-12 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,120,0,0.25) 0%, rgba(255,220,0,0.05) 50%, transparent 100%)' }}></div>
              </div>
            )}

            {/* A4 Document sheet */}
            <div 
              id="resume-print-area"
              className={`resume-a4-preview p-[12mm_15mm] text-left select-text text-xs ${
                resume?.template === 'ats' ? 'font-sans space-y-2 text-black bg-white' :
                resume?.template === 'modern' ? 'font-sans space-y-4' : 
                resume?.template === 'minimal' ? 'font-sans space-y-3' : 
                'font-serif space-y-3.5'
              }`}
              style={{ transform: `scale(${zoom})` }}
            >
              {/* Header */}
              {(!resume?.template || resume.template === 'classic') && (
                <div className="text-center space-y-1 pb-2 border-b border-gray-300">
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">{resume.personalInfo.name || 'Your Name'}</h1>
                  <div className="flex justify-center flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-600 font-sans">
                    {[
                      resume.personalInfo.phone && `📞 ${resume.personalInfo.phone}`,
                      resume.personalInfo.email && `✉ ${resume.personalInfo.email}`,
                      resume.personalInfo.linkedin && `🔗 ${resume.personalInfo.linkedin}`,
                      resume.personalInfo.github && `🔗 ${resume.personalInfo.github}`,
                      resume.personalInfo.portfolio && `🌐 ${resume.personalInfo.portfolio}`
                    ].filter(Boolean).map((item, idx, arr) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span>{item}</span>
                        {idx < arr.length - 1 && <span className="text-gray-400 select-none ml-1">•</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resume?.template === 'modern' && (
                <div className="text-left space-y-1.5 pb-3.5 border-b-2 border-accent-primary/20">
                  <h1 className="text-3xl font-extrabold text-accent-primary tracking-tight font-sans">{resume.personalInfo.name || 'Your Name'}</h1>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-600 font-sans font-medium">
                    {[
                      resume.personalInfo.phone && `📞 ${resume.personalInfo.phone}`,
                      resume.personalInfo.email && `✉ ${resume.personalInfo.email}`,
                      resume.personalInfo.linkedin && `🔗 ${resume.personalInfo.linkedin}`,
                      resume.personalInfo.github && `🔗 ${resume.personalInfo.github}`,
                      resume.personalInfo.portfolio && `🌐 ${resume.personalInfo.portfolio}`
                    ].filter(Boolean).map((item, idx, arr) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span>{item}</span>
                        {idx < arr.length - 1 && <span className="text-accent-primary/40 font-bold">|</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resume?.template === 'minimal' && (
                <div className="flex justify-between items-end pb-3 border-b border-gray-900">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">{resume.personalInfo.name || 'Your Name'}</h1>
                  </div>
                  <div className="text-right text-[9px] text-gray-600 space-y-0.5 font-sans">
                    <div className="flex justify-end gap-2">
                      {resume.personalInfo.phone && <span>{resume.personalInfo.phone}</span>}
                      {resume.personalInfo.email && <span>• {resume.personalInfo.email}</span>}
                    </div>
                    <div className="flex justify-end gap-2">
                      {resume.personalInfo.linkedin && <span>LinkedIn: {resume.personalInfo.linkedin}</span>}
                      {resume.personalInfo.github && <span>GitHub: {resume.personalInfo.github}</span>}
                      {resume.personalInfo.portfolio && <span>Web: {resume.personalInfo.portfolio}</span>}
                    </div>
                  </div>
                </div>
              )}

              {resume?.template === 'ats' && (
                <div className="text-left space-y-1.5 pb-2 border-b border-gray-900">
                  <h1 className="text-xl font-bold text-black tracking-tight font-sans uppercase">{resume.personalInfo.name || 'Your Name'}</h1>
                  <div className="flex flex-wrap gap-x-2 text-[10px] text-gray-800 font-sans leading-normal font-normal">
                    {[
                      resume.personalInfo.phone && `Phone: ${resume.personalInfo.phone}`,
                      resume.personalInfo.email && `Email: ${resume.personalInfo.email}`,
                      resume.personalInfo.linkedin && `LinkedIn: ${resume.personalInfo.linkedin}`,
                      resume.personalInfo.github && `GitHub: ${resume.personalInfo.github}`,
                      resume.personalInfo.portfolio && `Portfolio: ${resume.personalInfo.portfolio}`
                    ].filter(Boolean).map((item, idx, arr) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span>{item}</span>
                        {idx < arr.length - 1 && <span className="text-gray-400 font-bold select-none">|</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Professional Summary */}
              {resume.personalInfo.summary && (
                <div className="space-y-1.5">
                  {renderHeading("Summary")}
                  <p className="text-gray-700 leading-relaxed text-[11px]">
                    {resume.personalInfo.summary}
                  </p>
                </div>
              )}

              {/* Dynamic ordered sections based on layout */}
              {(() => {
                const order = {
                  chronological: ['experience', 'education', 'projects', 'skills', 'certifications'],
                  functional: ['skills', 'projects', 'education', 'experience', 'certifications'],
                  combination: ['skills', 'experience', 'projects', 'education', 'certifications'],
                  targeted: ['experience', 'projects', 'skills', 'education', 'certifications'],
                  ats: ['skills', 'education', 'projects', 'experience', 'certifications']
                }[resume?.layout || 'chronological'] || ['experience', 'education', 'projects', 'skills', 'certifications'];

                const sections = {
                  education: resume.education?.length > 0 && (
                    <div key="education" className="space-y-1.5">
                      {renderHeading("Education")}
                      {resume.education.map((edu) => (
                        <div key={edu.id} className="flex justify-between text-gray-800 text-[11px]">
                          <div>
                            <span className={`font-bold ${resume.template === 'ats' ? 'text-black' : resume.template === 'modern' ? 'text-accent-primary' : ''}`}>{edu.school || 'University'}</span> — <span>{edu.degree || 'Degree'}</span>
                          </div>
                          <div className="text-right text-gray-600 font-sans">
                            <span>{edu.date}</span> {edu.gpa && <span className="font-bold ml-1">({edu.gpa})</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                  experience: resume.experience?.length > 0 && (
                    <div key="experience" className="space-y-2">
                      {renderHeading("Experience")}
                      {resume.experience.map((exp) => (
                        <div key={exp.id} className="space-y-0.5 text-[11px]">
                          <div className="flex justify-between">
                            <div>
                              <span className={`font-bold ${resume.template === 'ats' ? 'text-black' : resume.template === 'modern' ? 'text-accent-primary' : 'text-gray-800'}`}>{exp.company || 'Company'}</span>, <span className="italic text-gray-700">{exp.role || 'Role'}</span>
                            </div>
                            <div className="text-right text-gray-600 font-sans">{exp.date}</div>
                          </div>
                          <div className={`text-gray-700 whitespace-pre-line leading-relaxed ${
                            resume.template === 'ats' ? 'pl-2' :
                            resume.template === 'modern' ? 'pl-3 border-l-2 border-accent-primary/15' : 
                            resume.template === 'minimal' ? 'pl-3 border-l-2 border-gray-300' : 'pl-3 border-l-2 border-gray-100'
                          }`}>
                            {exp.description?.split('\n').map((line, i) => (
                              <div key={i} className={`relative pl-3.5 before:content-['•'] before:absolute before:left-0 ${resume.template === 'ats' ? 'before:text-black text-black' : 'before:text-gray-400'}`}>
                                {line}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                  projects: resume.projects?.length > 0 && (
                    <div key="projects" className="space-y-2">
                      {renderHeading("Projects")}
                      {resume.projects.map((proj) => (
                        <div key={proj.id} className="space-y-0.5 text-[11px]">
                          <div className="flex justify-between">
                            <div>
                              <span className={`font-bold ${resume.template === 'ats' ? 'text-black' : resume.template === 'modern' ? 'text-accent-primary' : 'text-gray-800'}`}>{proj.title || 'Project'}</span>
                              {proj.technologies && <span className="text-gray-500 italic ml-1.5">({proj.technologies})</span>}
                            </div>
                            <div className="text-right text-gray-600 font-sans">{proj.date}</div>
                          </div>
                          <div className={`text-gray-700 whitespace-pre-line leading-relaxed ${
                            resume.template === 'ats' ? 'pl-2' :
                            resume.template === 'modern' ? 'pl-3 border-l-2 border-accent-primary/15' : 
                            resume.template === 'minimal' ? 'pl-3 border-l-2 border-gray-300' : 'pl-3 border-l-2 border-gray-100'
                          }`}>
                            {proj.description?.split('\n').map((line, i) => (
                              <div key={i} className={`relative pl-3.5 before:content-['•'] before:absolute before:left-0 ${resume.template === 'ats' ? 'before:text-black text-black' : 'before:text-gray-400'}`}>
                                {line}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                  skills: resume.skills?.length > 0 && (
                    <div key="skills" className="space-y-1.5">
                      {renderHeading("Skills")}
                      <p className="text-gray-700 leading-relaxed text-[11px]">
                        <span className={`font-bold ${resume.template === 'ats' ? 'text-black' : resume.template === 'modern' ? 'text-accent-primary' : ''}`}>
                          {resume.template === 'ats' ? 'Technical Skills: ' : 'Technical Competencies: '}
                        </span>
                        <span className={resume.template === 'ats' ? 'text-black' : ''}>{resume.skills.join(', ')}</span>
                      </p>
                    </div>
                  ),
                  certifications: resume.certifications?.length > 0 && (
                    <div key="certifications" className="space-y-1.5">
                      {renderHeading("Certifications")}
                      <ul className={`text-gray-705 space-y-0.5 text-[11px] ${resume.template === 'ats' ? 'list-disc pl-4 text-black' : 'list-disc pl-5'}`}>
                        {resume.certifications.map((cert, idx) => (
                          <li key={idx}>{cert}</li>
                        ))}
                      </ul>
                    </div>
                  )
                };

                return order.map(sectionKey => sections[sectionKey]).filter(Boolean);
              })()}

            </div>
          </div>
        </div>

      </div>
      ) : (
        /* Upload Mode Parent Container */
        <div className="flex flex-col gap-6 w-full flex-grow no-print select-none">
          {!uploadReport ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
              
              {/* Left Side: Upload Zone + JD inputs (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                    <h3 className="text-xs font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-2">
                      <Upload className="w-4 h-4 text-accent-primary" /> Upload Resume Document
                    </h3>
                    <span className="text-[10px] text-text-muted font-medium">Supports PDF, DOCX, TXT, RTF</span>
                  </div>

                  {/* Drag and drop zone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-card p-8 text-center flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                      dragActive
                        ? 'border-accent-primary bg-accent-primary/5'
                        : 'border-border-subtle hover:border-accent-primary/40 hover:bg-[#1C1D2A]/30 bg-background-elevated/20'
                    }`}
                    onClick={() => document.getElementById('resume-file-input').click()}
                  >
                    <input
                      id="resume-file-input"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.md"
                      onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])}
                    />
                    
                    <Upload className={`w-10 h-10 mb-3 text-text-secondary transition-transform duration-300 ${dragActive ? 'scale-110 text-accent-primary' : ''}`} />
                    
                    <p className="text-xs font-bold text-text-primary">
                      Drag & drop your resume file here or <span className="text-accent-primary hover:underline">browse files</span>
                    </p>
                    <p className="text-[10px] text-text-muted mt-1.5 leading-relaxed">
                      PDF, Word (DOCX), Text files supported. Make sure formatting is legible.
                    </p>
                  </div>

                  {/* File selection details */}
                  {uploadFile && (
                    <div className="flex items-center justify-between p-3.5 bg-background-elevated border border-border-subtle rounded-card animate-fadeIn">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FileText className="w-5 h-5 text-accent-primary shrink-0" />
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-text-primary truncate">{uploadFile.name}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setUploadFile(null)}
                        className="p-1 hover:bg-[#2A2B3D] text-text-muted hover:text-text-primary rounded-full transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Or paste text toggle option */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Or Paste Raw Text</span>
                    </div>
                    <textarea
                      rows={6}
                      placeholder="Paste the plain text contents of your resume here if you don't have a document handy..."
                      value={uploadText}
                      onChange={(e) => {
                        setUploadText(e.target.value);
                        if (e.target.value.trim()) setUploadFile(null); // clear file if typing
                      }}
                      className="w-full bg-background-elevated border border-border-subtle rounded-input p-3.5 text-xs text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 leading-relaxed font-sans placeholder-text-muted/60"
                    />
                  </div>
                </div>

                {/* Job Description card */}
                <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                    <h3 className="text-xs font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-accent-secondary animate-pulse" /> Target Job Description (Highly Recommended)
                    </h3>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Paste the job listing requirements here. We'll automatically identify missing keywords and evaluate alignment."
                    value={uploadJd}
                    onChange={(e) => setUploadJd(e.target.value)}
                    className="w-full bg-background-elevated border border-border-subtle rounded-input p-3.5 text-xs text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 leading-relaxed font-sans"
                  />
                </div>

                {/* CTA Action Button */}
                <button
                  onClick={handleUploadAnalyze}
                  disabled={uploadAnalyzing}
                  className="w-full bg-accent-primary hover:bg-accent-primary/95 text-white py-3 rounded-btn font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.3)] duration-200"
                >
                  {uploadAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Calibrating Scoring Heuristics & Scanning Document...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Run Comprehensive ATS Scan & Score
                    </>
                  )}
                </button>
              </div>

              {/* Right Side: Tips and past uploads info (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-5">
                  <h3 className="text-xs font-extrabold text-text-primary uppercase tracking-wider border-b border-border-subtle pb-3">
                    What does the scan evaluate?
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex gap-3 items-start">
                      <div className="p-1.5 bg-accent-primary/10 rounded text-accent-primary shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-text-primary">Keyword Match Density</h4>
                        <p className="text-[10px] text-text-secondary mt-0.5 leading-normal">
                          We scan your resume against 30+ core industry-standard tech keywords and cross-reference custom job listings.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="p-1.5 bg-accent-primary/10 rounded text-accent-primary shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-text-primary">Skills Relevance index</h4>
                        <p className="text-[10px] text-text-secondary mt-0.5 leading-normal">
                          Evaluates skills profile coverage against target vacancy roles to prevent screening pipeline drop-offs.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="p-1.5 bg-accent-primary/10 rounded text-accent-primary shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-text-primary">Active Bullet Verb Audits</h4>
                        <p className="text-[10px] text-text-secondary mt-0.5 leading-normal">
                          Flags passive voice, wordy descriptions, and formats points to highlight concrete metrics and actions.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="p-1.5 bg-accent-primary/10 rounded text-accent-primary shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-text-primary">Structural Formatting Index</h4>
                        <p className="text-[10px] text-text-secondary mt-0.5 leading-normal">
                          Deducts penalties for excessive layout lengths, missing personal links (GitHub, LinkedIn), and section anomalies.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-background-elevated/40 border border-border-subtle p-5 rounded-card space-y-3">
                  <span className="text-[9px] font-bold text-accent-secondary uppercase tracking-widest block font-mono">Real-Time Sync</span>
                  <h4 className="text-xs font-bold text-text-primary">Gamified Career OS Integration</h4>
                  <p className="text-[10px] text-text-secondary leading-relaxed">
                    Analyzing documents automatically grants **+50 XP** to your user profile and syncs your career readiness matrix scores to the main dashboard.
                  </p>
                </div>
              </div>

            </div>
          ) : (
            /* Analysis Scorecard Report view */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
              
              {/* Report Control Toolbar */}
              <div className="col-span-12 flex justify-between items-center bg-background-surface border border-border-subtle rounded-card p-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4.5 h-4.5 text-accent-secondary" />
                  <span className="text-xs font-extrabold text-text-primary uppercase tracking-wider">ATS Scan Scorecard Report</span>
                </div>
                <button
                  onClick={() => {
                    setUploadReport(null);
                    setUploadFile(null);
                    setUploadText('');
                  }}
                  className="bg-background-elevated hover:bg-[#1A1A26] border border-border-subtle text-text-primary text-xs font-bold px-4 py-2 rounded-btn transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Analyze Another Document
                </button>
              </div>

              {/* Left side: Score dial and metrics (5 cols) */}
              <div className="lg:col-span-5 space-y-6 animate-fadeIn">
                
                {/* Gauge card */}
                <div className="bg-background-surface border border-border-subtle rounded-card p-6 flex flex-col items-center text-center space-y-5">
                  <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-widest">Calibrated ATS Rating</span>
                  
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="72" cy="72" r="60" className="stroke-background-elevated" strokeWidth="8" fill="transparent" />
                      <circle 
                        cx="72" cy="72" r="60" 
                        className={`gauge-ring-path transition-all duration-1000 ${
                          uploadReport.ats_score >= 85 ? 'stroke-accent-primary' :
                          uploadReport.ats_score >= 70 ? 'stroke-accent-secondary' : 'stroke-accent-danger'
                        }`}
                        strokeWidth="8" 
                        fill="transparent" 
                        strokeDasharray={377}
                        strokeDashoffset={377 - (377 * uploadReport.ats_score) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-extrabold font-mono text-text-primary tracking-tight">{uploadReport.ats_score}</span>
                      <span className="text-[9px] text-text-secondary uppercase tracking-wider mt-0.5">ATS Score</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className={`inline-block px-3.5 py-1 text-[10px] font-extrabold rounded-full uppercase border ${
                      uploadReport.ats_score >= 85 ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary' :
                      uploadReport.ats_score >= 70 ? 'bg-accent-secondary/10 border-accent-secondary/30 text-accent-secondary' : 
                      'bg-accent-danger/10 border-accent-danger/30 text-accent-danger'
                    }`}>
                      Grade: {uploadReport.ats_score >= 85 ? 'A Tier (Excellent)' : uploadReport.ats_score >= 70 ? 'B Tier (Competitive)' : 'C Tier (Requires Fixes)'}
                    </span>
                    <p className="text-[10px] text-text-muted max-w-[240px] mx-auto mt-2 leading-relaxed">
                      Evaluated by matching core skill arrays, layout limits, and formatting index checks.
                    </p>
                  </div>
                </div>

                {/* Recruiter Simulator card */}
                <div className="bg-accent-primary/5 border border-accent-primary/20 rounded-card p-5 space-y-2">
                  <span className="text-[9.5px] font-extrabold text-accent-primary uppercase tracking-widest block font-mono">Recruiter 7-Second Simulation Review</span>
                  <p className="text-xs text-text-secondary leading-relaxed italic">
                    "{uploadReport.recommendation}"
                  </p>
                </div>

                {/* Format details progress bars */}
                <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-4">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border-subtle pb-2">Compliance Breakdown</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-text-secondary font-semibold">Formatting Integrity Index</span>
                        <span className="text-text-primary font-bold">{uploadReport.format_score}%</span>
                      </div>
                      <div className="w-full bg-[#1C1D2A] rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-accent-primary h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${uploadReport.format_score}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-text-secondary font-semibold">Profile Keywords Coverage</span>
                        <span className="text-text-primary font-bold">
                          {uploadReport.keyword_match.length > 0 ? 'Calibrated' : 'Missing'}
                        </span>
                      </div>
                      <div className="w-full bg-[#1C1D2A] rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-accent-secondary h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${uploadReport.ats_score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right side: Missing keywords and priority checklists (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Missing Keywords */}
                <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-4">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border-subtle pb-2">
                    Target Job Description Match Gap
                  </h4>
                  <p className="text-[11px] text-text-secondary">
                    Adding these keywords to your resume experience bullets or skills listing will increase your ATS screening rank.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 pt-1.5">
                    {uploadReport.missing_keywords && uploadReport.missing_keywords.map((kw, idx) => (
                      <span 
                        key={idx} 
                        className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-accent-danger/10 border border-accent-danger/25 text-accent-danger flex items-center gap-1 hover:bg-accent-danger/20 transition-all duration-150"
                      >
                        <AlertCircle className="w-3 h-3 text-accent-danger" /> {kw}
                      </span>
                    ))}
                    {(!uploadReport.missing_keywords || uploadReport.missing_keywords.length === 0) && (
                      <div className="text-xs text-accent-secondary italic flex items-center gap-1 bg-accent-secondary/5 border border-accent-secondary/20 p-3 rounded w-full">
                        <CheckCircle className="w-4 h-4 text-accent-secondary" /> Perfect compliance match against job listing profile keywords!
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority Checklist suggestions */}
                <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-4">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border-subtle pb-2">
                    Priority Actionable Checklist
                  </h4>
                  
                  <div className="space-y-2.5">
                    {uploadReport.bullet_feedback && uploadReport.bullet_feedback.map((sug, idx) => (
                      <div 
                        key={idx} 
                        className="flex gap-3 p-3.5 bg-[#171822]/40 border border-border-subtle/80 hover:border-accent-primary/20 hover:bg-[#171822] rounded-card transition-all duration-150 text-xs"
                      >
                        <span className="text-accent-primary font-extrabold font-mono shrink-0">{idx + 1}.</span>
                        <p className="text-text-secondary leading-relaxed font-sans">{sug}</p>
                      </div>
                    ))}
                    {(!uploadReport.bullet_feedback || uploadReport.bullet_feedback.length === 0) && (
                      <p className="text-xs text-text-muted italic">No immediate edits suggested. Your bullet phrasing conforms to standards.</p>
                    )}
                  </div>
                </div>

                {/* Core skills list extracted */}
                <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-4">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border-subtle pb-2">
                    Successfully Extracted Skillsets
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {uploadReport.keyword_match && uploadReport.keyword_match.map((skill, idx) => (
                      <span key={idx} className="text-[10px] font-semibold px-2.5 py-1 rounded bg-[#202130] border border-[#2B2C42] text-text-primary">
                        {skill}
                      </span>
                    ))}
                    {(!uploadReport.keyword_match || uploadReport.keyword_match.length === 0) && (
                      <span className="text-xs text-text-muted italic">No structured skills extracted from pasted input.</span>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* FLOATING AI BULLET REWRITE OVERLAY */}
      {rewriteTarget.text && (
        <div className="fixed inset-0 bg-background-primary/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-background-surface border border-border-subtle p-6 rounded-card shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5 font-display">
                <Sparkles className="w-4 h-4 text-accent-primary animate-pulse" /> AI Bulletpoint Assistant
              </h3>
              <button 
                onClick={() => setRewriteTarget({ section: '', index: '', text: '' })}
                className="text-text-secondary hover:text-text-primary font-bold text-xs"
              >
                Close
              </button>
            </div>

            <div className="bg-background-elevated p-4 rounded-card border border-border-subtle">
              <div className="text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1">Current Description</div>
              <p className="text-xs text-text-primary italic">"{rewriteTarget.text}"</p>
            </div>

            {rewriting ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <RefreshCw className="w-5 h-5 text-accent-primary animate-spin" />
                <span className="text-xs text-text-secondary">Rewriting with impact verbs...</span>
              </div>
            ) : rewriteOptions ? (
              <div className="space-y-2.5">
                <div className="text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1">AI Suggestions (Select to apply)</div>
                {['option1', 'option2', 'option3'].map((optKey) => (
                  <button
                    key={optKey}
                    onClick={() => applyRewrite(rewriteOptions[optKey])}
                    className="w-full text-left p-3.5 bg-background-elevated border border-border-subtle hover:border-accent-primary/50 hover:bg-accent-primary/5 rounded-card transition-all text-xs text-text-primary leading-relaxed flex items-center justify-between gap-3"
                  >
                    <span>{rewriteOptions[optKey]}</span>
                    <ArrowRight className="w-4 h-4 text-accent-primary shrink-0" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
}
