import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { Target, Cpu, Check, ArrowRight, ArrowLeft, Loader } from 'lucide-react';

export default function Onboarding() {
  const { completeOnboarding, addToast } = useUser();
  const [step, setStep] = useState(1);
  const [targetRole, setTargetRole] = useState('Frontend Engineer');
  const [selectedCompanies, setSelectedCompanies] = useState(['Google']);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Student');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [graduationYear, setGraduationYear] = useState('2026');
  const [calibrating, setCalibrating] = useState(false);
  const [simulatedScore, setSimulatedScore] = useState(0);

  const roles = [
    'Frontend Engineer',
    'Backend Engineer',
    'Full-Stack Developer',
    'Software Development Engineer (SDE I)',
    'Data Scientist / ML Engineer'
  ];

  const companiesList = [
    'Google', 'Amazon', 'Stripe', 'Meta', 'Netflix', 'Microsoft', 'Uber', 'Apple', 'Atlassian'
  ];

  const presetSkills = {
    'Frontend Engineer': ['React', 'JavaScript', 'HTML5', 'CSS3', 'Tailwind CSS', 'TypeScript', 'Git'],
    'Backend Engineer': ['Node.js', 'Express', 'SQL', 'MongoDB', 'Python', 'Docker', 'REST APIs', 'Git'],
    'Full-Stack Developer': ['React', 'Node.js', 'Express', 'JavaScript', 'MongoDB', 'SQL', 'Git', 'Tailwind CSS'],
    'Software Development Engineer (SDE I)': ['Java', 'C++', 'Python', 'DSA', 'OOPs', 'SQL', 'Git', 'Unit Testing'],
    'Data Scientist / ML Engineer': ['Python', 'Pandas', 'NumPy', 'Scikit-Learn', 'SQL', 'TensorFlow', 'Deep Learning']
  };

  const handleRoleSelect = (role) => {
    setTargetRole(role);
    // Autofill some standard skills
    setSkills(presetSkills[role] || []);
  };

  const toggleCompany = (company) => {
    if (selectedCompanies.includes(company)) {
      setSelectedCompanies(selectedCompanies.filter(c => c !== company));
    } else {
      setSelectedCompanies([...selectedCompanies, company]);
    }
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const runCalibration = async () => {
    setCalibrating(true);
    
    // Simulate complex calculation loading
    let current = 0;
    const targetScore = Math.min(40 + skills.length * 4, 75);
    
    const interval = setInterval(() => {
      current += 2;
      if (current >= targetScore) {
        clearInterval(interval);
        setSimulatedScore(targetScore);
        
        setTimeout(async () => {
          await completeOnboarding(targetRole, skills, experienceLevel, college, branch, graduationYear);
        }, 1000);
      } else {
        setSimulatedScore(current);
      }
    }, 50);
  };

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4 selection:bg-accent-primary/20">
      <div className="max-w-2xl w-full bg-background-surface rounded-card border border-border-subtle p-8 shadow-2xl relative min-h-[500px] flex flex-col justify-between">
        
        {/* Calibrating Loading Overlay */}
        {calibrating && (
          <div className="absolute inset-0 bg-background-surface rounded-card z-50 flex flex-col items-center justify-center p-8 text-center transition-all duration-300">
            <div className="relative mb-6">
              <Cpu className="w-16 h-16 text-accent-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-display font-semibold text-text-primary">{simulatedScore}</span>
              </div>
            </div>
            
            <h3 className="text-2xl font-display font-bold text-text-primary mb-2">Analyzing Placement Vector...</h3>
            <p className="text-text-secondary text-sm max-w-sm mb-6">
              AI is scanning your initial skill matrix, matching target role requirements, and compiling your Baseline Placement Readiness Score.
            </p>

            <div className="w-full bg-background-elevated h-2.5 rounded-full overflow-hidden border border-border-subtle max-w-md">
              <div 
                className="bg-accent-primary h-full transition-all duration-75"
                style={{ width: `${(simulatedScore / 75) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Step Indicator Header */}
        <div className="flex justify-between items-center pb-6 border-b border-border-subtle">
          <div>
            <span className="text-xs font-semibold text-accent-primary uppercase tracking-widest">Calibration Phase</span>
            <h3 className="text-lg font-display font-bold text-text-primary mt-1">Profile Synchronization</h3>
          </div>
          <span className="text-sm font-mono text-text-secondary">Step {step} of 5</span>
        </div>

        {/* STEP 1: TARGET ROLE */}
        {step === 1 && (
          <div className="my-8 space-y-4 flex-grow">
            <h4 className="text-sm font-semibold text-text-primary mb-4">Select your primary placement objective:</h4>
            <div className="grid gap-3">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleSelect(role)}
                  className={`w-full text-left p-4 rounded-card border flex justify-between items-center transition-all ${
                    targetRole === role 
                      ? 'bg-accent-primary/10 border-accent-primary text-text-primary' 
                      : 'bg-background-elevated border-border-subtle text-text-secondary hover:border-text-muted hover:text-text-primary'
                  }`}
                >
                  <span className="font-semibold text-sm">{role}</span>
                  {targetRole === role && <Check className="w-4 h-4 text-accent-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: TARGET COMPANIES */}
        {step === 2 && (
          <div className="my-8 space-y-4 flex-grow">
            <h4 className="text-sm font-semibold text-text-primary mb-2">Select companies you wish to target:</h4>
            <p className="text-xs text-text-secondary mb-4">We will customize keyword optimization and coding roadmap weights around these companies.</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {companiesList.map((company) => {
                const isSelected = selectedCompanies.includes(company);
                return (
                  <button
                    key={company}
                    onClick={() => toggleCompany(company)}
                    className={`p-3.5 rounded-card border text-sm font-medium transition-all ${
                      isSelected 
                        ? 'bg-accent-secondary/10 border-accent-secondary text-text-primary' 
                        : 'bg-background-elevated border-border-subtle text-text-secondary hover:border-text-muted hover:text-text-primary'
                    }`}
                  >
                    {company}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: INITIAL SKILLS MATRIX */}
        {step === 3 && (
          <div className="my-8 space-y-4 flex-grow">
            <h4 className="text-sm font-semibold text-text-primary mb-1">Set up your current Skill Matrix:</h4>
            <p className="text-xs text-text-secondary mb-4">Add or confirm skills you have baseline competence in. More skills increases your initial Readiness Score.</p>

            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Docker, Python, Redux..."
                className="flex-grow bg-background-elevated border border-border-subtle rounded-input px-4 py-2 text-sm focus:outline-none focus:border-accent-primary"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
              />
              <button 
                type="submit"
                className="bg-accent-primary hover:bg-accent-primary/90 text-white px-4 rounded-btn font-semibold text-sm transition-all"
              >
                Add
              </button>
            </form>

            <div className="flex flex-wrap gap-2 pt-4">
              {skills.map((skill) => (
                <div 
                  key={skill} 
                  className="bg-background-elevated border border-border-subtle px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 text-text-primary"
                >
                  {skill}
                  <button 
                    onClick={() => removeSkill(skill)}
                    className="text-text-muted hover:text-accent-danger font-bold text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              {skills.length === 0 && (
                <span className="text-xs text-text-muted italic">No skills listed yet. Add some skills above.</span>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: ACADEMIC DETAILS */}
        {step === 4 && (
          <div className="my-8 space-y-4 flex-grow">
            <h4 className="text-sm font-semibold text-text-primary mb-2">Academic Information</h4>
            <p className="text-xs text-text-secondary mb-4">Enter your academic details. These are highlighted on your placement vector profile.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">College Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stanford University"
                  className="w-full bg-background-elevated border border-border-subtle rounded-input px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Branch / Degree</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science"
                    className="w-full bg-background-elevated border border-border-subtle rounded-input px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
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
            </div>
          </div>
        )}

        {/* STEP 5: EXPERIENCE LEVEL */}
        {step === 5 && (
          <div className="my-8 space-y-4 flex-grow">
            <h4 className="text-sm font-semibold text-text-primary mb-4">What is your current experience tier?</h4>
            <div className="grid gap-3">
              {[
                { tier: 'Student', label: 'College Student (Graduating 2026/27)' },
                { tier: 'Graduate', label: 'Fresh Graduate seeking jobs' },
                { tier: 'Junior', label: 'Early Professional (< 2 years experience)' }
              ].map((item) => (
                <button
                  key={item.tier}
                  onClick={() => setExperienceLevel(item.tier)}
                  className={`w-full text-left p-4 rounded-card border flex justify-between items-center transition-all ${
                    experienceLevel === item.tier 
                      ? 'bg-accent-primary/10 border-accent-primary text-text-primary' 
                      : 'bg-background-elevated border-border-subtle text-text-secondary hover:border-text-muted hover:text-text-primary'
                  }`}
                >
                  <span className="font-semibold text-sm">{item.label}</span>
                  {experienceLevel === item.tier && <Check className="w-4 h-4 text-accent-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-border-subtle mt-auto">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="border border-border-subtle hover:bg-background-elevated text-text-primary px-4 py-2 rounded-btn font-semibold text-sm flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div></div> // Placeholder to keep next on right
          )}

          {step < 5 ? (
            <button
              onClick={() => {
                if (step === 4 && (!college.trim() || !branch.trim())) {
                  addToast("Please fill in your College and Branch details.", "error");
                  return;
                }
                setStep(step + 1);
              }}
              className="bg-accent-primary hover:bg-accent-primary/95 text-white px-5 py-2 rounded-btn font-semibold text-sm flex items-center gap-1.5 transition-all transform active:scale-95 ml-auto"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={runCalibration}
              className="bg-accent-primary hover:bg-accent-primary/95 text-white px-6 py-2 rounded-btn font-semibold text-sm flex items-center gap-2 transition-all transform active:scale-95 ml-auto animate-pulse-subtle"
            >
              <Target className="w-4 h-4" /> Calibrate Placement Score
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
