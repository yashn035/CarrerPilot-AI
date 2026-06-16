import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { Plus, Trash2, Calendar, Edit2, TrendingUp, Briefcase, MapPin, DollarSign, FileText, CheckCircle, RefreshCw, X } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';

export default function JobTracker() {
  const { getAuthHeaders, addToast, fetchProfile } = useUser();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form modal states
  const [showModal, setShowModal] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [stage, setStage] = useState('Applied');
  const [salary, setSalary] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [saving, setSaving] = useState(false);

  const stages = ['Applied', 'OA', 'Interview', 'Offer', 'Rejected'];

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jobs/applications', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to fetch applications list.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const openAddModal = () => {
    setEditingApp(null);
    setCompany('');
    setRole('');
    setStage('Applied');
    setSalary('');
    setLocation('');
    setNotes('');
    setReminderDate('');
    setShowModal(true);
  };

  const openEditModal = (app) => {
    setEditingApp(app);
    setCompany(app.company);
    setRole(app.role);
    setStage(app.stage);
    setSalary(app.salary || '');
    setLocation(app.location || '');
    setNotes(app.notes || '');
    setReminderDate(app.reminderDate || '');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) {
      addToast("Company and Role are required fields.", "error");
      return;
    }
    setSaving(true);

    const payload = { company, role, stage, salary, location, notes, reminderDate };

    try {
      if (editingApp) {
        // Update application
        const res = await fetch(`/api/jobs/applications/${editingApp.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          addToast("Application updated successfully!", "success");
          fetchApplications();
          setShowModal(false);
        }
      } else {
        // Create application
        const res = await fetch('/api/jobs/applications', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          addToast(`Created application! +20 XP`, "gold");
          fetchApplications();
          fetchProfile(); // Update dashboard XP
          setShowModal(false);
        }
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to save job application record.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job application?")) return;
    try {
      const res = await fetch(`/api/jobs/applications/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        addToast("Application deleted.", "info");
        fetchApplications();
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to delete application.", "error");
    }
  };

  const moveStage = async (app, direction) => {
    const currentIdx = stages.indexOf(app.stage);
    const newIdx = currentIdx + direction;
    if (newIdx < 0 || newIdx >= stages.length) return;

    const newStage = stages[newIdx];
    try {
      const res = await fetch(`/api/jobs/applications/${app.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ stage: newStage })
      });
      if (res.ok) {
        addToast(`Moved to ${newStage}`, "info");
        fetchApplications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Compile Recharts Data based on stages
  const chartData = stages.map(stG => ({
    name: stG,
    Count: applications.filter(a => a.stage === stG).length
  }));

  const COLORS = ['#6C63FF', '#00D4AA', '#FFB703', '#3A86FF', '#EF476F'];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-4 md:p-6 pb-20 text-left select-none overflow-y-auto h-[calc(100vh-64px)]">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-accent-primary" /> Application Job Tracker
          </h1>
          <p className="text-xs text-text-secondary mt-1">Manage your recruitment workflows. Drag stages or track salary index matrices dynamically.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-accent-primary hover:bg-accent-primary/95 text-white font-semibold text-xs px-4 py-2.5 rounded-btn flex items-center gap-1.5 transform active:scale-95 transition-all shadow-md shadow-accent-primary/10"
        >
          <Plus className="w-4 h-4" /> Track New Vacancy
        </button>
      </div>

      {/* Analytics chart and stats summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Statistics list */}
        <div className="lg:col-span-1 bg-background-surface border border-border-subtle rounded-card p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">Pipeline Telemetry</h3>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-background-elevated p-3 border border-border-subtle rounded">
                <span className="text-[9px] text-text-secondary block mb-1 uppercase">Total Submissions</span>
                <span className="text-lg font-bold text-text-primary">{applications.length}</span>
              </div>
              <div className="bg-background-elevated p-3 border border-border-subtle rounded">
                <span className="text-[9px] text-text-secondary block mb-1 uppercase">Active Interviews</span>
                <span className="text-lg font-bold text-accent-gold">{applications.filter(a => a.stage === 'Interview').length}</span>
              </div>
              <div className="bg-background-elevated p-3 border border-border-subtle rounded">
                <span className="text-[9px] text-text-secondary block mb-1 uppercase">Offers Secured</span>
                <span className="text-lg font-bold text-accent-secondary">{applications.filter(a => a.stage === 'Offer').length}</span>
              </div>
              <div className="bg-background-elevated p-3 border border-border-subtle rounded">
                <span className="text-[9px] text-text-secondary block mb-1 uppercase">Rejection Ratio</span>
                <span className="text-lg font-bold text-accent-danger">
                  {applications.length > 0 ? `${Math.round((applications.filter(a => a.stage === 'Rejected').length / applications.length) * 100)}%` : '0%'}
                </span>
              </div>
            </div>
          </div>
          <div className="p-3.5 bg-accent-secondary/5 border border-accent-secondary/20 rounded text-xs text-accent-secondary font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" /> Setup follow-ups on cards to trigger countdown alerts.
          </div>
        </div>

        {/* Recharts chart */}
        <div className="lg:col-span-2 bg-background-surface border border-border-subtle rounded-card p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-accent-primary" /> Application Stage Velocities
          </h3>
          <div className="w-full h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A26" />
                <XAxis dataKey="name" stroke="#8888AA" fontSize={10} />
                <YAxis stroke="#8888AA" fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111118', borderColor: '#2A2A3A', borderRadius: '6px' }} />
                <Bar dataKey="Count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Kanban Board Grid */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-accent-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start pt-2">
          {stages.map((stgName, colIdx) => {
            const list = applications.filter(a => a.stage === stgName);
            const borderColors = [
              'border-t-[#6C63FF]',
              'border-t-[#00D4AA]',
              'border-t-[#FFB703]',
              'border-t-[#3A86FF]',
              'border-t-[#EF476F]'
            ];

            return (
              <div key={stgName} className="bg-[#111118] border border-border-subtle rounded-card overflow-hidden flex flex-col min-h-[400px]">
                {/* Column header */}
                <div className={`p-3 border-t-4 ${borderColors[colIdx]} border-b border-border-subtle bg-background-elevated/20 flex justify-between items-center shrink-0`}>
                  <span className="text-xs font-bold uppercase tracking-wider text-text-primary">{stgName}</span>
                  <span className="text-[10px] font-mono font-bold bg-[#1C1C28] border border-border-subtle px-1.5 py-0.2 rounded text-text-secondary">{list.length}</span>
                </div>

                {/* Column contents */}
                <div className="p-3.5 space-y-3 flex-grow overflow-y-auto max-h-[450px]">
                  {list.map(app => (
                    <div key={app.id} className="p-4 bg-background-surface hover:bg-[#151520] border border-border-subtle rounded-card space-y-3 transition-all relative group shadow-sm">
                      <div className="space-y-1 pr-6">
                        <h4 className="text-xs font-bold text-text-primary leading-snug">{app.company}</h4>
                        <p className="text-[11px] font-medium text-text-secondary">{app.role}</p>
                      </div>
                      
                      <div className="space-y-1.5 font-mono text-[9px] text-text-muted">
                        {app.salary && <div className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-accent-secondary" /> {app.salary}</div>}
                        {app.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {app.location}</div>}
                        {app.reminderDate && <div className="flex items-center gap-1 text-accent-gold"><Calendar className="w-3 h-3" /> {app.reminderDate}</div>}
                      </div>

                      {app.notes && (
                        <p className="text-[10px] text-text-secondary bg-[#1C1C28] border border-border-subtle p-2 rounded leading-relaxed italic line-clamp-2">{app.notes}</p>
                      )}

                      {/* Card actions */}
                      <div className="flex justify-between items-center pt-2 border-t border-border-subtle/50 select-none">
                        {/* Quick move stage */}
                        <div className="flex gap-1">
                          <button 
                            disabled={colIdx === 0} 
                            onClick={() => moveStage(app, -1)}
                            className="px-1.5 py-0.5 bg-background-elevated hover:bg-background-surface border border-border-subtle rounded text-[9px] text-text-secondary disabled:opacity-30"
                          >
                            ←
                          </button>
                          <button 
                            disabled={colIdx === stages.length - 1} 
                            onClick={() => moveStage(app, 1)}
                            className="px-1.5 py-0.5 bg-background-elevated hover:bg-background-surface border border-border-subtle rounded text-[9px] text-text-secondary disabled:opacity-30"
                          >
                            →
                          </button>
                        </div>

                        {/* Edit / Delete */}
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditModal(app)} className="text-text-muted hover:text-text-primary"><Edit2 className="w-3 h-3" /></button>
                          <button onClick={() => handleDelete(app.id)} className="text-text-muted hover:text-accent-danger"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>

                    </div>
                  ))}
                  {list.length === 0 && (
                    <div className="text-[10px] text-text-muted italic py-6 text-center">No applications here.</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FORM DIALOG MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0A0A0F]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111118] border border-border-subtle rounded-card shadow-2xl max-w-md w-full p-6 space-y-4">
            
            <div className="flex justify-between items-center border-b border-border-subtle pb-3">
              <h3 className="text-sm font-bold text-text-primary uppercase flex items-center gap-1.5">
                <FileText className="w-4.5 h-4.5 text-accent-primary" /> {editingApp ? 'Modify Job Entry' : 'Track Job Application'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-primary"><X className="w-4.5 h-4.5" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1">Company *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-background-elevated border border-border-subtle rounded-input px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                    placeholder="e.g. Stripe"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1">Role / Job Title *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-background-elevated border border-border-subtle rounded-input px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                    placeholder="e.g. Backend Software Engineer"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1">Pipeline Stage</label>
                  <select
                    className="w-full bg-background-elevated border border-border-subtle rounded-input px-2 py-2 text-xs text-text-primary focus:outline-none"
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                  >
                    {stages.map(stG => <option key={stG} value={stG}>{stG}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1">Salary Package</label>
                  <input
                    type="text"
                    className="w-full bg-background-elevated border border-border-subtle rounded-input px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                    placeholder="e.g. $130,000 / year"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1">Location Details</label>
                  <input
                    type="text"
                    className="w-full bg-background-elevated border border-border-subtle rounded-input px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                    placeholder="e.g. Mountain View, CA (Hybrid)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1">Follow-up Reminder</label>
                  <input
                    type="date"
                    className="w-full bg-background-elevated border border-border-subtle rounded-input px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1">Job Details & Notes</label>
                  <textarea
                    rows={3}
                    className="w-full bg-background-elevated border border-border-subtle rounded-input p-3 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                    placeholder="Interview details, contact person, preparation links..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-accent-primary hover:bg-accent-primary/95 text-white py-2.5 rounded-btn text-xs font-bold flex justify-center items-center gap-1.5 transition-all transform active:scale-95 disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save Pipeline Changes"}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
