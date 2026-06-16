import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { Users, Server, DollarSign, Database, Plus, ShieldAlert, Cpu, BarChart3, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from 'recharts';

export default function AdminPanel() {
  const { getAuthHeaders, addToast } = useUser();
  const [activeAdminTab, setActiveAdminTab] = useState('Stats');
  
  // Analytics State
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Coding Problem Creator State
  const [probId, setProbId] = useState('');
  const [probTitle, setProbTitle] = useState('');
  const [probDifficulty, setProbDifficulty] = useState('Easy');
  const [probCategory, setProbCategory] = useState('Arrays');
  const [probTags, setProbTags] = useState('');
  const [probDesc, setProbDesc] = useState('');
  const [submittingProb, setSubmittingProb] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetch('/api/admin/stats', { headers: getAuthHeaders() });
      if (statsRes.ok) setStats(await statsRes.json());

      const usersRes = await fetch('/api/admin/users', { headers: getAuthHeaders() });
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (err) {
      console.error(err);
      addToast("Failed to fetch admin stats.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!probId || !probTitle) {
      addToast("Problem ID and Title are required", "error");
      return;
    }
    setSubmittingProb(true);

    const payload = {
      id: probId.toLowerCase().replace(/\s+/g, '-'),
      title: probTitle,
      difficulty: probDifficulty,
      category: probCategory,
      tags: probTags,
      description: probDesc,
      examples: [
        { input: "nums = [2,7,11,15], target = 9", output: "[0,1]" }
      ],
      constraints: ["1 <= nums.length <= 10^3"]
    };

    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        addToast("Coding problem registered in database bank!", "success");
        setProbId('');
        setProbTitle('');
        setProbTags('');
        setProbDesc('');
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast(errData.message || "Failed to create question.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Server network connection timeout.", "error");
    } finally {
      setSubmittingProb(false);
    }
  };

  // Mock revenue chart growth
  const revenueHistory = [
    { month: 'Jan', Sales: 120 },
    { month: 'Feb', Sales: 280 },
    { month: 'Mar', Sales: 450 },
    { month: 'Apr', Sales: 620 },
    { month: 'May', Sales: 890 },
    { month: 'Jun', Sales: stats?.revenue || 1200 }
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-4 md:p-6 pb-20 text-left select-none overflow-y-auto h-[calc(100vh-64px)]">
      
      {/* Title */}
      <div className="flex justify-between items-center pb-4 border-b border-border-subtle">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-accent-danger" /> Placement Operating Console
          </h1>
          <p className="text-xs text-text-secondary mt-1">Global administrative dashboard. Audit active candidate profiles, system performance telemetry, and AI costs.</p>
        </div>
        <button
          onClick={fetchAdminData}
          className="p-2 bg-background-elevated border border-border-subtle hover:border-text-muted rounded text-text-secondary hover:text-text-primary transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-border-subtle bg-background-elevated/20 rounded-t-card overflow-x-auto shrink-0 select-none">
        {[
          { id: 'Stats', label: 'Telemetry & Finance', icon: BarChart3 },
          { id: 'Users', label: 'User Directory', icon: Users },
          { id: 'Questions', label: 'Coding Content Mgmt', icon: Plus }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveAdminTab(tab.id)}
            className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${activeAdminTab === tab.id
              ? 'border-accent-danger text-text-primary bg-background-primary/30'
              : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-accent-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* TELEMETRY & STATS TAB */}
          {activeAdminTab === 'Stats' && stats && (
            <div className="space-y-6">
              
              {/* Telemetry Widgets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Registered Candidates', icon: Users, color: 'text-accent-primary bg-accent-primary/10 border-accent-primary/20', value: stats.totalUsers },
                  { label: 'Simulated MRR Revenue', icon: DollarSign, color: 'text-accent-secondary bg-accent-secondary/10 border-accent-secondary/20', value: `$${stats.revenue}` },
                  { label: 'Piston Sandboxed Submits', icon: Database, color: 'text-accent-gold bg-accent-gold/10 border-accent-gold/20', value: stats.totalSubmissions },
                  { label: 'System Uptime Status', icon: Server, color: 'text-accent-danger bg-accent-danger/10 border-accent-danger/20', value: stats.systemUptime }
                ].map((item, i) => (
                  <div key={i} className="p-5 bg-background-surface border border-border-subtle rounded-card flex items-center gap-4 relative overflow-hidden">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${item.color}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-text-secondary font-semibold uppercase block mb-1">{item.label}</span>
                      <span className="text-xl font-bold text-text-primary font-mono">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Revenue Recharts Graph */}
                <div className="lg:col-span-2 bg-background-surface border border-border-subtle rounded-card p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-4">Demo MRR Subscription Index</h3>
                  <div className="w-full h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF476F" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#EF476F" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1A1A26" />
                        <XAxis dataKey="month" stroke="#8888AA" fontSize={10} />
                        <YAxis stroke="#8888AA" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#111118', borderColor: '#2A2A3A', borderRadius: '6px' }} />
                        <Area type="monotone" dataKey="Sales" stroke="#EF476F" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* AI Cost Telemetry logs */}
                <div className="lg:col-span-1 bg-background-surface border border-border-subtle rounded-card p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-1">
                      <Cpu className="w-4 h-4 text-accent-primary" /> AI Key Orchestration Telemetry
                    </h3>
                    <div className="space-y-3 font-mono text-[11px] text-text-secondary leading-relaxed">
                      <div className="p-3 bg-background-elevated rounded border border-border-subtle flex justify-between">
                        <span>Total AI Model Requests:</span>
                        <span className="font-bold text-text-primary">{stats.aiModelCallsCount} calls</span>
                      </div>
                      <div className="p-3 bg-background-elevated rounded border border-border-subtle flex justify-between">
                        <span>Gemini Latency Index:</span>
                        <span className="font-bold text-accent-secondary">1.25s average</span>
                      </div>
                      <div className="p-3 bg-background-elevated rounded border border-border-subtle flex justify-between">
                        <span>Piston compiler sandbox:</span>
                        <span className="font-bold text-accent-gold">Success 100%</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-text-muted mt-4">
                    CareerPilot routes calls to Gemini v1.5 API securely with offline failovers during network disconnections.
                  </p>
                </div>

              </div>

            </div>
          )}

          {/* USER DIRECTORY TAB */}
          {activeAdminTab === 'Users' && (
            <div className="bg-background-surface border border-border-subtle rounded-card p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-4">Active Placement Candidate Records</h3>
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle text-text-secondary text-[10px] uppercase tracking-wider bg-background-elevated/40">
                      <th className="p-3">Candidate Name</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Level Rank</th>
                      <th className="p-3">Readiness Index</th>
                      <th className="p-3">Onboarded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle text-text-secondary">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-background-elevated/20 transition-colors">
                        <td className="p-3 font-semibold text-text-primary">{u.name}</td>
                        <td className="p-3 text-text-muted">{u.email}</td>
                        <td className="p-3 font-bold text-accent-gold">Lvl {u.level}</td>
                        <td className="p-3 font-bold text-accent-secondary">{u.readinessScore}%</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.onboarded 
                              ? 'bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20' 
                              : 'bg-accent-danger/10 text-accent-danger border border-accent-danger/20'
                          }`}>
                            {u.onboarded ? 'SYNCED' : 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CODING CONTENT MANAGEMENT TAB */}
          {activeAdminTab === 'Questions' && (
            <div className="bg-background-surface border border-border-subtle rounded-card p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-4 border-b border-border-subtle pb-2">Add Custom Coding Challenge</h3>
              
              <form onSubmit={handleCreateQuestion} className="space-y-4 max-w-2xl text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Problem ID (lowercase hyphenated) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. reverse-linked-list"
                      className="w-full bg-background-elevated border border-border-subtle rounded-input px-3.5 py-2 text-text-primary focus:outline-none focus:border-accent-primary"
                      value={probId}
                      onChange={(e) => setProbId(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Problem Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Reverse a Linked List"
                      className="w-full bg-background-elevated border border-border-subtle rounded-input px-3.5 py-2 text-text-primary focus:outline-none focus:border-accent-primary"
                      value={probTitle}
                      onChange={(e) => setProbTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Difficulty Tier</label>
                    <select
                      className="w-full bg-background-elevated border border-border-subtle rounded-input px-2.5 py-2 text-text-primary focus:outline-none"
                      value={probDifficulty}
                      onChange={(e) => setProbDifficulty(e.target.value)}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Category Topic</label>
                    <select
                      className="w-full bg-background-elevated border border-border-subtle rounded-input px-2.5 py-2 text-text-primary focus:outline-none"
                      value={probCategory}
                      onChange={(e) => setProbCategory(e.target.value)}
                    >
                      {['Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs', 'DP'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Tag Keywords (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Linked List, Recursion, Two Pointer"
                      className="w-full bg-background-elevated border border-border-subtle rounded-input px-3.5 py-2 text-text-primary focus:outline-none focus:border-accent-primary"
                      value={probTags}
                      onChange={(e) => setProbTags(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Problem Description Requirements</label>
                    <textarea
                      rows={5}
                      required
                      placeholder="Describe the algorithm challenge constraints, parameters, and input/output expectations..."
                      className="w-full bg-background-elevated border border-border-subtle rounded-input p-3 text-text-primary focus:outline-none focus:border-accent-primary font-mono text-[11px]"
                      value={probDesc}
                      onChange={(e) => setProbDesc(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingProb}
                  className="bg-accent-danger hover:bg-accent-danger/95 text-white font-bold px-5 py-2.5 rounded-btn flex items-center gap-1.5 transform active:scale-95 transition-all shadow-md shadow-accent-danger/10"
                >
                  {submittingProb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Register Coding Challenge
                </button>
              </form>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
