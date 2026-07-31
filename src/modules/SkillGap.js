import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, Legend 
} from 'recharts';
import { 
  Briefcase, BookOpen, AlertTriangle, CheckCircle, 
  ArrowRight, ExternalLink, HelpCircle 
} from 'lucide-react';

export default function SkillGap() {
  const { user, getAuthHeaders, addToast } = useUser();
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [jobAnalysis, setJobAnalysis] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch('/api/jobs', { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setJobs(data);
          if (data.length > 0) {
            setSelectedJobId(data[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId && user) {
      const job = jobs.find(j => j.id === selectedJobId);
      if (!job) return;

      // Calculate matching vs missing skills
      const currentSkillNames = user.skills.map(s => s.name.toLowerCase());
      const requiredSkills = job.requiredSkills;

      const matching = [];
      const missing = [];

      requiredSkills.forEach(req => {
        const foundIdx = currentSkillNames.indexOf(req.toLowerCase());
        if (foundIdx !== -1) {
          matching.push({ name: req, level: user.skills[foundIdx].level });
        } else {
          missing.push({ name: req, level: 0 });
        }
      });

      // Assemble radar compare data
      const radarCompare = requiredSkills.map(req => {
        const foundIdx = currentSkillNames.indexOf(req.toLowerCase());
        return {
          subject: req,
          Required: 4, // Employer benchmark Lvl 4/5
          Current: foundIdx !== -1 ? user.skills[foundIdx].level : 0
        };
      });

      // Courses recommendation based on missing
      const courseMap = {
        'typescript': { title: 'TypeScript Masterclass', platform: 'Udemy', time: '12 Hours', link: '#' },
        'docker': { title: 'Docker & Kubernetes Deep Dive', platform: 'Coursera', time: '20 Hours', link: '#' },
        'rest apis': { title: 'Designing RESTful APIs', platform: 'Coursera', time: '8 Hours', link: '#' },
        'system design': { title: 'Grokking the System Design Interview', platform: 'Educative', time: '15 Hours', link: '#' },
        'java': { title: 'Java Software Development Specialization', platform: 'edX', time: '30 Hours', link: '#' },
        'dsa': { title: 'Algorithms Specialization (Stanford)', platform: 'Coursera', time: '40 Hours', link: '#' },
        'unit testing': { title: 'JavaScript Unit Testing & TDD', platform: 'Udemy', time: '10 Hours', link: '#' }
      };

      const learningRoadmap = missing.map(m => {
        const clean = m.name.toLowerCase();
        const course = courseMap[clean] || { title: `Mastering ${m.name}`, platform: 'Udemy/Coursera', time: '10 Hours', link: '#' };
        return {
          skill: m.name,
          ...course
        };
      });

      setJobAnalysis({
        company: job.company,
        role: job.role,
        salary: job.salaryEstimate,
        matching,
        missing,
        radarCompare,
        learningRoadmap
      });
    }
  }, [selectedJobId, jobs, user]);

  if (!jobAnalysis) return <div className="p-6">Compiling skills analytics...</div>;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-4 md:p-6 pb-20">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">Skills Gap Analyzer</h1>
          <p className="text-xs text-text-secondary mt-1">Audit missing skills against actual software vacancies at Google, Amazon, and Stripe.</p>
        </div>

        <div className="flex items-center gap-2">
          <Briefcase className="w-4.5 h-4.5 text-accent-primary" />
          <select
            className="bg-background-surface border border-border-subtle rounded-input px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-accent-primary text-text-primary"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
          >
            {jobs.map(j => (
              <option key={j.id} value={j.id}>{j.company} — {j.role}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Skills breakdown status chips */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Target job card */}
          <div className="glow-card p-5 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent-primary/5 rounded-full blur-xl"></div>
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block">Selected Target Vacancy</span>
            <h2 className="text-lg font-display font-bold text-text-primary">{jobAnalysis.company} — {jobAnalysis.role}</h2>
            <div className="text-xs font-mono text-accent-secondary font-semibold">Est Package: {jobAnalysis.salary}</div>
          </div>

          {/* Skill status chips list */}
          <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Job Skills Checkup</h3>
            
            <div className="space-y-3">
              <div className="text-[10px] font-bold text-accent-secondary uppercase tracking-wider">Acquired Skills Matching</div>
              <div className="space-y-2">
                {jobAnalysis.matching.map((sk, i) => (
                  <div key={i} className="p-3 bg-background-elevated border border-border-subtle rounded flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary">{sk.name}</span>
                    <span className="text-accent-secondary flex items-center gap-1 font-mono font-bold">
                      <CheckCircle className="w-3.5 h-3.5" /> Lvl {sk.level}/5
                    </span>
                  </div>
                ))}
                {jobAnalysis.matching.length === 0 && <p className="text-xs text-text-muted italic">No matching skills found in your catalog.</p>}
              </div>

              <div className="text-[10px] font-bold text-accent-danger uppercase tracking-wider pt-2">Missing Skills Gaps</div>
              <div className="space-y-2">
                {jobAnalysis.missing.map((sk, i) => (
                  <div key={i} className="p-3 bg-background-elevated border border-border-subtle rounded flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-secondary">{sk.name}</span>
                    <span className="text-accent-danger flex items-center gap-1 font-mono font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" /> Gap detected
                    </span>
                  </div>
                ))}
                {jobAnalysis.missing.length === 0 && <p className="text-xs text-accent-secondary italic">Perfect! You match all requirements.</p>}
              </div>
            </div>
          </div>

          {/* Skill status levels card */}
          <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Your Skill Levels Breakdown</h3>
            
            <div className="space-y-4">
              {/* Strong */}
              <div>
                <span className="text-[10px] font-bold text-accent-secondary uppercase tracking-wider block mb-1.5">✅ Strong (Lvl 4+)</span>
                <div className="flex flex-wrap gap-1.5">
                  {user?.skills?.filter(s => s.level >= 4).map(s => s.name).map(s => (
                    <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-accent-secondary/10 border border-accent-secondary/20 text-accent-secondary font-mono">
                      {s}
                    </span>
                  ))}
                  {(user?.skills?.filter(s => s.level >= 4).length || 0) === 0 && <span className="text-xs text-text-muted italic">None detected</span>}
                </div>
              </div>

              {/* Moderate */}
              <div className="pt-3 border-t border-border-subtle/30">
                <span className="text-[10px] font-bold text-accent-gold uppercase tracking-wider block mb-1.5">⚠ Moderate (Lvl 3)</span>
                <div className="flex flex-wrap gap-1.5">
                  {user?.skills?.filter(s => s.level === 3).map(s => s.name).map(s => (
                    <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-accent-gold/10 border border-accent-gold/20 text-accent-gold font-mono">
                      {s}
                    </span>
                  ))}
                  {(user?.skills?.filter(s => s.level === 3).length || 0) === 0 && <span className="text-xs text-text-muted italic">None detected</span>}
                </div>
              </div>

              {/* Weak */}
              <div className="pt-3 border-t border-border-subtle/30">
                <span className="text-[10px] font-bold text-accent-danger uppercase tracking-wider block mb-1.5">❌ Weak (Lvl &le; 2)</span>
                <div className="flex flex-wrap gap-1.5">
                  {user?.skills?.filter(s => s.level <= 2).map(s => s.name).map(s => (
                    <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-accent-danger/10 border border-accent-danger/20 text-accent-danger font-mono">
                      {s}
                    </span>
                  ))}
                  {(user?.skills?.filter(s => s.level <= 2).length || 0) === 0 && <span className="text-xs text-text-muted italic">None detected</span>}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right 2 columns: Radar chart compare & step courses */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Radar chart compare */}
          <div className="bg-background-surface border border-border-subtle rounded-card p-6 flex flex-col items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-4 self-start">Gap Analysis Comparison</h3>
            
            <div className="w-full h-64 flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={jobAnalysis.radarCompare}>
                  <PolarGrid stroke="#2A2A3A" />
                  <PolarAngleAxis dataKey="subject" stroke="#8888AA" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#2A2A3A" />
                  <Radar name="You" dataKey="Current" stroke="#6C63FF" fill="#6C63FF" fillOpacity={0.2} />
                  <Radar name="Employer Benchmark" dataKey="Required" stroke="#00D4AA" fill="#00D4AA" fillOpacity={0.1} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Step-by-step roadmap with course recommends */}
          <div className="bg-background-surface border border-border-subtle rounded-card p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <BookOpen className="w-4.5 h-4.5 text-accent-primary" /> Gap Remediation Learning Roadmap
            </h3>
            <p className="text-xs text-text-secondary">AI generated study path using standard online courseware targets to bridge identified skill gaps.</p>
            
            <div className="space-y-3">
              {jobAnalysis.learningRoadmap.map((roadmap, idx) => (
                <div key={idx} className="p-4 bg-background-elevated border border-border-subtle rounded-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-accent-primary uppercase tracking-widest block">Step 0{idx+1}: Study {roadmap.skill}</span>
                    <h4 className="text-xs font-bold text-text-primary">{roadmap.title}</h4>
                    <div className="text-[10px] text-text-secondary flex gap-3">
                      <span>Platform: {roadmap.platform}</span>
                      <span>Est Study time: {roadmap.time}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      addToast(`Redirecting to mock study curriculum at ${roadmap.platform}!`, "info");
                    }}
                    className="bg-accent-primary/10 border border-accent-primary/20 hover:bg-accent-primary/25 text-accent-primary text-[10px] font-bold px-3 py-1.5 rounded-btn flex items-center gap-1 shrink-0 self-start sm:self-auto"
                  >
                    Start Course <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {jobAnalysis.learningRoadmap.length === 0 && (
                <div className="text-center py-6 text-xs text-accent-secondary font-semibold">
                  No skill gaps detected. You are already fully compliant for this role!
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
