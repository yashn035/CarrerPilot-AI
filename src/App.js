import React, { useState, useEffect } from 'react';
import { useUser } from './context/UserContext';
import AuthPage from './components/AuthPage';
import Onboarding from './components/Onboarding';

// Modules imports
import Dashboard from './modules/Dashboard';
import ResumeBuilder from './modules/ResumeBuilder';
import CodingArena from './modules/CodingArena.js';
import MockInterview from './modules/MockInterview';
import SkillGap from './modules/SkillGap';
import Settings from './modules/Settings';
import AIMentor from './modules/AIMentor';
import JobTracker from './modules/JobTracker';

import { 
  Home, FileText, BarChart3, Code, Cpu, 
  Layers, Award, Mic, AlertTriangle, Brain, 
  Trophy, Globe, MessageSquare, Settings as SettingsIcon,
  ChevronLeft, ChevronRight, Bell, Search, LogOut, Sparkles, X,
  Shield, Briefcase
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const { 
    user, loading, activeTab, setActiveTab, toasts, 
    showLevelUp, setShowLevelUp, levelUpData, logout 
  } = useUser();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const res = await fetch('/api/dashboard/stats', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (res.ok) {
            const data = await res.json();
            setNotifications(data.activityTimeline || []);
          }
        } catch (err) {
          console.error("Failed to fetch notifications:", err);
        }
      };
      fetchNotifications();
      
      const interval = setInterval(fetchNotifications, 8000);
      return () => clearInterval(interval);
    }
  }, [user, activeTab]);

  // Fire level-up confetti
  useEffect(() => {
    if (showLevelUp) {
      confetti({
        particleCount: 150,
        spread: 85,
        origin: { y: 0.6 }
      });
    }
  }, [showLevelUp]);

  // Command-K keyboard shortcut for global search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-semibold text-text-secondary font-mono tracking-wider uppercase">Loading Career OS...</span>
      </div>
    );
  }

  // Auth & Onboarding checks
  if (!user) {
    return <AuthPage />;
  }

  if (!user.onboarded) {
    return <Onboarding />;
  }

  // Map sidebar tabs to icons and components
  const navigationItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: Home, component: Dashboard },
    { id: 'AIMentor', label: 'AI Mentor', icon: MessageSquare, component: AIMentor },
    { id: 'ResumeBuilder', label: 'Resume Builder', icon: FileText, component: ResumeBuilder },
    { id: 'CodingArena', label: 'Coding Arena', icon: Code, component: CodingArena },
    { id: 'MockInterview', label: 'Mock Interviews', icon: Mic, component: MockInterview },
    { id: 'JobTracker', label: 'Job Tracker', icon: Briefcase, component: JobTracker },
    { id: 'SkillGap', label: 'Skill Gap', icon: AlertTriangle, component: SkillGap },
    { id: 'Settings', label: 'Settings', icon: SettingsIcon, component: Settings }
  ];

  const activeItem = navigationItems.find(item => item.id === activeTab) || navigationItems[0];
  const ActiveComponent = activeItem.component;



  // Filtered search items
  const filteredNavItems = navigationItems.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#0A0A0F] text-text-primary overflow-hidden select-none">
      
      {/* LEFT COLLAPSIBLE SIDEBAR */}
      <aside 
        className={`bg-[#111118] border-r border-border-subtle flex flex-col justify-between transition-all duration-300 relative z-30 shrink-0 ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div>
          {/* Logo header */}
          <div className="p-4 border-b border-border-subtle flex items-center justify-between">
            {!sidebarCollapsed && (
              <span className="font-display text-lg font-bold tracking-tight text-text-primary">
                CareerPilot <span className="text-accent-primary">AI</span>
              </span>
            )}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-text-secondary hover:text-text-primary p-1 bg-[#1A1A26] border border-border-subtle rounded shrink-0 mx-auto"
            >
              {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Navigation Links list */}
          <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {navigationItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={sidebarCollapsed ? item.label : ''}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-btn transition-all text-xs font-semibold select-none ${
                    active 
                      ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/10' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-background-elevated'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                >
                  <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-text-secondary'}`} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom logout toggle inside sidebar */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-border-subtle">
            <button
              onClick={logout}
              className="w-full bg-background-elevated hover:bg-accent-danger/10 border border-border-subtle hover:border-accent-danger/20 hover:text-accent-danger text-text-secondary px-3 py-2 rounded-btn font-semibold text-xs flex items-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4 shrink-0" /> Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* MAIN LAYOUT BODY */}
      <div className="flex-grow flex flex-col min-w-0 overflow-hidden relative">
        
        {/* TOPBAR */}
        <header className="h-16 bg-[#111118] border-b border-border-subtle flex justify-between items-center px-6 select-none shrink-0 relative z-20">
          
          {/* Topbar Search indicator */}
          <button 
            onClick={() => setShowGlobalSearch(true)}
            className="flex items-center gap-2 bg-[#0A0A0F] border border-border-subtle px-3 py-1.5 rounded text-xs text-text-secondary hover:text-text-primary hover:border-text-muted transition-all select-none w-56 text-left"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search modules...</span>
            <span className="ml-auto font-mono text-[9px] px-1 py-0.2 bg-background-elevated border border-border-subtle rounded">Ctrl+K</span>
          </button>

          {/* XP details and avatar dropdowns */}
          <div className="flex items-center gap-5">
            
            {/* XP progress tag */}
            <div className="hidden sm:flex items-center gap-3 bg-background-primary border border-border-subtle rounded-btn px-4 py-1.5 text-xs">
              <span className="font-bold text-accent-gold select-none font-mono">Lvl {user.level}</span>
              <div className="w-24 bg-background-elevated h-1.5 rounded-full overflow-hidden border border-border-subtle shrink-0">
                <div 
                  className="bg-accent-gold h-full"
                  style={{ width: `${(user.xp / (user.level * 300)) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Notification bell and tray */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-text-secondary hover:text-text-primary p-2 bg-[#1A1A26] border border-border-subtle rounded relative"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-accent-primary rounded-full"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-[#111118] border border-border-subtle rounded-card shadow-2xl z-50 p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-border-subtle pb-2 select-none">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">System Notifications</span>
                    <button onClick={() => setShowNotifications(false)} className="text-text-muted hover:text-text-primary"><X className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="space-y-2.5 max-h-56 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className="text-[11px] p-2 bg-background-elevated rounded border border-border-subtle flex flex-col gap-1 justify-between text-left">
                        <span className="text-text-primary font-semibold leading-normal">{n.title}</span>
                        {n.message && <span className="text-[10px] text-text-secondary leading-snug">{n.message}</span>}
                        <span className="text-[9px] text-text-muted mt-0.5 font-mono">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar block */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-xs font-bold text-accent-primary select-none">
                AM
              </div>
              <div className="hidden md:block text-left text-xs font-semibold">
                <div className="text-text-primary truncate max-w-28">{user.name}</div>
                <div className="text-text-muted text-[10px] truncate max-w-28">{user.targetRole}</div>
              </div>
            </div>

          </div>

        </header>

        {/* ACTIVE MODULE CONTAINER VIEWPORT */}
        <main className="flex-grow overflow-y-auto relative z-10 bg-[#0A0A0F]">
          <ActiveComponent />
        </main>

        {/* TOAST MESSAGE LISTS (bottom right float) */}
        <div className="fixed bottom-4 right-4 z-50 space-y-2.5 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`p-3.5 rounded-card border text-xs font-semibold shadow-2xl flex items-center gap-2 pointer-events-auto transition-all duration-300 transform translate-y-0 ${
                toast.type === 'error' ? 'bg-accent-danger/10 border-accent-danger/25 text-accent-danger' : 
                toast.type === 'gold' ? 'bg-accent-gold/10 border-accent-gold/25 text-accent-gold' : 
                toast.type === 'info' ? 'bg-background-elevated border-border-subtle text-text-primary' :
                'bg-accent-secondary/10 border-accent-secondary/25 text-accent-secondary'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{toast.message}</span>
            </div>
          ))}
        </div>

        {/* LEVEL UP MODAL DIALOG */}
        {showLevelUp && (
          <div className="fixed inset-0 bg-[#0A0A0F]/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-background-surface border border-accent-gold/30 p-8 rounded-card shadow-2xl text-center space-y-6 relative overflow-hidden animate-float">
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/5 rounded-full blur-2xl"></div>

              <div className="w-20 h-20 bg-accent-gold/10 border border-accent-gold/30 rounded-full flex items-center justify-center text-accent-gold mx-auto animate-bounce">
                <Trophy className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-accent-gold flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Level Up Celebrated!
                </span>
                <h2 className="text-3xl font-display font-bold text-text-primary">SYNC LEVEL INCREASE</h2>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Your placement readiness vectors have synchronized to a new standard baseline. Keep optimizing tasks!
                </p>
              </div>

              <div className="flex justify-center items-center gap-5 font-mono text-sm py-4 border-t border-b border-border-subtle">
                <div className="text-text-secondary">Level {levelUpData.old}</div>
                <div className="text-accent-gold font-bold">→</div>
                <div className="text-text-primary font-bold">Level {levelUpData.new}</div>
              </div>

              <button
                onClick={() => setShowLevelUp(false)}
                className="w-full bg-accent-gold hover:bg-accent-gold/90 text-background-primary py-3 rounded-btn font-bold text-sm transform active:scale-95 transition-all"
              >
                Sync Complete
              </button>

            </div>
          </div>
        )}

        {/* COMMAND K GLOBAL SEARCH DIALOG */}
        {showGlobalSearch && (
          <div 
            className="fixed inset-0 bg-background-primary/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-24"
            onClick={() => setShowGlobalSearch(false)}
          >
            <div 
              className="max-w-xl w-full bg-[#111118] border border-border-subtle rounded-card shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search bar */}
              <div className="p-4 border-b border-border-subtle flex items-center gap-3 bg-background-elevated">
                <Search className="w-4 h-4 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search and open modules..."
                  className="bg-transparent focus:outline-none text-xs text-text-primary w-full"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  onClick={() => setShowGlobalSearch(false)} 
                  className="text-text-muted hover:text-text-primary font-mono text-[9px] px-1.5 py-0.5 bg-background-surface border border-border-subtle rounded"
                >
                  ESC
                </button>
              </div>

              {/* Suggestions results */}
              <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                {filteredNavItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setShowGlobalSearch(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-3 hover:bg-background-elevated rounded-btn text-xs font-semibold flex items-center gap-3 text-text-secondary hover:text-text-primary transition-all"
                  >
                    <item.icon className="w-4 h-4 text-text-secondary" />
                    <span>{item.label}</span>
                    <span className="ml-auto text-[9px] text-text-muted">Launch</span>
                  </button>
                ))}
                {filteredNavItems.length === 0 && (
                  <div className="text-center py-4 text-xs text-text-muted italic">No matching modules found.</div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
