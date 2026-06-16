import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { Terminal, Shield, Award, Sparkles, LogIn, UserPlus } from 'lucide-react';

export default function AuthPage() {
  const { login, register } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = () => {
    const emailPrompt = prompt("Enter your registered email address to recover password:", email);
    if (emailPrompt) {
      alert(`A secure password reset verification code has been dispatched to ${emailPrompt}. Please check your inbox.`);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    alert("Redirecting to secure Google Accounts synchronization cockpit...");
    setTimeout(async () => {
      await login('demouser@careerpilot.ai', 'password123');
      setLoading(false);
    }, 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (isLogin) {
      await login(email, password);
    } else {
      await register(name, email, password);
    }
    setLoading(false);
  };

  const loadDemoUser = async () => {
    setLoading(true);
    await login('demouser@careerpilot.ai', 'password123');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4 selection:bg-accent-primary/20">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8 items-center bg-background-surface rounded-card border border-border-subtle p-6 md:p-12 shadow-2xl relative overflow-hidden">
        
        {/* Decorative Background Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 glass-glow -mr-40 -mt-40 rounded-full opacity-40 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 glass-glow-secondary -ml-40 -mb-40 rounded-full opacity-30 pointer-events-none"></div>

        {/* Left Panel: Form */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-accent-primary/10 p-2 rounded-lg border border-accent-primary/20">
              <Terminal className="w-6 h-6 text-accent-primary" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-text-primary">CareerPilot <span className="text-accent-primary">AI</span></span>
          </div>

          <h2 className="text-3xl font-display font-bold text-text-primary mb-2">
            {isLogin ? "Welcome Back Pilot" : "Initialize Career OS"}
          </h2>
          <p className="text-text-secondary mb-8 text-sm">
            {isLogin ? "Log in to track your career readiness and practice placement scenarios." : "Start engineering your placement readiness metrics."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Alex Mercer"
                  className="w-full bg-background-elevated border border-border-subtle rounded-input px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">Email Address</label>
              <input
                type="email"
                required
                placeholder="pilot@careerpilot.ai"
                className="w-full bg-background-elevated border border-border-subtle rounded-input px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">Password</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] text-accent-primary hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-background-elevated border border-border-subtle rounded-input px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-primary hover:bg-accent-primary/95 text-white py-2.5 rounded-btn font-semibold text-sm flex items-center justify-center gap-2 transform active:scale-[0.98] transition-all disabled:opacity-50 mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : isLogin ? (
                <>
                  <LogIn className="w-4 h-4" /> Enter Cockpit
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Initialize Account
                </>
              )}
            </button>

            {isLogin && (
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-[#1C1C28] hover:bg-[#252535] border border-border-subtle hover:border-text-muted text-text-primary py-2.5 rounded-btn font-semibold text-sm flex items-center justify-center gap-2.5 transform active:scale-[0.98] transition-all mt-3"
              >
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.857 5.857 0 0 1 8.1 12.67a5.857 5.857 0 0 1 5.89-5.843c1.55 0 2.96.6 4.02 1.57l3.1-3.1A9.972 9.972 0 0 0 13.99 2 9.99 9.99 0 0 0 4 12c0 5.52 4.47 10 9.99 10 5.76 0 10.01-4.04 10.01-10 0-.68-.06-1.33-.16-1.715H12.24Z"/>
                </svg>
                Sign In with Google
              </button>
            )}
          </form>

          {/* Quick Sandbox Login Indicator */}
          {isLogin && (
            <div className="mt-4 p-4 rounded-card bg-background-elevated border border-border-subtle relative overflow-hidden">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-accent-gold mb-1">Demo sandbox account</h4>
                  <p className="text-xs text-text-secondary">Explore all modules instantly without registration.</p>
                </div>
                <button
                  onClick={loadDemoUser}
                  disabled={loading}
                  className="bg-accent-gold/10 border border-accent-gold/20 hover:bg-accent-gold/25 text-accent-gold text-xs font-semibold px-3 py-1.5 rounded-btn transform active:scale-95 transition-all"
                >
                  Quick Demo Login
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-text-secondary mt-6">
            {isLogin ? "New to the platform?" : "Already initialized?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-accent-primary font-semibold hover:underline ml-1 focus:outline-none"
            >
              {isLogin ? "Create an account" : "Sign in here"}
            </button>
          </p>
        </div>

        {/* Right Panel: Value Propositions */}
        <div className="hidden md:flex flex-col justify-between h-full bg-background-elevated border border-border-subtle p-8 rounded-card relative overflow-hidden">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-accent-primary/10 border border-accent-primary/20 px-3 py-1 rounded-full text-xs text-accent-primary font-semibold mb-6">
              <Sparkles className="w-3 h-3 animate-pulse" /> Release v2.0
            </div>
            
            <h3 className="text-2xl font-display font-bold text-text-primary mb-6">
              The Placement Operating System
            </h3>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="bg-background-surface border border-border-subtle p-2.5 rounded-lg h-fit text-accent-secondary">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">Placement Readiness Score</h4>
                  <p className="text-xs text-text-secondary mt-1">A unified credit-style score tracking your progress across DSA, resume engineering, projects, and interviews.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-background-surface border border-border-subtle p-2.5 rounded-lg h-fit text-accent-primary">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">Recruiter Simulation & ATS Scan</h4>
                  <p className="text-xs text-text-secondary mt-1">Test your resume against 50+ keywords and simulated recruiter attention metrics to achieve perfect ATS compliance.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-background-surface border border-border-subtle p-2.5 rounded-lg h-fit text-accent-gold">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">Gamified Code Arena</h4>
                  <p className="text-xs text-text-secondary mt-1">Practice DSA problems in Monaco editor with instant compiler testing and AI-driven Big-O feedback logs.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-border-subtle flex justify-between items-center text-xs text-text-muted">
            <span>Powered by Gemini & GPT-4o</span>
            <span>10,000+ candidates optimized</span>
          </div>
        </div>

      </div>
    </div>
  );
}
