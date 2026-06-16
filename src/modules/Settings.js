import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { Save, LogOut, ShieldAlert, Key, User, Cpu, Database } from 'lucide-react';

export default function Settings() {
  const { user, logout, addToast, getAuthHeaders, fetchProfile } = useUser();
  const [name, setName] = useState(user?.name || '');
  const [title, setTitle] = useState(user?.title || '');
  const [role, setRole] = useState(user?.targetRole || '');
  const [college, setCollege] = useState(user?.college || '');
  const [branch, setBranch] = useState(user?.branch || '');
  const [graduationYear, setGraduationYear] = useState(user?.graduationYear || '2026');
  const [geminiKey, setGeminiKey] = useState('');
  const [saving, setSaving] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name,
          targetRole: role,
          skills: (user?.skills || []).map(s => s.name),
          experienceLevel: user?.experienceLevel || 'Student',
          college,
          branch,
          graduationYear
        })
      });
      if (res.ok) {
        addToast("Profile metrics updated successfully!", "success");
        await fetchProfile();
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to sync profile changes.", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveApiKeys = (e) => {
    e.preventDefault();
    if (geminiKey.trim()) {
      // Mock saving API key to local storage or setting it
      localStorage.setItem('GEMINI_API_KEY_LOCAL', geminiKey.trim());
      addToast("Local Gemini API key saved! API orchestration updated.", "success");
      setGeminiKey('');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6 pb-20 text-left">
      
      {/* Title */}
      <div className="flex justify-between items-center pb-4 border-b border-border-subtle">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">System Settings</h1>
          <p className="text-xs text-text-secondary mt-1">Configure candidate profile parameters, AI layer API credentials, and sync settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Navigation Stubs */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-background-surface border border-border-subtle rounded-card p-4 space-y-1">
            <button className="w-full text-left px-3.5 py-2 rounded bg-accent-primary/10 text-accent-primary text-xs font-semibold flex items-center gap-2">
              <User className="w-4 h-4" /> Account Configuration
            </button>
            <button className="w-full text-left px-3.5 py-2 rounded text-text-secondary hover:text-text-primary hover:bg-background-elevated text-xs font-semibold flex items-center gap-2">
              <Key className="w-4 h-4" /> AI API Keys Setup
            </button>
            <button className="w-full text-left px-3.5 py-2 rounded text-text-secondary hover:text-text-primary hover:bg-background-elevated text-xs font-semibold flex items-center gap-2">
              <Database className="w-4 h-4" /> Local Database Status
            </button>
          </div>

          <button
            onClick={logout}
            className="w-full bg-accent-danger/10 border border-accent-danger/25 hover:bg-accent-danger/20 text-accent-danger py-2 rounded-btn font-semibold text-xs flex items-center justify-center gap-1.5 transition-all transform active:scale-95"
          >
            <LogOut className="w-4 h-4" /> Log out of Cockpit
          </button>
        </div>

        {/* Right Side: Form inputs */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Profile form */}
          <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border-subtle pb-2">Profile synchronize</h3>
            
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Candidate Name</label>
                  <input
                    type="text"
                    className="w-full bg-background-elevated border border-border-subtle rounded-input px-3.5 py-2 text-xs focus:outline-none focus:border-accent-primary text-text-primary font-semibold"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Personal Headline Title</label>
                  <input
                    type="text"
                    className="w-full bg-background-elevated border border-border-subtle rounded-input px-3.5 py-2 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Target Placement Role</label>
                  <input
                    type="text"
                    className="w-full bg-background-elevated border border-border-subtle rounded-input px-3.5 py-2 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">College Name</label>
                  <input
                    type="text"
                    className="w-full bg-background-elevated border border-border-subtle rounded-input px-3.5 py-2 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Branch / Degree</label>
                  <input
                    type="text"
                    className="w-full bg-background-elevated border border-border-subtle rounded-input px-3.5 py-2 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Graduation Year</label>
                  <select
                    className="w-full bg-background-elevated border border-border-subtle rounded-input px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                  >
                    {['2024', '2025', '2026', '2027', '2028', '2029'].map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="bg-accent-primary hover:bg-accent-primary/95 text-white px-4 py-2 rounded-btn font-semibold text-xs flex items-center gap-1.5 transform active:scale-95 transition-all"
              >
                <Save className="w-3.5 h-3.5" /> Save Profile Metrics
              </button>
            </form>
          </div>

          {/* API keys configuration */}
          <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border-subtle pb-2">AI API Credentials setup</h3>
            <p className="text-[11px] text-text-muted">By default, CareerPilot runs in Offline Mode using local simulated AI models. Paste your Gemini key here to route analysis tasks to the production Gemini API.</p>

            <form onSubmit={saveApiKeys} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest">Google Gemini API Key</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  className="w-full bg-background-elevated border border-border-subtle rounded-input px-3.5 py-2 text-xs focus:outline-none focus:border-accent-primary text-text-primary"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="bg-accent-secondary text-background-primary hover:bg-accent-secondary/95 px-4 py-2 rounded-btn font-bold text-xs flex items-center gap-1.5 transform active:scale-95 transition-all"
              >
                <Cpu className="w-3.5 h-3.5" /> Synchronize Gemini API
              </button>
            </form>
          </div>

          {/* Database info and telemetry */}
          <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border-subtle pb-2 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-text-secondary" /> System Telemetry Database
            </h3>
            
            <div className="p-4 bg-background-elevated border border-border-subtle rounded-card text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Database Connection Mode</span>
                <span className="font-bold text-accent-secondary">Local Persistence (JSON)</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border-subtle">
                <span className="text-text-secondary">Database Directory Path</span>
                <span className="font-mono text-text-muted text-[10px]">server/data/db/</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border-subtle">
                <span className="text-text-secondary">Active Sessions Count</span>
                <span className="font-mono text-text-primary font-bold">1 Active Pilot Connection</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
