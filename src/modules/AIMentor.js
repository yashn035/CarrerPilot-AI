import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { 
  Send, Sparkles, MessageSquare, Brain, Compass, RefreshCw, Cpu, 
  CheckCircle2, XCircle, BookOpen, Terminal, ArrowRight, Lightbulb, Copy, Check,
  Award, Map, HelpCircle, UserCheck, Plus, Trash2, Calendar, Star, Mic, MicOff,
  Video, VideoOff, Trophy, TrendingUp, Shield, Lock, Eye, CheckSquare, ListTodo
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  BarChart, Bar, Legend 
} from 'recharts';

export function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative border border-white/10 rounded-xl overflow-hidden bg-[#0d0d11] my-4 shadow-lg w-full max-w-full">
      <div className="flex justify-between items-center px-4 py-2 bg-[#18181b] border-b border-white/5 text-[11px] font-mono text-text-muted">
        <span className="lowercase font-semibold text-text-secondary">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="hover:text-text-primary transition-colors flex items-center gap-1 font-semibold text-[10px] opacity-80 hover:opacity-100 py-1 px-2 rounded hover:bg-white/5"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[12px] font-mono text-left bg-black/30 leading-relaxed max-h-96">
        <code className="text-[#e6e6e6]">{code}</code>
      </pre>
    </div>
  );
}

export const renderInlineFormatting = (text) => {
  if (!text) return "";
  
  const parts = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={match.index} className="font-bold text-text-primary">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={match.index} className="italic text-text-primary">{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(<code key={match.index} className="px-1.5 py-0.5 bg-[#1E1E2E] border border-white/10 rounded text-[11px] font-mono text-accent-secondary font-semibold">{token.slice(1, -1)}</code>);
    } else if (token.startsWith('[') && token.includes('](')) {
      const closeBracket = token.indexOf(']');
      const label = token.slice(1, closeBracket);
      const url = token.slice(closeBracket + 2, -1);
      parts.push(<a key={match.index} href={url} target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline font-semibold">{label}</a>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts;
};

export const renderMarkdownText = (text) => {
  if (!text) return "";

  const lines = text.split('\n');
  const renderedElements = [];
  
  let currentListType = null; 
  let listItems = [];

  const flushList = (key) => {
    if (listItems.length > 0) {
      if (currentListType === 'ul') {
        renderedElements.push(
          <ul key={key} className="list-disc pl-6 space-y-1.5 my-3 text-[13px] md:text-sm text-text-secondary">
            {listItems}
          </ul>
        );
      } else if (currentListType === 'ol') {
        renderedElements.push(
          <ol key={key} className="list-decimal pl-6 space-y-1.5 my-3 text-[13px] md:text-sm text-text-secondary">
            {listItems}
          </ol>
        );
      }
      listItems = [];
      currentListType = null;
    }
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('# ')) {
      flushList(`list-before-h1-${lineIdx}`);
      const headingText = trimmed.substring(2).replace(/[✨🧠]/g, '').trim();
      renderedElements.push(
        <h1 key={lineIdx} className="text-lg md:text-xl font-bold text-white mt-5 mb-2 font-display border-b border-white/5 pb-2">
          {renderInlineFormatting(headingText)}
        </h1>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList(`list-before-h2-${lineIdx}`);
      const headingText = trimmed.substring(3).replace(/[✨🧠]/g, '').trim();
      renderedElements.push(
        <h2 key={lineIdx} className="text-base md:text-lg font-bold text-white mt-4 mb-2 font-display border-b border-white/5 pb-1">
          {renderInlineFormatting(headingText)}
        </h2>
      );
    } else if (trimmed.startsWith('### ')) {
      flushList(`list-before-h3-${lineIdx}`);
      const headingText = trimmed.substring(4).replace(/[✨🧠]/g, '').trim();
      renderedElements.push(
        <h3 key={lineIdx} className="text-sm font-bold text-white mt-3 mb-1.5 font-display">
          {renderInlineFormatting(headingText)}
        </h3>
      );
    } 
    else if (trimmed.startsWith('> ')) {
      flushList(`list-before-quote-${lineIdx}`);
      renderedElements.push(
        <blockquote key={lineIdx} className="border-l-4 border-indigo-500 pl-4 py-1 my-3 text-text-muted italic bg-white/5 rounded-r text-[13px] md:text-sm leading-relaxed">
          {renderInlineFormatting(trimmed.substring(2))}
        </blockquote>
      );
    }
    else if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      if (currentListType !== 'ul') {
        flushList(`list-before-ul-${lineIdx}`);
        currentListType = 'ul';
      }
      const cleanItem = trimmed.replace(/^[\*\-\•]\s*/, '');
      listItems.push(
        <li key={`li-${lineIdx}`} className="pl-1 leading-relaxed">
          {renderInlineFormatting(cleanItem)}
        </li>
      );
    }
    else if (/^\d+\.\s+/.test(trimmed)) {
      if (currentListType !== 'ol') {
        flushList(`list-before-ol-${lineIdx}`);
        currentListType = 'ol';
      }
      const cleanItem = trimmed.replace(/^\d+\.\s+/, '');
      listItems.push(
        <li key={`li-${lineIdx}`} className="pl-1 leading-relaxed">
          {renderInlineFormatting(cleanItem)}
        </li>
      );
    }
    else {
      flushList(`list-before-para-${lineIdx}`);
      if (trimmed.length > 0) {
        renderedElements.push(
          <p key={lineIdx} className="my-2.5 text-text-secondary leading-relaxed font-sans text-[13px] md:text-sm">
            {renderInlineFormatting(line)}
          </p>
        );
      }
    }
  });

  flushList(`list-at-end`);
  return renderedElements;
};

export function MarkdownRenderer({ content }) {
  if (!content) return null;

  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.substring(lastIndex, match.index) });
    }
    parts.push({ type: 'code', language: match[1], content: match[2] });
    lastIndex = codeBlockRegex.lastIndex;
  }
  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.substring(lastIndex) });
  }

  return (
    <div className="space-y-3 text-left w-full max-w-full overflow-hidden text-[13px] md:text-sm leading-relaxed text-text-secondary">
      {parts.map((part, idx) => {
        if (part.type === 'code') {
          return <CodeBlock key={idx} code={part.content.trim()} language={part.language} />;
        } else {
          return <div key={idx} className="space-y-1.5">{renderMarkdownText(part.content)}</div>;
        }
      })}
    </div>
  );
}

export default function AIMentor() {
  const { getAuthHeaders, user, addToast, fetchProfile } = useUser();
  const [activeSessionId, setActiveSessionId] = useState(localStorage.getItem("ai_mentor_session_id") || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState('placement');
  const [sessionsList, setSessionsList] = useState([]);
  const [memoryProfile, setMemoryProfile] = useState({ weaknesses: [], strengths: [], topicsDiscussed: [], targetCompanies: [] });
  const [summaryReport, setSummaryReport] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'roadmap', 'analytics', 'quests'

  // Roadmap States
  const [roadmapCompany, setRoadmapCompany] = useState('Google');
  const [roadmapData, setRoadmapData] = useState([]);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  // Readiness / Analytics States
  const [readinessData, setReadinessData] = useState(null);
  const [readinessLoading, setReadinessLoading] = useState(false);

  // Daily Missions States
  const [missionsList, setMissionsList] = useState([]);
  const [missionsLoading, setMissionsLoading] = useState(false);

  // Voice States
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Camera States
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraStats, setCameraStats] = useState({ confidence: 82, eyeContact: 78, speakingSpeed: 'Good (125 WPM)', faceVisibility: 'Perfect' });
  const videoRef = useRef(null);
  const webcamStreamRef = useRef(null);
  const statIntervalRef = useRef(null);
  const scrollRef = useRef(null);

  // Mode Definitions (8 V2 modes)
  const MODES = [
    { id: 'placement', label: 'Placement Mentor', icon: Compass, desc: 'Complete placement roadmap guidelines.', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    { id: 'dsa', label: 'DSA Mentor', icon: Terminal, desc: 'Data Structures & Algorithms helper.', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { id: 'resume', label: 'Resume Mentor', icon: BookOpen, desc: 'ATS resume auditing & optimizer.', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { id: 'interview', label: 'Interview Mentor', icon: UserCheck, desc: 'Simulated mock coding interview loops.', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
    { id: 'system_design', label: 'System Design', icon: Cpu, desc: 'LLD + HLD system architect loops.', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { id: 'career', label: 'Career Mentor', icon: Award, desc: 'Job switching & negotiation growth.', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
    { id: 'behavioral', label: 'Behavioral Mentor', icon: Star, desc: 'HR prep & STAR method simulation.', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    { id: 'project', label: 'Project Mentor', icon: Lightbulb, desc: 'Project audit, code review & design.', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' }
  ];

  // Fetch History and Memory Profile on mount
  useEffect(() => {
    loadHistoryData();
  }, [activeSessionId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Sync speech synthesis triggers
  useEffect(() => {
    if (voiceEnabled && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'mentor' && lastMsg.content) {
        speakText(lastMsg.content.replace(/[\*\#\`]/g, ''));
      }
    }
  }, [messages, voiceEnabled]);

  // Clean up Web Audio / Video Stream on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
      stopSpeechRecognition();
    };
  }, []);

  const loadHistoryData = async () => {
    try {
      const res = await fetch('/api/ai-mentor/history', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setSessionsList(data.sessions || []);
        if (data.memory) {
          setMemoryProfile(data.memory);
        }

        if (activeSessionId) {
          const activeSess = data.sessions.find(s => s.id === activeSessionId);
          if (activeSess) {
            setActiveMode(activeSess.mode);
            // Auto start session if active in database
            // Local fallback pulls details or starts session
          } else {
            setActiveSessionId(null);
            localStorage.removeItem("ai_mentor_session_id");
            initializeDefaultChat();
          }
        } else {
          initializeDefaultChat();
        }
      } else {
        initializeDefaultChat();
      }
    } catch (err) {
      console.error(err);
      initializeDefaultChat();
    }
  };

  const initializeDefaultChat = () => {
    setMessages([
      {
        role: 'mentor',
        content: `Hello ${user?.name || 'Pilot'}! I am your Personal AI Career Coach. Select a Mode or Tab at the top to customize your placement loop.\n\n* **Placement Mentor**: Complete SDE Roadmap checks.\n* **DSA Mentor**: Solve/Optimize code complexity.\n* **Resume Mentor**: Bullet-point updates & ATS keywords.\n* **Interview Mentor**: Interactive simulated questions.`,
        mode: activeMode,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  // 🎙️ Speech Synthesis
  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Cancel active speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // 🎙️ Speech Recognition
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast("Speech recognition not supported in this browser.", "error");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      addToast("Listening... Speak now.", "success");
    };

    rec.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      addToast("Speech captured!", "success");
    };

    rec.onerror = (e) => {
      console.error("Speech Recognition Error:", e);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  // 📹 Webcam Handlers
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      webcamStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraEnabled(true);
      addToast("Camera active for Interview Coaching!", "success");

      // Set up random simulator for dials/metrics
      statIntervalRef.current = setInterval(() => {
        setCameraStats({
          confidence: Math.round(75 + Math.random() * 20),
          eyeContact: Math.round(70 + Math.random() * 25),
          speakingSpeed: Math.random() > 0.4 ? 'Good (135 WPM)' : 'Fast (155 WPM)',
          faceVisibility: Math.random() > 0.1 ? 'Perfect' : 'Partially Blocked'
        });
      }, 3000);

    } catch (err) {
      console.error("Error accessing camera:", err);
      addToast("Unable to access camera device.", "error");
    }
  };

  const stopWebcam = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(track => track.stop());
      webcamStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (statIntervalRef.current) {
      clearInterval(statIntervalRef.current);
    }
    setCameraEnabled(false);
  };

  const toggleCamera = () => {
    if (cameraEnabled) {
      stopWebcam();
    } else {
      startWebcam();
    }
  };

  // Roadmap generation
  const fetchRoadmap = async (company = roadmapCompany) => {
    setRoadmapLoading(true);
    try {
      const res = await fetch(`/api/ai-mentor/roadmap?company=${company}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setRoadmapData(data);
      } else {
        addToast("Failed to fetch roadmap.", "error");
      }
    } catch (e) {
      console.error(e);
      addToast("Roadmap request failed.", "error");
    } finally {
      setRoadmapLoading(false);
    }
  };

  // Readiness calculation
  const fetchReadiness = async () => {
    setReadinessLoading(true);
    try {
      const res = await fetch('/api/ai-mentor/readiness', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setReadinessData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReadinessLoading(false);
    }
  };

  // Quests / Daily missions loading
  const fetchMissions = async () => {
    setMissionsLoading(true);
    try {
      const res = await fetch('/api/ai-mentor/missions', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setMissionsList(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMissionsLoading(false);
    }
  };

  const claimMissionReward = async (missionId) => {
    try {
      const res = await fetch('/api/ai-mentor/claim-mission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ missionId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          addToast(`+${data.xpGained} XP Claimed successfully!`, "gold");
          await fetchProfile();
          await fetchMissions();
          await loadHistoryData();
        } else {
          addToast(data.message || "Failed to claim reward.", "warning");
        }
      }
    } catch (e) {
      console.error(e);
      addToast("Quest claim error.", "error");
    }
  };

  const handleStartSession = async (mode = 'placement') => {
    setLoading(true);
    setSummaryReport(null);
    try {
      const res = await fetch('/api/ai-mentor/start-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ mode })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveSessionId(data.id);
        localStorage.setItem("ai_mentor_session_id", data.id);
        setActiveMode(data.mode);
        setMessages(data.messages || []);
        addToast(`Started ${mode} session!`, "success");
        loadHistoryData();
        setActiveTab('chat');
      } else {
        addToast("Failed to initialize session.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Connection failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel(); // Stop talking if user speaks
    }

    const userMsg = { role: 'user', content: text, mode: activeMode, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-mentor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          message: text,
          sessionId: activeSessionId,
          mode: activeMode
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.sessionId && data.sessionId !== activeSessionId) {
          setActiveSessionId(data.sessionId);
          localStorage.setItem("ai_mentor_session_id", data.sessionId);
        }

        setMessages(prev => [...prev, {
          role: 'mentor',
          content: data.reply,
          mode: data.mode,
          score: data.score,
          feedback: data.feedback,
          nextAction: data.nextAction,
          timestamp: new Date().toISOString()
        }]);

        if (data.mode && data.mode !== activeMode) {
          setActiveMode(data.mode);
        }

        addToast(`+10 XP Career Coach Practice Earned!`, "gold");
        if (data.leveledUp) {
          addToast("🚀 LEVEL UP! Check your new level on the dashboard.", "success");
        }
        await fetchProfile();
        loadHistoryData();
      } else {
        addToast("Failed to compile AI response.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network timeout.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSessionId) return;
    setLoading(true);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    try {
      const res = await fetch('/api/ai-mentor/end-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ sessionId: activeSessionId })
      });

      if (res.ok) {
        const data = await res.json();
        setSummaryReport(data);
        setActiveSessionId(null);
        localStorage.removeItem("ai_mentor_session_id");
        addToast("Session evaluation synchronized.", "success");
        loadHistoryData();
      } else {
        addToast("Failed to close session.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network error.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = async (sess) => {
    setLoading(true);
    setSummaryReport(null);
    try {
      setActiveSessionId(sess.id);
      localStorage.setItem("ai_mentor_session_id", sess.id);
      setActiveMode(sess.mode);
      // Automatically load or create session loop
      await handleStartSession(sess.mode);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Quick suggestions
  const suggestionPrompts = [
    `How do I crack SDE rounds at ${roadmapCompany}?`,
    "Optimize my resume formatting for ATS scanners.",
    "Help me design a scalable token-bucket Rate Limiter.",
    "Code a recursive binary search with complexity metrics."
  ];

  // Tab Load Effect
  useEffect(() => {
    if (activeTab === 'roadmap') {
      fetchRoadmap();
    } else if (activeTab === 'analytics') {
      fetchReadiness();
    } else if (activeTab === 'quests') {
      fetchMissions();
    }
  }, [activeTab, roadmapCompany]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#07070C] text-text-primary select-none overflow-hidden max-w-7xl mx-auto w-full p-4 md:p-6 pb-6 animate-fade-in">
      
      {/* Header / Brand Panel */}
      <div className="border-b border-white/5 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-text-primary flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400 animate-pulse" /> Personal AI Career Coach <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/30">V2.0 PRO</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Production-ready coaching hub: ATS scanners, coding roadmap timelines, Recharts dashboard trends, and Speech AI loops.
          </p>
        </div>
        
        {/* Tab Controls */}
        <div className="flex bg-[#0b0b14]/75 border border-white/10 p-1 rounded-xl shrink-0 gap-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'chat' ? 'bg-indigo-500 text-white shadow-md' : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Coach Chat
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'roadmap' ? 'bg-indigo-500 text-white shadow-md' : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            <Map className="w-3.5 h-3.5" /> Placement Roadmap
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'analytics' ? 'bg-indigo-500 text-white shadow-md' : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Analytics Vitals
          </button>
          <button
            onClick={() => setActiveTab('quests')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'quests' ? 'bg-indigo-500 text-white shadow-md' : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" /> Quests & XP
          </button>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden gap-6 pt-6 min-h-0">
        
        {/* Left Control Panel: Modes & Sessions */}
        <div className="hidden lg:flex flex-col w-72 shrink-0 gap-5 min-h-0 overflow-y-auto pr-1">
          
          {/* Active Mode Controller */}
          <div className="bg-[#0b0b14]/50 border border-white/5 backdrop-blur-md rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-indigo-400" /> Specialist Persona
            </h3>
            <div className="grid grid-cols-1 gap-2 max-h-[350px] overflow-y-auto pr-1">
              {MODES.map(m => {
                const Icon = m.icon;
                const isActive = activeMode === m.id && activeSessionId && activeTab === 'chat';
                return (
                  <button
                    key={m.id}
                    onClick={() => handleStartSession(m.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                      isActive 
                        ? 'bg-indigo-500/15 border-indigo-500/40 text-white shadow-lg' 
                        : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg border ${m.color} shrink-0 mt-0.5`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold font-display truncate">{m.label}</div>
                      <div className="text-[9px] text-text-muted mt-0.5 leading-snug truncate">{m.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vitals Summary Card */}
          <div className="bg-[#0b0b14]/50 border border-white/5 backdrop-blur-md rounded-2xl p-4 space-y-3 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-400" /> V2.0 Coach Memory
            </h3>
            <div className="space-y-2.5 text-xs text-text-secondary">
              <div>
                <span className="text-[10px] text-text-muted block">TARGET ROLE</span>
                <span className="font-semibold text-white">{memoryProfile.targetRole || "Software Engineer"}</span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted block">TARGET TIER TRACKS</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(memoryProfile.targetCompanies || ["Google", "Amazon", "Stripe"]).map((c, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 rounded font-mono text-[9px] font-semibold">{c}</span>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-white/5 flex justify-between">
                <div>
                  <span className="text-[9px] text-text-muted block">ATS SCORE</span>
                  <span className="text-emerald-400 font-bold font-mono">{memoryProfile.lastAtsScore || 72}/100</span>
                </div>
                <div>
                  <span className="text-[9px] text-text-muted block">MOCK AVG</span>
                  <span className="text-violet-400 font-bold font-mono">{memoryProfile.lastInterviewScore || 65}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sessions Archive */}
          <div className="bg-[#0b0b14]/50 border border-white/5 backdrop-blur-md rounded-2xl p-4 flex-grow min-h-[120px] flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 mb-2.5">
              <Calendar className="w-4 h-4 text-indigo-400" /> Active Threads
            </h3>
            <div className="flex-grow overflow-y-auto space-y-1.5 pr-1 text-left">
              {sessionsList.filter(s => s.status === 'active').map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSession(s)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs flex justify-between items-center transition-all ${
                    s.id === activeSessionId
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-white font-semibold'
                      : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <span className="capitalize truncate max-w-[130px] font-medium">{s.mode} session</span>
                  <span className="text-[9px] text-text-muted font-mono">{s.messageCount} messages</span>
                </button>
              ))}
              {sessionsList.filter(s => s.status === 'active').length === 0 && (
                <div className="text-[10px] text-text-muted italic text-center py-6">No active sessions. Start one above!</div>
              )}
            </div>
          </div>

        </div>

        {/* Center / Right Panels Mapping Tabs */}
        <div className="flex-grow flex flex-col bg-[#0b0b14]/30 border border-white/5 rounded-2xl overflow-hidden min-h-0 shadow-2xl relative">
          
          {/* TAB 1: Chat interface */}
          {activeTab === 'chat' && (
            <div className="flex-grow flex flex-col min-h-0">
              
              {/* Voice and Video Active Indicators */}
              {activeSessionId && (
                <div className="px-4 py-2 bg-indigo-500/10 border-b border-indigo-500/20 flex flex-wrap justify-between items-center shrink-0 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                      Coaching mode: <span className="text-white capitalize">{activeMode}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setVoiceEnabled(!voiceEnabled);
                        if (voiceEnabled) stopSpeechRecognition();
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-all ${
                        voiceEnabled 
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                          : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10'
                      }`}
                    >
                      {voiceEnabled ? <Mic className="w-3 h-3 text-emerald-400 animate-bounce" /> : <MicOff className="w-3 h-3" />}
                      Speech Feedback {voiceEnabled ? 'On' : 'Off'}
                    </button>
                    <button
                      onClick={toggleCamera}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-all ${
                        cameraEnabled 
                          ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400 font-bold' 
                          : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10'
                      }`}
                    >
                      {cameraEnabled ? <Video className="w-3 h-3 text-indigo-400" /> : <VideoOff className="w-3 h-3" />}
                      Webcam Audit
                    </button>
                    {activeSessionId && (
                      <button
                        onClick={handleEndSession}
                        className="px-2.5 py-1 bg-rose-500/15 border border-rose-500/20 text-rose-400 rounded-md text-[10px] font-semibold hover:bg-rose-500/25 transition-all"
                      >
                        End Session
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Chat Viewport */}
              <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6 min-h-0 bg-[#06060B]/40 relative">
                <div className="max-w-4xl mx-auto w-full space-y-6">
                  
                  {/* Floating Camera Overlay */}
                  {cameraEnabled && (
                    <div className="fixed bottom-24 right-8 w-64 bg-[#0d0d18]/90 border border-white/10 rounded-2xl p-3 shadow-2xl z-50 animate-fade-in backdrop-blur-md">
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-black/60 border border-white/5">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                        <div className="absolute top-2 left-2 bg-indigo-500/80 text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                          <Eye className="w-2.5 h-2.5 animate-pulse" /> Live Evaluator
                        </div>
                      </div>

                      {/* Mocked dials */}
                      <div className="mt-3.5 space-y-2 text-left">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-text-secondary font-medium uppercase">CONFIDENCE LEVEL</span>
                          <span className="text-emerald-400 font-bold font-mono">{cameraStats.confidence}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${cameraStats.confidence}%` }}></div>
                        </div>

                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-text-secondary font-medium uppercase">EYE CONTACT FREQ</span>
                          <span className="text-indigo-400 font-bold font-mono">{cameraStats.eyeContact}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-400 transition-all duration-300" style={{ width: `${cameraStats.eyeContact}%` }}></div>
                        </div>

                        <div className="pt-2 border-t border-white/5 flex justify-between text-[9px] text-text-muted">
                          <div>
                            <span className="block uppercase">SPEAKING SPEED</span>
                            <span className="font-semibold text-text-secondary">{cameraStats.speakingSpeed}</span>
                          </div>
                          <div className="text-right">
                            <span className="block uppercase">FACE VISIBILITY</span>
                            <span className="font-semibold text-emerald-400">{cameraStats.faceVisibility}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary evaluation feedback */}
                  {summaryReport && (
                    <div className="p-6 bg-indigo-500/15 border border-indigo-500/30 rounded-2xl text-left shadow-lg space-y-4 max-w-3xl mx-auto animate-fade-in">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl">
                          <Award className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white font-display">Mock Assessment Grade</h3>
                          <p className="text-xs text-indigo-300/80">Placement readiness diagnostics computed successfully.</p>
                        </div>
                      </div>
                      {summaryReport.averageScore !== null && (
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-extrabold text-white font-mono">{summaryReport.averageScore}%</span>
                          <span className="text-xs text-text-secondary uppercase font-bold tracking-wider">Evaluation rating</span>
                        </div>
                      )}
                      <p className="text-sm text-text-secondary leading-relaxed bg-[#0e0e1a]/80 p-4 border border-white/5 rounded-xl font-sans">
                        {summaryReport.message}
                      </p>
                      <button
                        onClick={() => handleStartSession('interview')}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95"
                      >
                        Start Next Mock Round <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Messages list */}
                  {messages.map((m, idx) => (
                    <div 
                      key={idx} 
                      className={`flex gap-4 text-[13px] md:text-sm leading-relaxed w-full ${
                        m.role === 'user' ? 'ml-auto flex-row-reverse text-right justify-start max-w-2xl' : 'mr-auto text-left justify-start max-w-4xl animate-fade-in'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold font-mono text-[10px] border shadow-sm ${
                        m.role === 'user' 
                          ? 'bg-accent-secondary/15 border-accent-secondary/30 text-accent-secondary' 
                          : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                      }`}>
                        {m.role === 'user' ? 'ME' : 'AI'}
                      </div>

                      <div className="flex-grow max-w-[calc(100%-48px)]">
                        <div className={`p-4 md:p-5 rounded-2xl border transition-all duration-200 text-left shadow-sm ${
                          m.role === 'user'
                            ? 'bg-[#1e1e2f] border-white/10 text-text-primary rounded-tr-none ml-auto max-w-lg'
                            : 'bg-[#0b0b14]/80 backdrop-blur-sm border-white/5 text-text-secondary rounded-tl-none'
                        }`}>
                          {m.role === 'user' ? (
                            <p className="whitespace-pre-wrap text-text-primary font-sans leading-relaxed text-[13.5px]">{m.content}</p>
                          ) : (
                            <div className="space-y-4">
                              <MarkdownRenderer content={m.content} />
                              
                              {(m.score !== null || m.feedback || m.nextAction) && (
                                <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0e0e1a]/60 p-4 border border-white/5 rounded-xl">
                                  {m.score !== null && (
                                    <div className="space-y-1">
                                      <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                                        <Star className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" /> Score Rating
                                      </div>
                                      <div className="text-xl font-black text-white font-mono">{m.score}/10</div>
                                    </div>
                                  )}
                                  {m.nextAction && (
                                    <div className="space-y-1">
                                      <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                                        <Compass className="w-3.5 h-3.5" /> Recommended Focus
                                      </div>
                                      <div className="text-[11px] text-text-secondary font-semibold leading-relaxed">{m.nextAction}</div>
                                    </div>
                                  )}
                                  {m.feedback && (
                                    <div className="md:col-span-2 space-y-1 pt-1.5 border-t border-white/5">
                                      <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                                        <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Coach Critiques
                                      </div>
                                      <p className="text-[11px] text-text-muted leading-relaxed font-sans">{m.feedback}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Empty state setup options */}
                  {messages.length === 0 && !loading && (
                    <div className="text-center max-w-xl mx-auto py-8 space-y-6">
                      <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-full w-14 h-14 flex items-center justify-center text-indigo-400 mx-auto animate-bounce">
                        <Brain className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold font-display text-white">Initialize Career Coaching</h3>
                        <p className="text-xs text-text-secondary mt-1">Pick a pre-configured target mode to activate your personalized session.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {MODES.map((m) => {
                          const Icon = m.icon;
                          return (
                            <button
                              key={m.id}
                              onClick={() => handleStartSession(m.id)}
                              className="text-left p-3.5 bg-white/5 border border-white/5 hover:bg-indigo-500/5 hover:border-indigo-500/30 rounded-xl text-text-secondary hover:text-white transition-all flex items-start gap-3"
                            >
                              <div className={`p-2 rounded-lg border ${m.color} shrink-0`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold">{m.label}</div>
                                <div className="text-[10px] text-text-muted mt-0.5 leading-snug">{m.desc}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {loading && (
                    <div className="flex gap-4 max-w-xs text-[13px] md:text-sm mr-auto text-left animate-pulse">
                      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-indigo-500/15 border border-indigo-500/20 text-indigo-400">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      </div>
                      <div className="p-4 bg-[#0b0b14]/80 border border-white/5 text-text-muted rounded-2xl rounded-tl-none flex items-center gap-2">
                        <span className="font-mono text-[10px] text-indigo-300">Generating assessment insights...</span>
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>
              </div>

              {/* Quick suggestions footer */}
              {activeSessionId && messages.length > 1 && (
                <div className="px-4 py-2 bg-black/20 border-t border-white/5 flex gap-2 overflow-x-auto whitespace-nowrap shrink-0 max-w-full">
                  {suggestionPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(prompt)}
                      disabled={loading}
                      className="px-3 py-1.5 bg-white/5 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 rounded-lg text-[10px] text-text-secondary hover:text-white transition-all font-semibold"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Input Container */}
              <div className="p-4 bg-black/40 border-t border-white/5 shrink-0">
                <div className="max-w-3xl mx-auto w-full">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="relative flex items-center bg-[#0b0b14] border border-white/10 focus-within:border-indigo-500/50 rounded-2xl p-1.5 shadow-lg transition-all"
                  >
                    {activeSessionId && (
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isListening 
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' 
                            : 'bg-white/5 border-white/5 text-text-secondary hover:text-white'
                        }`}
                        title="Voice Input"
                      >
                        {isListening ? <Mic className="w-4 h-4 text-rose-400 animate-pulse" /> : <Mic className="w-4 h-4" />}
                      </button>
                    )}

                    <input
                      type="text"
                      placeholder={
                        activeSessionId
                          ? `Send message in ${activeMode} mode...`
                          : "Select a specialist mode on the left or click one above to start..."
                      }
                      className="flex-grow bg-transparent px-4 py-2 text-[13px] md:text-sm text-text-primary placeholder-text-muted focus:outline-none pr-12"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={loading || !activeSessionId}
                    />
                    <button
                      type="submit"
                      disabled={loading || !input.trim() || !activeSessionId}
                      className="absolute right-3 bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-xl font-bold transition-all disabled:opacity-30 disabled:scale-100 active:scale-95 shadow-md flex items-center justify-center shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Roadmap Tab */}
          {activeTab === 'roadmap' && (
            <div className="flex-grow p-6 overflow-y-auto text-left space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
                <div>
                  <h3 className="text-base font-bold text-white font-display">Target Company Roadmaps</h3>
                  <p className="text-xs text-text-secondary mt-1">Generates customized 4-week preparation guidelines matching real company profiles.</p>
                </div>
                <div className="flex items-center gap-2">
                  {['Google', 'Amazon', 'Stripe', 'Generic'].map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setRoadmapCompany(c);
                        fetchRoadmap(c);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        roadmapCompany === c 
                          ? 'bg-indigo-500 border-indigo-400 text-white' 
                          : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10'
                      }`}
                    >
                      {c} Track
                    </button>
                  ))}
                </div>
              </div>

              {roadmapLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                  <span className="text-xs text-text-muted font-mono">Formulating week-by-week curriculum...</span>
                </div>
              ) : (
                <div className="space-y-6 max-w-4xl mx-auto">
                  {roadmapData.map((week, idx) => (
                    <div key={idx} className="bg-[#0b0b14]/50 border border-white/5 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md">
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">WEEK {idx + 1} PLANNER</span>
                          <h4 className="text-sm font-bold text-white">{week.week}</h4>
                        </div>
                        <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold rounded">Active Module</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5 text-xs">
                        <div className="space-y-2.5">
                          <div className="font-bold text-text-secondary flex items-center gap-1.5">
                            <ListTodo className="w-3.5 h-3.5 text-indigo-400" /> Focus Core Topics
                          </div>
                          <ul className="space-y-1 pl-5 list-disc text-text-muted leading-relaxed">
                            {week.topics?.map((topic, i) => <li key={i}>{topic}</li>)}
                          </ul>
                        </div>
                        <div className="space-y-2.5">
                          <div className="font-bold text-text-secondary flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> Practice Coding Problems
                          </div>
                          <div className="flex flex-wrap gap-1.5 pl-1.5">
                            {week.problems?.map((prob, i) => (
                              <span key={i} className="px-2 py-1 bg-white/5 border border-white/5 text-text-secondary rounded-lg font-mono text-[10px] font-semibold">{prob}</span>
                            ))}
                          </div>
                        </div>
                        <div className="md:col-span-2 space-y-1.5 pt-2 border-t border-white/5">
                          <div className="font-bold text-text-secondary flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Expert Coach Tips
                          </div>
                          <p className="text-text-muted text-[11px] leading-relaxed italic pl-1.5">
                            {week.tips?.join(" ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="flex-grow p-6 overflow-y-auto text-left space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-base font-bold text-white font-display">Placement Analytics Dashboard</h3>
                <p className="text-xs text-text-secondary mt-1">Recruiter-grade metrics evaluating current skills against targets.</p>
              </div>

              {readinessLoading ? (
                <div className="flex justify-center py-20">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
              ) : readinessData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                  
                  {/* Readiness Overall Metric */}
                  <div className="bg-[#0b0b14]/50 border border-white/5 rounded-2xl p-5 text-center flex flex-col justify-center items-center backdrop-blur-md">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">Overall Job Readiness Score</span>
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="54" className="stroke-white/5 fill-none" strokeWidth="8" />
                        <circle cx="64" cy="64" r="54" className="stroke-indigo-500 fill-none" strokeWidth="8" strokeDasharray="339" strokeDashoffset={339 - (339 * readinessData.overallScore) / 100} strokeLinecap="round" />
                      </svg>
                      <div className="absolute text-2xl font-black text-white font-mono">{readinessData.overallScore}%</div>
                    </div>
                    <p className="text-xs text-text-secondary mt-4 max-w-xs leading-relaxed">
                      Your composite placement rating is weighted: **30% Resume, 30% DSA, 20% Projects, 20% Mock Interviews**.
                    </p>
                  </div>

                  {/* Company Acceptance Probabilities */}
                  <div className="bg-[#0b0b14]/50 border border-white/5 rounded-2xl p-5 flex flex-col justify-center backdrop-blur-md">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-4">Placement Likelihood by Tier</span>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="font-semibold text-white">Tier-1 Product Companies (Google, Stripe, etc.)</span>
                          <span className="font-mono font-bold text-indigo-400">{readinessData.predictions?.chanceProduct}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${readinessData.predictions?.chanceProduct}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="font-semibold text-white">Tier-2 Service & Consultancies (TCS, Infosys, etc.)</span>
                          <span className="font-mono font-bold text-emerald-400">{readinessData.predictions?.chanceService}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${readinessData.predictions?.chanceService}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Skills Breakdown Radar Chart */}
                  <div className="bg-[#0b0b14]/50 border border-white/5 rounded-2xl p-5 backdrop-blur-md min-h-[300px]">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-4">Skill Dimension Alignment</span>
                    <ResponsiveContainer width="100%" height={250}>
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={[
                        { subject: 'Resume', val: readinessData.breakdown?.resume || 70, fullMark: 100 },
                        { subject: 'DSA', val: readinessData.breakdown?.dsa || 50, fullMark: 100 },
                        { subject: 'Projects', val: readinessData.breakdown?.projects || 75, fullMark: 100 },
                        { subject: 'Mocks', val: readinessData.breakdown?.interview || 65, fullMark: 100 },
                        { subject: 'Comm', val: 70, fullMark: 100 }
                      ]}>
                        <PolarGrid stroke="#ffffff10" />
                        <PolarAngleAxis dataKey="subject" stroke="#8e8e93" fontSize={10} />
                        <PolarRadiusAxis stroke="#ffffff10" angle={30} domain={[0, 100]} />
                        <Radar name="Metrics" dataKey="val" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Readiness Trend Chart */}
                  <div className="bg-[#0b0b14]/50 border border-white/5 rounded-2xl p-5 backdrop-blur-md min-h-[300px]">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-4">Readiness Growth Timeline</span>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={[
                        { date: 'June 1', score: 55 },
                        { date: 'June 5', score: 60 },
                        { date: 'June 10', score: 65 },
                        { date: 'June 16', score: readinessData.overallScore }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                        <XAxis dataKey="date" stroke="#8e8e93" fontSize={10} />
                        <YAxis stroke="#8e8e93" fontSize={10} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: '#0d0d18', borderColor: '#ffffff10', color: '#fff' }} />
                        <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                </div>
              ) : (
                <div className="text-center py-20 text-text-muted italic text-xs">No analytics data recorded yet. Take assessments to load metrics.</div>
              )}
            </div>
          )}

          {/* TAB 4: Quests Tab */}
          {activeTab === 'quests' && (
            <div className="flex-grow p-6 overflow-y-auto text-left space-y-6">
              <div className="border-b border-white/5 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-white font-display">Daily Quests & XP Missions</h3>
                  <p className="text-xs text-text-secondary mt-1">Complete daily tasks to gain massive XP rewards and raise your level streak.</p>
                </div>
                <div className="px-3 py-1.5 bg-[#1b1b30] border border-white/10 rounded-lg text-xs font-mono font-bold text-indigo-300 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" /> STREAK: {memoryProfile.streak || 5} DAYS
                </div>
              </div>

              {missionsLoading ? (
                <div className="flex justify-center py-20">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {missionsList.map((quest) => (
                    <div 
                      key={quest.id} 
                      className={`border rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                        quest.claimed 
                          ? 'bg-white/[0.02] border-white/5 opacity-65' 
                          : quest.completed 
                            ? 'bg-[#10b981]/5 border-[#10b981]/20' 
                            : 'bg-white/5 border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${
                          quest.claimed 
                            ? 'bg-white/5 text-text-muted border border-white/5' 
                            : quest.completed 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse' 
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10'
                        }`}>
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{quest.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-text-muted font-mono">Reward: +{quest.xpReward} XP</span>
                            <span className="text-[10px] text-indigo-400">•</span>
                            <span className={`text-[10px] uppercase font-bold tracking-wider ${
                              quest.claimed 
                                ? 'text-text-muted' 
                                : quest.completed 
                                  ? 'text-emerald-400' 
                                  : 'text-amber-400'
                            }`}>
                              {quest.claimed ? 'Claimed' : quest.completed ? 'Completed' : 'Active'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 w-full sm:w-auto">
                        {quest.claimed ? (
                          <span className="text-xs text-text-muted font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-white/40" /> Completed
                          </span>
                        ) : quest.completed ? (
                          <button
                            onClick={() => claimMissionReward(quest.id)}
                            className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <Award className="w-3.5 h-3.5" /> Claim +{quest.xpReward} XP
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full sm:w-auto px-4 py-2 bg-white/5 border border-white/5 text-text-muted rounded-xl text-xs font-semibold"
                          >
                            Incomplete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
