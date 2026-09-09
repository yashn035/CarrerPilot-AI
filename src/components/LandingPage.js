import React from 'react';
import { Shield, Zap, Target, ArrowRight } from 'lucide-react';

export default function LandingPage({ onLoginClick }) {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col items-center select-none overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="w-full max-w-6xl flex items-center justify-between py-6 px-6 relative z-10">
        <div className="font-display text-2xl font-bold tracking-tight">
          CareerPilot <span className="text-accent-primary">AI</span>
        </div>
        <button 
          onClick={onLoginClick}
          className="bg-accent-primary hover:bg-accent-primary/90 text-white px-6 py-2 rounded-btn font-semibold text-sm transition-all shadow-[0_0_15px_rgba(var(--color-accent-primary),0.3)]"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl px-6 py-20 text-center relative z-10">
        
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-primary/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-bold uppercase tracking-wider mb-8">
          <Zap className="w-3.5 h-3.5" />
          The Ultimate Placement OS
        </div>
        
        <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6">
          Land your dream <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">
            engineering role
          </span>
        </h1>
        
        <p className="text-text-secondary text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
          The all-in-one AI platform for software engineers. Build ATS-compliant resumes, practice competitive coding, and conquer AI-driven mock interviews.
        </p>

        <button 
          onClick={onLoginClick}
          className="flex items-center gap-3 bg-white text-background-primary px-8 py-4 rounded-btn font-bold text-lg hover:scale-105 active:scale-95 transition-all duration-300"
        >
          Get Started For Free
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-32 w-full text-left">
          <div className="bg-[#111118] p-8 rounded-card border border-border-subtle hover:border-accent-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-accent-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">ATS Resume Optimizer</h3>
            <p className="text-text-secondary text-sm">
              Instantly analyze your resume against job descriptions and let AI rewrite your weak bullet points to maximize ATS match scores.
            </p>
          </div>

          <div className="bg-[#111118] p-8 rounded-card border border-border-subtle hover:border-accent-secondary/50 transition-colors">
            <div className="w-12 h-12 rounded-full bg-accent-secondary/10 flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-accent-secondary" />
            </div>
            <h3 className="text-xl font-bold mb-3">DSA Coding Arena</h3>
            <p className="text-text-secondary text-sm">
              Practice high-frequency company-specific algorithms with real-time compilation and AI autopsies on your time/space complexity.
            </p>
          </div>

          <div className="bg-[#111118] p-8 rounded-card border border-border-subtle hover:border-accent-gold/50 transition-colors">
            <div className="w-12 h-12 rounded-full bg-accent-gold/10 flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-accent-gold" />
            </div>
            <h3 className="text-xl font-bold mb-3">AI Mock Interviews</h3>
            <p className="text-text-secondary text-sm">
              Simulate high-pressure behavioral and system design interviews with a dynamic AI recruiter that adapts to your answers.
            </p>
          </div>
        </div>
      </main>

    </div>
  );
}
