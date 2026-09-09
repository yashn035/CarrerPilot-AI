import React, { useState } from 'react';
import {
  User, FileText, GraduationCap, Briefcase, Code, Award, Trophy,
  Plus, Trash2, Wand2, Sparkles, ChevronDown, ChevronUp, Check, RefreshCw
} from 'lucide-react';

export default function ResumeEditor({ resumeData, setResumeData, onSave, isSaving }) {
  const [activeSection, setActiveSection] = useState('personal');
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [polishingIndex, setPolishingIndex] = useState(null);

  // Helper state updater
  const updatePersonalInfo = (field, val) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: val }
    }));
  };

  const updateSkills = (category, commaString) => {
    const arr = commaString.split(',').map(s => s.trim()).filter(Boolean);
    setResumeData(prev => ({
      ...prev,
      skills: { ...prev.skills, [category]: arr }
    }));
  };

  // Add items to arrays
  const addExperience = () => {
    const newExp = {
      id: Date.now().toString(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      bullets: ['']
    };
    setResumeData(prev => ({ ...prev, experience: [...(prev.experience || []), newExp] }));
  };

  const removeExperience = (idx) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== idx)
    }));
  };

  const addProject = () => {
    const newProj = {
      id: Date.now().toString(),
      title: '',
      subtitle: '',
      link: '',
      technologies: [],
      bullets: ['']
    };
    setResumeData(prev => ({ ...prev, projects: [...(prev.projects || []), newProj] }));
  };

  const removeProject = (idx) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== idx)
    }));
  };

  const addEducation = () => {
    const newEdu = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      gpa: ''
    };
    setResumeData(prev => ({ ...prev, education: [...(prev.education || []), newEdu] }));
  };

  const removeEducation = (idx) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== idx)
    }));
  };

  const addCertification = () => {
    const newCert = { id: Date.now().toString(), name: '', issuer: '', date: '' };
    setResumeData(prev => ({ ...prev, certifications: [...(prev.certifications || []), newCert] }));
  };

  const removeCertification = (idx) => {
    setResumeData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== idx)
    }));
  };

  const addAchievement = () => {
    const newAch = { id: Date.now().toString(), title: '', description: '', date: '' };
    setResumeData(prev => ({ ...prev, achievements: [...(prev.achievements || []), newAch] }));
  };

  const removeAchievement = (idx) => {
    setResumeData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== idx)
    }));
  };

  // AI Actions
  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const res = await fetch('/api/resumes/groq/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          personalInfo: resumeData.personalInfo,
          targetRole: resumeData.targetRole,
          skills: resumeData.skills,
          experience: resumeData.experience
        })
      });
      const data = await res.json();
      if (data.status === 'success' && data.data?.summary) {
        setResumeData(prev => ({ ...prev, summary: data.data.summary }));
      }
    } catch (e) {
      console.error('Failed to generate summary:', e);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handlePolishBullet = async (expIdx, bulletIdx) => {
    const currentBullet = resumeData.experience[expIdx]?.bullets[bulletIdx];
    if (!currentBullet) return;

    const key = `${expIdx}-${bulletIdx}`;
    setPolishingIndex(key);
    try {
      const res = await fetch('/api/resumes/groq/polish-bullet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          bulletText: currentBullet,
          targetRole: resumeData.targetRole
        })
      });
      const data = await res.json();
      if (data.status === 'success' && data.data?.improved) {
        const updatedExp = [...resumeData.experience];
        updatedExp[expIdx].bullets[bulletIdx] = data.data.improved;
        setResumeData(prev => ({ ...prev, experience: updatedExp }));
      }
    } catch (e) {
      console.error('Failed to polish bullet:', e);
    } finally {
      setPolishingIndex(null);
    }
  };

  const sections = [
    { id: 'personal', name: 'Personal Info', icon: User },
    { id: 'summary', name: 'Summary', icon: FileText },
    { id: 'experience', name: 'Experience', icon: Briefcase },
    { id: 'projects', name: 'Projects', icon: Code },
    { id: 'education', name: 'Education', icon: GraduationCap },
    { id: 'skills', name: 'Skills', icon: Sparkles },
    { id: 'certifications', name: 'Certifications', icon: Award },
    { id: 'achievements', name: 'Achievements', icon: Trophy }
  ];

  return (
    <div className="space-y-6">
      
      {/* Title & Target Role Header */}
      <div className="bg-[#111118] border border-border-subtle p-4 rounded-card flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-1/2 space-y-1">
          <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Resume Title</label>
          <input
            type="text"
            value={resumeData.title || ''}
            onChange={(e) => setResumeData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g. Senior Frontend Engineer Resume"
            className="w-full bg-[#0A0A0F] border border-border-subtle rounded p-2 text-xs font-semibold text-text-primary focus:outline-none focus:border-accent-primary"
          />
        </div>
        <div className="w-full md:w-1/2 space-y-1">
          <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Target Job Role</label>
          <input
            type="text"
            value={resumeData.targetRole || ''}
            onChange={(e) => setResumeData(prev => ({ ...prev, targetRole: e.target.value }))}
            placeholder="e.g. Full-Stack Developer"
            className="w-full bg-[#0A0A0F] border border-border-subtle rounded p-2 text-xs font-semibold text-text-primary focus:outline-none focus:border-accent-primary"
          />
        </div>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="w-full md:w-auto self-end bg-accent-primary hover:bg-accent-primary/90 text-white font-bold text-xs px-5 py-2.5 rounded-btn flex items-center justify-center gap-2 transition-all shrink-0"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save Resume'}
        </button>
      </div>

      {/* Section Nav Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {sections.map(s => {
          const Icon = s.icon;
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-btn text-xs font-semibold shrink-0 transition-all ${
                isActive
                  ? 'bg-accent-primary text-white shadow-md'
                  : 'bg-[#111118] text-text-secondary border border-border-subtle hover:text-text-primary hover:bg-background-surface'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{s.name}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION EDITORS */}
      <div className="bg-[#111118] border border-border-subtle rounded-card p-6 space-y-6">
        
        {/* 1. PERSONAL INFO */}
        {activeSection === 'personal' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <User className="w-4 h-4 text-accent-primary" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-text-secondary block mb-1">Full Name</label>
                <input
                  type="text"
                  value={resumeData.personalInfo?.fullName || ''}
                  onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-[#0A0A0F] border border-border-subtle rounded p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="text-[11px] text-text-secondary block mb-1">Email</label>
                <input
                  type="email"
                  value={resumeData.personalInfo?.email || ''}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-[#0A0A0F] border border-border-subtle rounded p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="text-[11px] text-text-secondary block mb-1">Phone</label>
                <input
                  type="text"
                  value={resumeData.personalInfo?.phone || ''}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  placeholder="+1 (555) 000-1234"
                  className="w-full bg-[#0A0A0F] border border-border-subtle rounded p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="text-[11px] text-text-secondary block mb-1">Location</label>
                <input
                  type="text"
                  value={resumeData.personalInfo?.location || ''}
                  onChange={(e) => updatePersonalInfo('location', e.target.value)}
                  placeholder="San Francisco, CA"
                  className="w-full bg-[#0A0A0F] border border-border-subtle rounded p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="text-[11px] text-text-secondary block mb-1">LinkedIn URL</label>
                <input
                  type="text"
                  value={resumeData.personalInfo?.linkedin || ''}
                  onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                  placeholder="linkedin.com/in/johndoe"
                  className="w-full bg-[#0A0A0F] border border-border-subtle rounded p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="text-[11px] text-text-secondary block mb-1">GitHub / Portfolio URL</label>
                <input
                  type="text"
                  value={resumeData.personalInfo?.github || ''}
                  onChange={(e) => updatePersonalInfo('github', e.target.value)}
                  placeholder="github.com/johndoe"
                  className="w-full bg-[#0A0A0F] border border-border-subtle rounded p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. SUMMARY */}
        {activeSection === 'summary' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent-primary" /> Professional Summary
              </h3>
              <button
                onClick={handleGenerateSummary}
                disabled={generatingSummary}
                className="bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary border border-accent-primary/30 px-3 py-1.5 rounded-btn text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                {generatingSummary ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                {generatingSummary ? 'Generating...' : 'AI Generate Summary'}
              </button>
            </div>
            <textarea
              rows={5}
              value={resumeData.summary || ''}
              onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Write a concise overview of your background, technical skills, and key achievements..."
              className="w-full bg-[#0A0A0F] border border-border-subtle rounded p-3 text-xs text-text-primary focus:outline-none focus:border-accent-primary leading-relaxed"
            />
          </div>
        )}

        {/* 3. EXPERIENCE */}
        {activeSection === 'experience' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-accent-primary" /> Work Experience
              </h3>
              <button
                onClick={addExperience}
                className="bg-accent-primary text-white px-3 py-1.5 rounded-btn text-xs font-bold flex items-center gap-1.5 hover:bg-accent-primary/90 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Role
              </button>
            </div>

            {(resumeData.experience || []).map((exp, idx) => (
              <div key={exp.id || idx} className="bg-[#0A0A0F] border border-border-subtle rounded-card p-4 space-y-4">
                <div className="flex justify-between items-center border-b border-border-subtle pb-2">
                  <span className="font-bold text-xs text-text-primary">Role #{idx + 1}</span>
                  <button onClick={() => removeExperience(idx)} className="text-accent-danger hover:text-red-400 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-text-secondary block mb-1">Position / Role</label>
                    <input
                      type="text"
                      value={exp.position || ''}
                      onChange={(e) => {
                        const updated = [...resumeData.experience];
                        updated[idx].position = e.target.value;
                        setResumeData(prev => ({ ...prev, experience: updated }));
                      }}
                      placeholder="Senior Software Engineer"
                      className="w-full bg-[#111118] border border-border-subtle rounded p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary block mb-1">Company</label>
                    <input
                      type="text"
                      value={exp.company || ''}
                      onChange={(e) => {
                        const updated = [...resumeData.experience];
                        updated[idx].company = e.target.value;
                        setResumeData(prev => ({ ...prev, experience: updated }));
                      }}
                      placeholder="TechCorp Inc."
                      className="w-full bg-[#111118] border border-border-subtle rounded p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary block mb-1">Start Date</label>
                    <input
                      type="text"
                      value={exp.startDate || ''}
                      onChange={(e) => {
                        const updated = [...resumeData.experience];
                        updated[idx].startDate = e.target.value;
                        setResumeData(prev => ({ ...prev, experience: updated }));
                      }}
                      placeholder="Jan 2022"
                      className="w-full bg-[#111118] border border-border-subtle rounded p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary block mb-1">End Date</label>
                    <input
                      type="text"
                      value={exp.endDate || ''}
                      onChange={(e) => {
                        const updated = [...resumeData.experience];
                        updated[idx].endDate = e.target.value;
                        setResumeData(prev => ({ ...prev, experience: updated }));
                      }}
                      placeholder="Present"
                      className="w-full bg-[#111118] border border-border-subtle rounded p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                </div>

                {/* Bullets */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Bullet Points</label>
                    <button
                      onClick={() => {
                        const updated = [...resumeData.experience];
                        updated[idx].bullets = [...(updated[idx].bullets || []), ''];
                        setResumeData(prev => ({ ...prev, experience: updated }));
                      }}
                      className="text-[10px] text-accent-primary font-bold hover:underline"
                    >
                      + Add Bullet
                    </button>
                  </div>

                  {(exp.bullets || []).map((bullet, bIdx) => (
                    <div key={bIdx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => {
                          const updated = [...resumeData.experience];
                          updated[idx].bullets[bIdx] = e.target.value;
                          setResumeData(prev => ({ ...prev, experience: updated }));
                        }}
                        placeholder="Architected scalable GraphQL API handling 100k requests/min..."
                        className="flex-grow bg-[#111118] border border-border-subtle rounded p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                      />
                      <button
                        onClick={() => handlePolishBullet(idx, bIdx)}
                        disabled={polishingIndex === `${idx}-${bIdx}`}
                        title="AI Polish Bullet"
                        className="p-2 bg-accent-primary/10 text-accent-primary rounded hover:bg-accent-primary/20 shrink-0"
                      >
                        {polishingIndex === `${idx}-${bIdx}` ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => {
                          const updated = [...resumeData.experience];
                          updated[idx].bullets = updated[idx].bullets.filter((_, i) => i !== bIdx);
                          setResumeData(prev => ({ ...prev, experience: updated }));
                        }}
                        className="text-text-muted hover:text-accent-danger p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. PROJECTS */}
        {activeSection === 'projects' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Code className="w-4 h-4 text-accent-primary" /> Key Projects
              </h3>
              <button
                onClick={addProject}
                className="bg-accent-primary text-white px-3 py-1.5 rounded-btn text-xs font-bold flex items-center gap-1.5 hover:bg-accent-primary/90 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            </div>

            {(resumeData.projects || []).map((proj, idx) => (
              <div key={proj.id || idx} className="bg-[#0A0A0F] border border-border-subtle rounded-card p-4 space-y-4">
                <div className="flex justify-between items-center border-b border-border-subtle pb-2">
                  <span className="font-bold text-xs text-text-primary">Project #{idx + 1}</span>
                  <button onClick={() => removeProject(idx)} className="text-accent-danger hover:text-red-400 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-text-secondary block mb-1">Project Title</label>
                    <input
                      type="text"
                      value={proj.title || ''}
                      onChange={(e) => {
                        const updated = [...resumeData.projects];
                        updated[idx].title = e.target.value;
                        setResumeData(prev => ({ ...prev, projects: updated }));
                      }}
                      placeholder="CareerPilot AI Platform"
                      className="w-full bg-[#111118] border border-border-subtle rounded p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary block mb-1">Subtitle / Tech Stack</label>
                    <input
                      type="text"
                      value={proj.subtitle || ''}
                      onChange={(e) => {
                        const updated = [...resumeData.projects];
                        updated[idx].subtitle = e.target.value;
                        setResumeData(prev => ({ ...prev, projects: updated }));
                      }}
                      placeholder="React, Express, Groq SDK, MongoDB"
                      className="w-full bg-[#111118] border border-border-subtle rounded p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] text-text-secondary block mb-1">Project Link / Repo</label>
                    <input
                      type="text"
                      value={proj.link || ''}
                      onChange={(e) => {
                        const updated = [...resumeData.projects];
                        updated[idx].link = e.target.value;
                        setResumeData(prev => ({ ...prev, projects: updated }));
                      }}
                      placeholder="https://github.com/user/project"
                      className="w-full bg-[#111118] border border-border-subtle rounded p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 5. EDUCATION */}
        {activeSection === 'education' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-accent-primary" /> Education
              </h3>
              <button
                onClick={addEducation}
                className="bg-accent-primary text-white px-3 py-1.5 rounded-btn text-xs font-bold flex items-center gap-1.5 hover:bg-accent-primary/90 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Education
              </button>
            </div>

            {(resumeData.education || []).map((edu, idx) => (
              <div key={edu.id || idx} className="bg-[#0A0A0F] border border-border-subtle rounded-card p-4 space-y-4">
                <div className="flex justify-between items-center border-b border-border-subtle pb-2">
                  <span className="font-bold text-xs text-text-primary">Institution #{idx + 1}</span>
                  <button onClick={() => removeEducation(idx)} className="text-accent-danger hover:text-red-400 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-text-secondary block mb-1">Institution Name</label>
                    <input
                      type="text"
                      value={edu.institution || ''}
                      onChange={(e) => {
                        const updated = [...resumeData.education];
                        updated[idx].institution = e.target.value;
                        setResumeData(prev => ({ ...prev, education: updated }));
                      }}
                      placeholder="University of California, Berkeley"
                      className="w-full bg-[#111118] border border-border-subtle rounded p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary block mb-1">Degree</label>
                    <input
                      type="text"
                      value={edu.degree || ''}
                      onChange={(e) => {
                        const updated = [...resumeData.education];
                        updated[idx].degree = e.target.value;
                        setResumeData(prev => ({ ...prev, education: updated }));
                      }}
                      placeholder="Bachelor of Science"
                      className="w-full bg-[#111118] border border-border-subtle rounded p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary block mb-1">Field of Study</label>
                    <input
                      type="text"
                      value={edu.fieldOfStudy || ''}
                      onChange={(e) => {
                        const updated = [...resumeData.education];
                        updated[idx].fieldOfStudy = e.target.value;
                        setResumeData(prev => ({ ...prev, education: updated }));
                      }}
                      placeholder="Computer Science"
                      className="w-full bg-[#111118] border border-border-subtle rounded p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary block mb-1">Graduation Year / Dates</label>
                    <input
                      type="text"
                      value={edu.endDate || ''}
                      onChange={(e) => {
                        const updated = [...resumeData.education];
                        updated[idx].endDate = e.target.value;
                        setResumeData(prev => ({ ...prev, education: updated }));
                      }}
                      placeholder="2020 - 2024"
                      className="w-full bg-[#111118] border border-border-subtle rounded p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6. SKILLS */}
        {activeSection === 'skills' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-primary" /> Skills & Competencies
            </h3>
            <p className="text-xs text-text-secondary">Separate skills with commas.</p>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-text-secondary block mb-1 font-bold">Technical Skills</label>
                <input
                  type="text"
                  value={(resumeData.skills?.technical || []).join(', ')}
                  onChange={(e) => updateSkills('technical', e.target.value)}
                  placeholder="JavaScript, Python, React, Node.js, Express, MongoDB"
                  className="w-full bg-[#0A0A0F] border border-border-subtle rounded p-2.5 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>

              <div>
                <label className="text-[11px] text-text-secondary block mb-1 font-bold">Frameworks & Libraries</label>
                <input
                  type="text"
                  value={(resumeData.skills?.frameworks || []).join(', ')}
                  onChange={(e) => updateSkills('frameworks', e.target.value)}
                  placeholder="TailwindCSS, Redux Toolkit, Next.js, Jest"
                  className="w-full bg-[#0A0A0F] border border-border-subtle rounded p-2.5 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>

              <div>
                <label className="text-[11px] text-text-secondary block mb-1 font-bold">Tools & Platforms</label>
                <input
                  type="text"
                  value={(resumeData.skills?.tools || []).join(', ')}
                  onChange={(e) => updateSkills('tools', e.target.value)}
                  placeholder="Git, Docker, AWS, Postman, Linux"
                  className="w-full bg-[#0A0A0F] border border-border-subtle rounded p-2.5 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* 7. CERTIFICATIONS */}
        {activeSection === 'certifications' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Award className="w-4 h-4 text-accent-primary" /> Certifications
              </h3>
              <button
                onClick={addCertification}
                className="bg-accent-primary text-white px-3 py-1.5 rounded-btn text-xs font-bold flex items-center gap-1.5 hover:bg-accent-primary/90 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Certification
              </button>
            </div>

            {(resumeData.certifications || []).map((cert, idx) => (
              <div key={cert.id || idx} className="flex items-center gap-3 bg-[#0A0A0F] border border-border-subtle rounded-card p-3">
                <input
                  type="text"
                  value={cert.name || ''}
                  onChange={(e) => {
                    const updated = [...resumeData.certifications];
                    updated[idx].name = e.target.value;
                    setResumeData(prev => ({ ...prev, certifications: updated }));
                  }}
                  placeholder="AWS Certified Solutions Architect"
                  className="w-1/2 bg-[#111118] border border-border-subtle rounded p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                />
                <input
                  type="text"
                  value={cert.issuer || ''}
                  onChange={(e) => {
                    const updated = [...resumeData.certifications];
                    updated[idx].issuer = e.target.value;
                    setResumeData(prev => ({ ...prev, certifications: updated }));
                  }}
                  placeholder="Amazon Web Services"
                  className="w-1/3 bg-[#111118] border border-border-subtle rounded p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                />
                <button onClick={() => removeCertification(idx)} className="text-accent-danger hover:text-red-400 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 8. ACHIEVEMENTS */}
        {activeSection === 'achievements' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Trophy className="w-4 h-4 text-accent-primary" /> Honors & Achievements
              </h3>
              <button
                onClick={addAchievement}
                className="bg-accent-primary text-white px-3 py-1.5 rounded-btn text-xs font-bold flex items-center gap-1.5 hover:bg-accent-primary/90 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Achievement
              </button>
            </div>

            {(resumeData.achievements || []).map((ach, idx) => (
              <div key={ach.id || idx} className="space-y-2 bg-[#0A0A0F] border border-border-subtle rounded-card p-3">
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    value={ach.title || ''}
                    onChange={(e) => {
                      const updated = [...resumeData.achievements];
                      updated[idx].title = e.target.value;
                      setResumeData(prev => ({ ...prev, achievements: updated }));
                    }}
                    placeholder="1st Place Hackathon Winner"
                    className="w-4/5 bg-[#111118] border border-border-subtle rounded p-2 text-xs font-bold text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                  <button onClick={() => removeAchievement(idx)} className="text-accent-danger hover:text-red-400 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={ach.description || ''}
                  onChange={(e) => {
                    const updated = [...resumeData.achievements];
                    updated[idx].description = e.target.value;
                    setResumeData(prev => ({ ...prev, achievements: updated }));
                  }}
                  placeholder="Built an AI-powered accessibility tool for visual assistance..."
                  className="w-full bg-[#111118] border border-border-subtle rounded p-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
