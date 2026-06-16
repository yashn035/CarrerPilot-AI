import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { 
  Mic, MicOff, Volume2, VolumeX, Play, Upload, FileText,
  Video, VideoOff, RefreshCw, Send, CheckCircle2, 
  HelpCircle, Sparkles, TrendingUp, BookOpen, AlertTriangle,
  ArrowRight, Award, Trophy, Star, ShieldAlert, Clock, ChevronRight
} from 'lucide-react';

export default function MockInterview() {
  const { getAuthHeaders, addToast, fetchProfile, user } = useUser();
  
  // Platform Steps: 'upload' | 'lobby' | 'interview' | 'result'
  const [step, setStep] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [pastedText, setPastedText] = useState('');
  
  // Parsed Resume Profile
  const [parsedProfile, setParsedProfile] = useState(null);
  
  // Settings State
  const [track, setTrack] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Medium');
  const [company, setCompany] = useState('Google');

  // Active Session State
  const [sessionId, setSessionId] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentIntro, setCurrentIntro] = useState('');
  const [currentHint, setCurrentHint] = useState('');
  const [answer, setAnswer] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  
  // Web Speech Configs
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [speechFeedback, setSpeechFeedback] = useState('');
  const [evaluation, setEvaluation] = useState(null);

  // Timer countdown
  const [timer, setTimer] = useState(240); // 4-minute timer per question
  const timerRef = useRef(null);

  // Audio waveform animation ref
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const recognitionRef = useRef(null);

  // Web Speech Synthesis (Speak text)
  const speakText = (text) => {
    if (!audioEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Start Speech Recognition
  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast("Speech Recognition not supported in this browser. Please type your response.", "info");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsRecording(true);
        setSpeechFeedback('Listening... Speak clearly.');
      };

      rec.onresult = (e) => {
        let transcript = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
        }
        setAnswer(transcript);
      };

      rec.onerror = (err) => {
        console.error(err);
        setSpeechFeedback('Speech recognition error. Please try again or type.');
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
        setSpeechFeedback('');
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Canvas Waveform Animation
  const animateWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = '#6C63FF';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      
      const isSpeaking = window.speechSynthesis.speaking;
      const amplitude = isSpeaking ? 25 : isRecording ? 10 : 3;

      for (let x = 0; x < width; x++) {
        const angle = (x / width) * Math.PI * 4 + phase;
        const y = height / 2 + Math.sin(angle) * amplitude;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      phase += 0.12;
      animationRef.current = requestAnimationFrame(render);
    };

    render();
  };

  useEffect(() => {
    if (step === 'interview') {
      animateWaveform();
      // Start the timer countdown
      setTimer(240);
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            submitAnswer(); // Auto submit if time runs out
            return 240;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, isRecording]);

  // File Upload Ingestion
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    let mimeType = file.type || '';
    const ext = file.name.split('.').pop().toLowerCase();
    
    if (!mimeType) {
      if (ext === 'pdf') mimeType = 'application/pdf';
      else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (ext === 'doc') mimeType = 'application/msword';
      else mimeType = 'text/plain';
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result.split(',')[1];
        const res = await fetch('/api/mock-interview/resume/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            fileName: file.name,
            fileData: base64Data,
            mimeType: mimeType
          })
        });

        if (res.ok) {
          const data = await res.json();
          setParsedProfile(data);
          setStep('lobby');
          addToast("Resume parsed successfully!", "success");
        } else {
          const errData = await res.json();
          addToast(errData.message || "Failed to parse resume.", "error");
        }
      } catch (err) {
        console.error(err);
        addToast("Network upload error.", "error");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Text Paste Ingestion
  const handleTextPaste = async () => {
    if (!pastedText.trim()) {
      addToast("Please paste your resume details first.", "info");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/mock-interview/resume/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ text: pastedText })
      });

      if (res.ok) {
        const data = await res.json();
        setParsedProfile(data);
        setStep('lobby');
        addToast("Text structured successfully!", "success");
      } else {
        const errData = await res.json();
        addToast(errData.message || "Failed to structure text.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Parsing connection timeout.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Start interview session
  const startInterview = async () => {
    setHistory([]);
    setEvaluation(null);
    setLoadingQuestion(true);
    setStep('interview');

    try {
      const res = await fetch('/api/mock-interview/interview/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          profileId: parsedProfile?.id,
          type: track,
          difficulty,
          company
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.sessionId);
        setCurrentQuestion(data.question);
        setCurrentIntro(data.intro || '');
        setCurrentHint(data.hint || '');
        
        speakText((data.intro ? data.intro + ". " : "") + data.question);
      } else {
        addToast("Failed to initialize cockpit.", "error");
        setStep('lobby');
      }
    } catch {
      addToast("Failed to connect.", "error");
      setStep('lobby');
    } finally {
      setLoadingQuestion(false);
    }
  };

  // Submit Answer
  const submitAnswer = async (e) => {
    if (e) e.preventDefault();
    stopRecording();
    setLoadingQuestion(true);
    
    const candidateAnswer = answer.trim() || "Candidate did not submit code details or text.";
    setAnswer('');
    setTimer(240); // Reset timer

    // Append to local history layout
    setHistory(prev => [
      ...prev,
      { role: 'interviewer', content: currentQuestion },
      { role: 'candidate', content: candidateAnswer }
    ]);

    try {
      const res = await fetch('/api/mock-interview/interview/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          sessionId,
          answer: candidateAnswer
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.finished) {
          endInterview();
        } else {
          setCurrentQuestion(data.question);
          setCurrentIntro(data.intro || '');
          setCurrentHint(data.hint || '');
          speakText((data.intro ? data.intro + ". " : "") + data.question);
        }
      } else {
        addToast("Failed to submit response.", "error");
      }
    } catch {
      addToast("Failed to send answer.", "error");
    } finally {
      setLoadingQuestion(false);
    }
  };

  // End Interview & Fetch Scorecard Evaluation
  const endInterview = async () => {
    setLoadingQuestion(true);
    setStep('result');
    window.speechSynthesis.cancel();
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const res = await fetch('/api/mock-interview/interview/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ sessionId })
      });
      if (res.ok) {
        const data = await res.json();
        setEvaluation(data.report);
        addToast("Final report card generated successfully!", "success");
        await fetchProfile(); // Update dashboard Readiness Score
        if (data.leveledUp) {
          addToast("🚀 LEVEL UP! Check your rewards on the dashboard.", "gold");
        }
      } else {
        addToast("Failed to compile evaluation score.", "error");
      }
    } catch {
      addToast("Evaluation connection failed.", "error");
    } finally {
      setLoadingQuestion(false);
    }
  };

  // Format seconds
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-4 md:p-6 pb-20 text-text-primary select-none">
      
      {/* Title */}
      <div className="flex justify-between items-center pb-4 border-b border-white/5 shrink-0">
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-indigo-400" /> AI Resume-Based Interview Cockpit
          </h1>
          <p className="text-xs text-text-secondary mt-1">Practice highly customized FAANG technical loops tailored directly to your projects, internships, and skill levels.</p>
        </div>
      </div>

      {/* STEP 1: RESUME INGESTION/UPLOAD PAGE */}
      {step === 'upload' && (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          
          {/* File Upload drag area */}
          <div className="bg-[#0b0b14]/40 border border-white/5 p-8 rounded-2xl flex flex-col justify-center items-center text-center space-y-5 min-h-[350px]">
            <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400">
              {loading ? <RefreshCw className="w-7 h-7 animate-spin" /> : <Upload className="w-7 h-7" />}
            </div>
            <div>
              <h3 className="text-sm font-bold font-display">Ingest Resume Document</h3>
              <p className="text-xs text-text-muted mt-1.5 max-w-xs mx-auto">Upload your technical resume (PDF or DOCX format). The NLP structuring engine will parse your skills and projects.</p>
            </div>
            
            <label className="cursor-pointer bg-indigo-500 hover:bg-indigo-600 px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md transition-all active:scale-95 flex items-center gap-1.5">
              <Upload className="w-4 h-4" /> {loading ? "Extracting Text..." : "Choose File"}
              <input 
                type="file" 
                accept=".pdf,.docx,.doc,.txt,.rtf,.odt,.md" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={loading}
              />
            </label>
          </div>

          {/* Text Paste Fallback */}
          <div className="bg-[#0b0b14]/40 border border-white/5 p-6 rounded-2xl flex flex-col justify-between min-h-[350px] space-y-4">
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold font-display text-left flex items-center gap-1.5">
                <FileText className="w-4.5 h-4.5 text-indigo-400" /> Text Paste Fallback
              </h3>
              <p className="text-[11px] text-text-muted text-left">Paste resume details, experience bullets, and projects directly to parse without document binaries.</p>
            </div>
            
            <textarea
              placeholder="Paste your resume contents here..."
              className="flex-grow bg-[#05050a] border border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 text-text-primary placeholder:text-text-muted min-h-[160px] resize-none"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              disabled={loading}
            />

            <button
              onClick={handleTextPaste}
              disabled={loading || !pastedText.trim()}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              {loading ? "Parsing Data..." : "Structure and Continue"}
            </button>
          </div>

        </div>
      )}

      {/* STEP 2: LOBBY CONFIG PAGE */}
      {step === 'lobby' && parsedProfile && (
        <div className="max-w-4xl mx-auto space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Parsed Resume Details summary */}
            <div className="md:col-span-1 bg-[#0b0b14]/50 border border-white/5 p-5 rounded-2xl text-left space-y-4 shadow-lg">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Parsed Candidate Profile</span>
              <div>
                <h4 className="text-sm font-bold text-white font-display">{parsedProfile.name || "Alex Mercer"}</h4>
                <p className="text-[10px] text-indigo-300 mt-0.5">{parsedProfile.education || "Computer Science Degree"}</p>
              </div>

              <div>
                <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Extracted Skills</div>
                <div className="flex flex-wrap gap-1">
                  {parsedProfile.skills?.map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-md text-[9px] font-mono font-bold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">Identified Strengths</div>
                <ul className="space-y-1">
                  {parsedProfile.strengths?.map((str, idx) => (
                    <li key={idx} className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-current" /> {str}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">Target Areas</div>
                <ul className="space-y-1">
                  {parsedProfile.weak_areas?.map((wa, idx) => (
                    <li key={idx} className="text-[10px] text-rose-400 flex items-center gap-1">
                      <ShieldAlert className="w-2.5 h-2.5" /> {wa}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Config Panels */}
            <div className="md:col-span-2 bg-[#0b0b14]/40 border border-white/5 p-6 rounded-2xl space-y-6 text-left">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Configure Interview Session</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Track */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block">Interview Track</label>
                  <select
                    className="w-full bg-[#05050a] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-text-primary"
                    value={track}
                    onChange={(e) => setTrack(e.target.value)}
                  >
                    <option value="Technical">Technical (Systems & Algorithms)</option>
                    <option value="System Design">System Design (Architectures)</option>
                    <option value="Behavioral">Behavioral (STAR Competency)</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block">Target Difficulty</label>
                  <select
                    className="w-full bg-[#05050a] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-text-primary"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="Easy">Easy (Entry Placement)</option>
                    <option value="Medium">Medium (Mid-level Standard)</option>
                    <option value="Hard">Hard (Staff / Tech Lead)</option>
                  </select>
                </div>

                {/* Company Focus */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block">Target Corporate Focus</label>
                  <select
                    className="w-full bg-[#05050a] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-text-primary"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  >
                    <option value="Google">Google (Data Structures, Algorithms & Hard Scale)</option>
                    <option value="Stripe">Stripe (REST APIs Integration, Database Consistency)</option>
                    <option value="Amazon">Amazon (Leadership Principles & Scaling Systems)</option>
                    <option value="Generic Tech">Generic Technology Firm</option>
                  </select>
                </div>

              </div>

              {/* Audio feedback prompt */}
              <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                <div className="flex gap-2.5 items-center">
                  <Volume2 className="w-5 h-5 text-indigo-400" />
                  <div>
                    <span className="font-semibold text-white block">Speak questions aloud</span>
                    <span className="text-[10px] text-text-muted leading-tight block">Use browser speech engine synthesis for voice reads.</span>
                  </div>
                </div>
                <button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    audioEnabled 
                      ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' 
                      : 'bg-white/5 border-white/5 text-text-secondary'
                  }`}
                >
                  {audioEnabled ? 'Voice Enabled' : 'Voice Disabled'}
                </button>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setStep('upload')}
                  className="px-5 py-2.5 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold transition-all active:scale-95"
                >
                  Re-upload Resume
                </button>
                <button
                  onClick={startInterview}
                  className="flex-grow bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 animate-pulse-subtle"
                >
                  <Play className="w-4 h-4 fill-current" /> Begin AI Mock Assessment
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* STEP 3: LIVE INTERVIEW WORKSPACE */}
      {step === 'interview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto text-left pt-6">
          
          {/* Left Column: Waveform Avatar & Resume Summary */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Avatar panel */}
            <div className="bg-[#0b0b14]/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider self-start">Speech Diagnostics</span>
              
              <div className="relative w-36 h-36 bg-black/40 border border-white/10 rounded-full flex items-center justify-center overflow-hidden">
                <canvas 
                  ref={canvasRef} 
                  width={140} 
                  height={140} 
                  className="w-full h-full"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Video className="w-6 h-6 text-text-muted opacity-25" />
                </div>
              </div>

              <div className="text-[11px] font-medium">
                {window.speechSynthesis.speaking ? (
                  <span className="text-indigo-400 animate-pulse">AI Intervewer is speaking questions...</span>
                ) : isRecording ? (
                  <span className="text-accent-secondary animate-pulse">Mic listening. Speak clearly...</span>
                ) : (
                  <span className="text-text-muted">Interviewer waiting for your answer.</span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className="p-2 rounded-lg bg-white/5 border border-white/5 text-text-secondary hover:text-white"
                >
                  {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Resume Summary */}
            <div className="bg-[#0b0b14]/50 border border-white/5 rounded-2xl p-5 space-y-3">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Resume Context</span>
              <div className="space-y-2.5">
                <div>
                  <div className="text-[10px] text-text-muted">Skills Evaluated:</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {parsedProfile?.skills?.slice(0, 8).map((s, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded text-[9px] font-mono">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted">Weakness Focus Points:</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {parsedProfile?.weak_areas?.slice(0, 3).map((w, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-[9px]">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Chat transcript & answer inputs */}
          <div className="lg:col-span-2 bg-[#0b0b14]/30 border border-white/5 rounded-2xl p-5 flex flex-col justify-between min-h-[500px]">
            
            {/* Top Stats Banner */}
            <div className="pb-3 border-b border-white/5 flex justify-between items-center shrink-0">
              <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> QUESTION TIMER: <span className="text-white font-mono">{formatTime(timer)}</span>
              </div>
              <div className="text-[10px] text-text-muted font-mono font-bold">
                TURN: {history.filter(h => h.role === 'candidate').length + 1} / 4
              </div>
            </div>

            {/* Logs Area */}
            <div className="flex-grow space-y-5 overflow-y-auto my-5 pr-1 max-h-[350px]">
              
              {/* Previous Conversation Logs */}
              {history.map((h, i) => (
                <div key={i} className={`flex gap-3 text-xs ${h.role === 'interviewer' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed border ${
                    h.role === 'interviewer'
                      ? 'bg-black/20 border-white/5 text-text-secondary rounded-tl-none'
                      : 'bg-[#1e1e2f] border-white/10 text-text-primary rounded-tr-none ml-auto'
                  }`}>
                    <span className="text-[9px] font-bold block mb-1 uppercase tracking-widest text-text-muted">
                      {h.role === 'interviewer' ? 'Interviewer' : 'You'}
                    </span>
                    {h.content}
                  </div>
                </div>
              ))}

              {/* Active question */}
              {loadingQuestion ? (
                <div className="flex gap-2.5 items-center text-xs text-text-secondary p-3 bg-white/5 border border-white/5 rounded-xl w-fit">
                  <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span>AI evaluation & generating next questions...</span>
                </div>
              ) : (
                <div className="flex gap-3 text-xs justify-start">
                  <div className="p-3.5 rounded-2xl bg-[#0b0b14] border border-white/5 text-text-secondary max-w-[85%] leading-relaxed rounded-tl-none">
                    <span className="text-[9px] font-bold block mb-1 uppercase tracking-widest text-text-muted">Interviewer</span>
                    {currentIntro && <p className="mb-2 italic text-indigo-300/80">{currentIntro}</p>}
                    <p className="text-white font-semibold text-[13.5px]">{currentQuestion}</p>
                  </div>
                </div>
              )}

            </div>

            {/* Answer Controls form */}
            <form onSubmit={submitAnswer} className="space-y-4 border-t border-white/5 pt-4">
              {currentHint && (
                <div className="text-[10px] text-amber-400 flex items-center gap-1.5 italic bg-amber-500/5 p-2.5 border border-amber-500/10 rounded-lg">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> Hint: {currentHint}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your response context or click the microphone..."
                  className="flex-grow bg-[#05050a] border border-white/10 focus-within:border-indigo-500 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-text-primary placeholder:text-text-muted"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={loadingQuestion}
                />
                
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-2.5 rounded-xl border transition-all shrink-0 flex items-center justify-center ${
                    isRecording 
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse' 
                      : 'bg-[#05050a] border-white/10 text-text-secondary hover:text-white'
                  }`}
                >
                  {isRecording ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
                </button>

                <button
                  type="submit"
                  disabled={loadingQuestion || !answer.trim()}
                  className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center shrink-0 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {speechFeedback && <div className="text-[10px] text-indigo-400 font-mono">{speechFeedback}</div>}

              <button
                type="button"
                onClick={endInterview}
                className="text-text-muted hover:text-rose-400 text-[9px] font-bold uppercase tracking-wider block pt-1"
              >
                Terminate Assessment Loop Early
              </button>
            </form>

          </div>

        </div>
      )}

      {/* STEP 4: DIAGNOSTICS RESULT DASHBOARD */}
      {step === 'result' && (
        <div className="max-w-4xl mx-auto space-y-6 pt-6 text-left">
          {loadingQuestion ? (
            <div className="bg-[#0b0b14]/50 border border-white/5 p-12 rounded-2xl text-center space-y-4 min-h-[350px] flex flex-col justify-center items-center">
              <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin" />
              <h3 className="text-base font-bold text-white font-display">Assembling FAANG Evaluation Report</h3>
              <p className="text-xs text-text-muted max-w-sm">Please wait while the AI compiles your speech pace, algorithm scores, conceptual clarity, and hiring suggestions.</p>
            </div>
          ) : evaluation ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left scorecard */}
              <div className="md:col-span-1 space-y-6">
                
                {/* Score Dial */}
                <div className="bg-[#0b0b14]/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl"></div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-text-secondary mb-4 self-start">Readiness Score</span>
                  
                  <div className="relative w-36 h-36 flex items-center justify-center mb-4">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="72" cy="72" r="62" className="stroke-white/5" strokeWidth="8" fill="transparent" />
                      <circle 
                        cx="72" cy="72" r="62" 
                        className="stroke-indigo-500" 
                        strokeWidth="8" 
                        fill="transparent" 
                        strokeDasharray={389}
                        strokeDashoffset={389 - (389 * evaluation.overallScore) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                      <span className="text-3xl font-black text-white">{evaluation.overallScore}%</span>
                      <span className="text-[8px] text-text-muted uppercase tracking-widest font-bold mt-0.5">Mock Grade</span>
                    </div>
                  </div>

                  {/* Recommendation Badge */}
                  <div className="w-full text-center py-2 px-4 rounded-xl border font-bold text-xs uppercase tracking-wider mb-4 font-display flex items-center justify-center gap-1.5">
                    {evaluation.finalRecommendation === 'HIRE' ? (
                      <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full w-full">Hire Recommendation</span>
                    ) : evaluation.finalRecommendation === 'BORDERLINE' ? (
                      <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full w-full">Borderline Ready</span>
                    ) : (
                      <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full w-full">Needs Optimization</span>
                    )}
                  </div>
                </div>

                {/* Subscores list */}
                <div className="bg-[#0b0b14]/50 border border-white/5 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Subscore Indexes</h4>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between items-center text-text-secondary mb-1">
                        <span>Communication Index</span>
                        <span className="font-bold text-white font-mono">{evaluation.communicationScore}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${evaluation.communicationScore}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-text-secondary mb-1">
                        <span>Technical Accuracy</span>
                        <span className="font-bold text-white font-mono">{evaluation.technicalScore}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500" style={{ width: `${evaluation.technicalScore}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-text-secondary mb-1">
                        <span>Problem Solving</span>
                        <span className="font-bold text-white font-mono">{evaluation.problemSolvingScore}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500" style={{ width: `${evaluation.problemSolvingScore}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-text-secondary mb-1">
                        <span>Confidence Level</span>
                        <span className="font-bold text-white font-mono">{evaluation.confidenceScore}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${evaluation.confidenceScore}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right diagnostics pane */}
              <div className="md:col-span-2 space-y-6">
                
                {/* hiring comments */}
                <div className="bg-[#0b0b14]/50 border border-white/5 rounded-2xl p-5 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" /> Executive Recruiter Review
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed bg-[#05050a] p-4 rounded-xl border border-white/5 italic">
                    "{evaluation.detailedFeedback}"
                  </p>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <div className="bg-[#0b0b14]/50 border border-white/5 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Key Strengths
                    </h4>
                    <ul className="list-disc pl-4 text-xs text-text-secondary space-y-2">
                      {evaluation.strengths?.map((str, idx) => (
                        <li key={idx} className="leading-relaxed">{str}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-[#0b0b14]/50 border border-white/5 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" /> Focus Recommendations
                    </h4>
                    <ul className="list-disc pl-4 text-xs text-text-secondary space-y-2">
                      {evaluation.weaknesses?.map((w, idx) => (
                        <li key={idx} className="leading-relaxed">{w}</li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Final controls */}
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setStep('upload');
                      setParsedProfile(null);
                      setEvaluation(null);
                    }}
                    className="px-5 py-3 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                  >
                    Ingest Another Resume
                  </button>
                  <button
                    onClick={() => {
                      setStep('lobby');
                      setEvaluation(null);
                    }}
                    className="flex-grow bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" /> Start Loop Re-run
                  </button>
                </div>

              </div>

            </div>
          ) : (
            <div className="text-center py-12 bg-[#0b0b14]/50 border border-white/5 rounded-2xl text-xs text-text-muted">
              Scorecard report details are not compiled.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
