import React, { useState, useEffect } from 'react';
import {
  FileText, Layout, Sparkles, Download, Layers, Eye, ChevronRight, Plus, RefreshCw, Save
} from 'lucide-react';
import ResumeEditor from './ResumeEditor';
import ResumePreview from './ResumePreview';
import TemplateSelector from './TemplateSelector';
import UploadAnalyzer from './UploadAnalyzer';
import ResumeExport from './ResumeExport';
import ResumeList from './ResumeList';

const DEFAULT_RESUME = {
  title: 'Software Engineer Resume',
  targetRole: 'Full-Stack Developer',
  templateId: 'modern',
  personalInfo: {
    fullName: 'Alex Morgan',
    email: 'alex.morgan@example.com',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/alexmorgan',
    github: 'github.com/alexmorgan',
    portfolio: 'alexmorgan.dev'
  },
  summary: 'Innovative Full-Stack Software Engineer with 3+ years of experience building high-scale web applications, microservices, and AI-driven features. Passionate about clean code, performance optimization, and robust developer tooling.',
  education: [
    {
      id: '1',
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Science',
      startDate: '2019',
      endDate: '2023',
      gpa: '3.8'
    }
  ],
  experience: [
    {
      id: '1',
      company: 'TechFlow Systems',
      position: 'Software Engineer',
      location: 'San Francisco, CA',
      startDate: 'Jun 2023',
      endDate: 'Present',
      current: true,
      bullets: [
        'Architected and implemented real-time collaboration pipeline using WebSocket and Node.js, reducing payload latencies by 40%.',
        'Engineered responsive React micro-frontends with TailwindCSS, serving over 150,000 active monthly users.',
        'Optimized MongoDB database indexing queries, improving average response time from 320ms to 45ms.'
      ]
    }
  ],
  projects: [
    {
      id: '1',
      title: 'CareerPilot AI Platform',
      subtitle: 'React, Express, Groq SDK, MongoDB',
      link: 'https://github.com/alexmorgan/careerpilot',
      bullets: [
        'Built full-stack AI resume parsing & ATS score analyzer integrating Groq LLM API and Puppeteer PDF export engine.',
        'Implemented semantic caching and circuit-breaker resilient routing across multiple AI models.'
      ]
    }
  ],
  skills: {
    technical: ['JavaScript (ES6+)', 'TypeScript', 'Node.js', 'Python', 'SQL', 'MongoDB'],
    frameworks: ['React', 'Express.js', 'Next.js', 'TailwindCSS', 'Redux Toolkit'],
    tools: ['Git', 'Docker', 'AWS', 'Postman', 'Vite', 'Jest']
  },
  certifications: [
    {
      id: '1',
      name: 'AWS Certified Developer - Associate',
      issuer: 'Amazon Web Services',
      date: '2023'
    }
  ],
  achievements: [
    {
      id: '1',
      title: '1st Place Hackathon Winner',
      description: 'Awarded top prize among 80+ teams for building real-time developer productivity suite.',
      date: '2023'
    }
  ]
};

export default function ResumeBuilderModule() {
  const [activeTab, setActiveTab] = useState('builder'); // 'dashboard' | 'builder' | 'templates' | 'ats' | 'export'
  const [resumeData, setResumeData] = useState(DEFAULT_RESUME);
  const [savedResumes, setSavedResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);

  // Fetch saved resumes from API
  const fetchResumes = async () => {
    setLoadingResumes(true);
    try {
      const res = await fetch('/api/resumes', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedResumes(data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch resumes:', e);
    } finally {
      setLoadingResumes(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  // Save or update resume
  const handleSaveResume = async () => {
    setIsSaving(true);
    try {
      const method = resumeData._id ? 'PUT' : 'POST';
      const url = resumeData._id ? `/api/resumes/${resumeData._id}` : '/api/resumes';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(resumeData)
      });

      if (res.ok) {
        const data = await res.json();
        setResumeData(data.data);
        fetchResumes();
      }
    } catch (e) {
      console.error('Failed to save resume:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNew = () => {
    setResumeData(DEFAULT_RESUME);
    setActiveTab('builder');
  };

  const handleSelectResume = (res) => {
    setResumeData(res);
    setActiveTab('builder');
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await fetch(`/api/resumes/${id}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        fetchResumes();
      }
    } catch (e) {
      console.error('Failed to duplicate:', e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      const res = await fetch(`/api/resumes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        fetchResumes();
      }
    } catch (e) {
      console.error('Failed to delete:', e);
    }
  };

  const tabs = [
    { id: 'dashboard', name: 'Saved Resumes', icon: Layers },
    { id: 'builder', name: 'Step Guided Builder', icon: FileText },
    { id: 'templates', name: 'Templates', icon: Layout },
    { id: 'ats', name: 'ATS Score Checker', icon: Sparkles },
    { id: 'export', name: 'Export & Download', icon: Download }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Banner Navigation */}
      <div className="bg-[#111118] border border-border-subtle p-4 rounded-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-text-primary flex items-center gap-2">
            <FileText className="w-6 h-6 text-accent-primary" /> AI Resume Builder & ATS Suite
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Build high-impact resumes with Groq AI bullet polishing, instant template switching, and ATS keyword matching.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-[#0A0A0F] p-1 border border-border-subtle rounded-btn text-xs font-semibold overflow-x-auto w-full md:w-auto">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded shrink-0 transition-all ${
                  active
                    ? 'bg-accent-primary text-white shadow-md'
                    : 'text-text-secondary hover:text-text-primary hover:bg-background-surface'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEWPORT BODY */}
      {activeTab === 'dashboard' && (
        <ResumeList
          resumes={savedResumes}
          onSelectResume={handleSelectResume}
          onCreateNew={handleCreateNew}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          loading={loadingResumes}
        />
      )}

      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Form Editor Left */}
          <div className={showLivePreview ? 'lg:col-span-6' : 'lg:col-span-12'}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">Resume Data Editor</span>
              <button
                onClick={() => setShowLivePreview(!showLivePreview)}
                className="text-xs text-accent-primary font-semibold hover:underline flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> {showLivePreview ? 'Hide Live Preview' : 'Show Live Preview'}
              </button>
            </div>
            <ResumeEditor
              resumeData={resumeData}
              setResumeData={setResumeData}
              onSave={handleSaveResume}
              isSaving={isSaving}
            />
          </div>

          {/* Live Preview Right */}
          {showLivePreview && (
            <div className="lg:col-span-6 sticky top-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">
                  Live Preview ({resumeData.templateId || 'modern'} template)
                </span>
              </div>
              <ResumePreview
                resumeData={resumeData}
                selectedTemplate={resumeData.templateId || 'modern'}
              />
            </div>
          )}

        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-6">
          <TemplateSelector
            selectedTemplate={resumeData.templateId || 'modern'}
            onSelectTemplate={(tmplId) => setResumeData(prev => ({ ...prev, templateId: tmplId }))}
          />

          <div className="bg-[#111118] border border-border-subtle p-6 rounded-card space-y-4">
            <h4 className="font-bold text-sm text-text-primary">Selected Template Live Sandbox</h4>
            <ResumePreview
              resumeData={resumeData}
              selectedTemplate={resumeData.templateId || 'modern'}
            />
          </div>
        </div>
      )}

      {activeTab === 'ats' && (
        <UploadAnalyzer currentResumeData={resumeData} />
      )}

      {activeTab === 'export' && (
        <ResumeExport resumeData={resumeData} />
      )}

    </div>
  );
}
