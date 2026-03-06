import React, { useState, useEffect, useRef } from 'react';
import { User, Classroom, Lesson, Progress, Subtopic, MCQ } from './types';
import { HandTracker } from './components/HandTracker';

declare global { interface Window { Sketchfab: any; } }

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'landing' | 'auth' | 'dashboard' | 'classroom' | 'learning'>('landing');
  const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<{ lesson: Lesson, subtopic: any } | null>(null);
  const [autoStartTest, setAutoStartTest] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setUser(data);
        if (data) setView('dashboard');
        setLoading(false);
      });

    const handleReturnToDashboard = () => setView('dashboard');
    window.addEventListener('ReturnToStudentDashboard', handleReturnToDashboard);
    return () => window.removeEventListener('ReturnToStudentDashboard', handleReturnToDashboard);
  }, []);

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-white text-slate-800 font-sans">Loading...</div>;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-white/30 relative overflow-x-hidden">
      {/* --- Premium Animated Background Elements --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Subtle dot pattern grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        {/* Glowing orb 1 - Top Left */}
        <div className="absolute top-0 -left-4 w-96 h-96 bg-white/10 rounded-full mix-blend-screen filter blur-[100px] animate-pulse [animation-duration:10s]" />

        {/* Glowing orb 2 - Top Right */}
        <div className="absolute -top-10 -right-20 w-96 h-96 bg-teal-500/10 rounded-full mix-blend-screen filter blur-[120px] animate-pulse [animation-duration:12s]" />

        {/* Glowing orb 3 - Bottom Center */}
        <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-sky-500/10 rounded-full mix-blend-screen filter blur-[150px] opacity-50" />
      </div>

      {view === 'landing' ? (
        <LandingView onGetStarted={() => setView('auth')} />
      ) : (
        <>
          {user && (
            <Navbar
              user={user}
              onLogout={() => { setUser(null); setView('landing'); setAutoStartTest(false); }}
              onHome={() => { setView('dashboard'); setAutoStartTest(false); }}
            />
          )}

          <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
            {view === 'auth' && <AuthView onAuth={(u) => { setUser(u); setView('dashboard'); }} />}
            {view === 'dashboard' && user && (
              user.role === 'student' ? (
                <StudentDashboard
                  user={user}
                  onSelectClass={(c) => { setSelectedClass(c); setAutoStartTest(false); setView('classroom'); }}
                  onReviseNow={(c, lessonId) => {
                    setSelectedClass(c);
                    fetch(`/api/classrooms/${c.id}/lessons`).then(res => res.json()).then((lessons: Lesson[]) => {
                      const lessonToRevise = lessons.find(l => l.id === lessonId);
                      if (lessonToRevise && lessonToRevise.subtopics && lessonToRevise.subtopics.length > 0) {
                        setSelectedSubtopic({ lesson: lessonToRevise, subtopic: lessonToRevise.subtopics[0] });
                        setAutoStartTest(true);
                        setView('learning');
                      } else {
                        alert("No subtopics found for this lesson to revise.");
                      }
                    });
                  }}
                />
              ) : (
                <Dashboard
                  user={user}
                  onSelectClass={(c) => { setSelectedClass(c); setAutoStartTest(false); setView('classroom'); }}
                />
              )
            )}
            {view === 'classroom' && selectedClass && (
              <ClassroomView
                classroom={selectedClass}
                user={user!}
                onSelectSubtopic={(l, s) => { setSelectedSubtopic({ lesson: l, subtopic: s }); setAutoStartTest(false); setView('learning'); }}
                onBack={() => { setView('dashboard'); setAutoStartTest(false); }}
              />
            )}
            {view === 'learning' && selectedSubtopic && (
              <LearningView
                subtopic={selectedSubtopic.subtopic}
                lesson={selectedSubtopic.lesson}
                autoStartTest={autoStartTest}
                onBack={() => { setAutoStartTest(false); setView('classroom'); }}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
}

// --- Global Dictionary ---
const MODEL_MAP: Record<string, string> = {
  'brain': '36870e0970f044a8957b0af3a180a7eb',
  'neuron': '36870e0970f044a8957b0af3a180a7eb',
  'female reproductive': '6d9b33568caa4eebbd6c875b51e6a488',
  'uterus': '6d9b33568caa4eebbd6c875b51e6a488',
  'male reproductive': 'd66a297de2fd4400a6833417e7185fcf',
  'reproductive': 'd66a297de2fd4400a6833417e7185fcf',
  'liver': 'a20686a3e4a54792bfede17ad32f4b1a',
  'kidney': '0dea52d6f6a848ab8f2cdc3f5b3ba212',
  'renal': '0dea52d6f6a848ab8f2cdc3f5b3ba212',
  'stomach': '883a3c7db5df448bb88981e69ba9b7a1',
  'digestive': '883a3c7db5df448bb88981e69ba9b7a1',
  'lung': '50c877863fe64d11a55044afb79f5664',
  'respiratory': '50c877863fe64d11a55044afb79f5664',
  'cell': 'fabbdeaf2f07493eaf90d6d5eacb26dc',
  'membrane': 'fabbdeaf2f07493eaf90d6d5eacb26dc',
  'atom': '6a283d5b19c34e2b8fcfc6907b231aea',
  'molecule': '6a283d5b19c34e2b8fcfc6907b231aea',
  'seed': 'ba5ad0540c7e4d8991f4450b93c27d2e',
  'germination': 'ba5ad0540c7e4d8991f4450b93c27d2e',
  'flower': 'ec27cb8304964ad4b68ce877e2fd505a',
  'petal': 'ec27cb8304964ad4b68ce877e2fd505a',
  'gear': '7ea57b02a5bc40c2adaeffcf795b4202',
  'motor': 'c79f5fcf8a0043b5baf2d75750349b5f',
  'circuit': 'c79f5fcf8a0043b5baf2d75750349b5f',
  'ktm': '36d3caaa7a564221bf09e888c4bd8d76',
  'motorcycle': '36d3caaa7a564221bf09e888c4bd8d76',
  '390': '36d3caaa7a564221bf09e888c4bd8d76',
  'v8': 'eea9d9252ab14298b50699a471dc2cee',
  'engine': 'eea9d9252ab14298b50699a471dc2cee',
  'taj mahal': '7b43e635cbfb47719d5a124302b78579',
  'monument': '7b43e635cbfb47719d5a124302b78579'
};

// --- Components ---

import { LogOut, Home, Plus, BookOpen, Play, Box, MessageSquare, CheckCircle2, ArrowLeft, Send, User as UserIcon, GraduationCap, Hand, Trash2, Activity, Zap, Target, Flame, Award, TrendingUp, AlertCircle, Clock, Medal, History, Users, Bell } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { askGemini } from './services/gemini';

function Navbar({ user, onLogout, onHome }: { user: User, onLogout: () => void, onHome: () => void }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (user.role === 'student') {
      fetch('/api/student/feedback')
        .then(res => res.json())
        .then(data => setNotifications(data || []));
    }
  }, [user]);

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 relative">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={onHome}>
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 shadow-lg shadow-slate-200 transition-all duration-300">
            <Box className="text-white w-5 h-5" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-slate-900">GraspIQ</span>
        </div>
        <div className="flex items-center gap-6">
          {user.role === 'student' && (
            <div className="relative">
              <button onClick={() => setShowDropdown(!showDropdown)} className="relative p-2 text-slate-500 hover:text-slate-800 transition-colors">
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
                )}
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-2 w-80 max-h-[400px] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-200">
                      <h3 className="text-sm font-medium text-slate-800">Instructor Feedback</h3>
                    </div>
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-slate-200">
                        {notifications.map((n, i) => (
                          <div key={i} className="p-4 hover:bg-slate-50 transition-colors cursor-default">
                            <p className="text-[10px] font-medium text-slate-700 uppercase tracking-wider mb-1">
                              {n.instructor_name} • MENTOR {n.topic_name && <span className="text-slate-500"> • {n.topic_name}</span>}
                            </p>
                            <p className="text-sm text-slate-700 leading-relaxed">{n.message}</p>
                            <p className="text-[9px] text-slate-500 mt-2">{new Date(n.timestamp).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-slate-500 text-sm">
                        No new feedback.
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            {user.role === 'instructor' ? <UserIcon size={16} /> : <GraduationCap size={16} />}
            {user.full_name}
          </div>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              onLogout();
            }}
            className="text-slate-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}

function AuthView({ onAuth }: { onAuth: (u: User) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'instructor' | 'student'>('student');
  const [error, setError] = useState('');

  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (showOtp) {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (res.ok) onAuth(data);
      else setError(data.error);
      return;
    }

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const body = isLogin ? { email, password } : { email, password, full_name: fullName, role };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (res.ok) {
      if (data.status === 'pending_verification') {
        setShowOtp(true);
      } else {
        onAuth(data);
      }
    } else {
      setError(data.error);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden"
      >

        <h2 className="text-3xl font-medium mb-2 text-slate-800">{showOtp ? 'Verify Email' : (isLogin ? 'Welcome Back' : 'Create Account')}</h2>
        <p className="text-slate-500 mb-8">{showOtp ? `We sent a code to ${email}` : (isLogin ? 'Sign in to continue learning' : 'Join the 3D learning revolution')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {showOtp ? (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">6-Digit Code</label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="w-full px-4 py-3 bg-white/50 rounded-xl border border-slate-200 text-slate-800 font-mono tracking-[0.5em] text-center text-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all"
                placeholder="000000"
                required
                autoFocus
              />
            </div>
          ) : (
            <>
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full px-4 py-3 bg-white/50 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Role</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('student')}
                        className={cn(
                          "py-2 rounded-xl border text-sm font-medium transition-all",
                          role === 'student' ? "bg-blue-500 text-white font-bold tracking-wide rounded-2xl border-b-4 border-blue-700 hover:bg-blue-400 active:border-b-0 active:translate-y-1 transition-all border-none shadow-md shadow-sm shadow-slate-200 hover:bg-blue-500 border-slate-500 shadow-lg shadow-md shadow-slate-200" : "bg-white/50 text-slate-500 border-slate-200 hover:border-slate-300"
                        )}
                      >Student</button>
                      <button
                        type="button"
                        onClick={() => setRole('instructor')}
                        className={cn(
                          "py-2 rounded-xl border text-sm font-medium transition-all",
                          role === 'instructor' ? "bg-blue-500 text-white font-bold tracking-wide rounded-2xl border-b-4 border-blue-700 hover:bg-blue-400 active:border-b-0 active:translate-y-1 transition-all border-none shadow-md shadow-sm shadow-slate-200 hover:bg-blue-500 border-slate-500 shadow-lg shadow-md shadow-slate-200" : "bg-white/50 text-slate-500 border-slate-200 hover:border-slate-300"
                        )}
                      >Instructor</button>
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all"
                  required
                />
              </div>
            </>
          )}

          {error && <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</p>}
          <button className="w-full bg-white text-slate-900 py-4 rounded-xl font-medium hover:bg-emerald-400 hover:shadow-lg hover:shadow-md shadow-slate-200 transition-all mt-4">
            {showOtp ? 'Verify & Continue' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        {!showOtp && (
          <p className="text-center mt-6 text-sm text-slate-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-slate-700 font-medium hover:text-slate-900 transition-colors">
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        )}
      </motion.div>
    </div>
  );
}

function StudentDashboard({ user, onSelectClass, onReviseNow }: { user: User, onSelectClass: (c: Classroom) => void, onReviseNow?: (c: Classroom, lessonId: number) => void }) {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [knowledge, setKnowledge] = useState<any>(null);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [studentFeedback, setStudentFeedback] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardData = () => {
      const ts = Date.now();
      fetch(`/api/student/dashboard?_t=${ts}`).then(res => res.json()).then(setDashboardData);
      fetch(`/api/classrooms?_t=${ts}`).then(res => res.json()).then(setClasses);
      fetch(`/api/student/knowledge?_t=${ts}`).then(res => res.json()).then(data => setKnowledge(data.knowledge));
      fetch(`/api/student/feedback?_t=${ts}`).then(res => res.json()).then(setStudentFeedback);
    };

    loadDashboardData();

    window.addEventListener('ReturnToStudentDashboard', loadDashboardData);
    return () => window.removeEventListener('ReturnToStudentDashboard', loadDashboardData);
  }, []);

  const handleJoin = async () => {
    const res = await fetch('/api/classrooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ join_code: joinCode })
    });
    if (res.ok) {
      const data = await res.json();
      setClasses([...classes, data]);
      setJoinCode('');
    } else {
      alert("Invalid code or already joined");
    }
  };

  if (!dashboardData) return <div className="text-center mt-20 animate-pulse text-slate-700">Loading Student Dashboard...</div>;
  if (dashboardData.error) return <div className="text-center mt-20 text-red-500">Error loading dashboard: {dashboardData.error}</div>;

  const { stats = { accuracy: 0, avgSpeed: 0, score: 0, label: 'Needs Support' }, weakTopics = [], streak = 0, maxStreak = 0, recentAssessments = [], accuracyTrend = [], recentActivity = [] } = dashboardData;

  // Derive Badges
  const badges = [
    { name: "First Assessment", condition: recentAssessments.length > 0, icon: <CheckCircle2 size={24} className="text-blue-400" /> },
    { name: "3-Day Streak", condition: maxStreak >= 3, icon: <Flame size={24} className="text-orange-400" /> },
    { name: "7-Day Warrior", condition: maxStreak >= 7, icon: <Flame size={24} className="text-rose-500" /> },
    { name: "Accuracy Pro", condition: stats.accuracy >= 90, icon: <Target size={24} className="text-slate-700" /> },
    { name: "Speed Master", condition: stats.avgSpeed <= 10 && stats.avgSpeed > 0, icon: <Zap size={24} className="text-yellow-400" /> }
  ];

  return (
    <div className="space-y-12 pb-12">
      {/* 1. DASHBOARD OVERVIEW */}
      <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold mb-2 text-slate-900 flex items-center gap-3">
            Welcome back, {user.full_name} <span className="text-3xl">👋</span>
          </h1>
          <p className="text-slate-500 flex items-center gap-2">
            Let's keep your learning momentum going!
            {streak > 0 && <span className="flex items-center gap-1 text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full text-xs font-medium border border-orange-500/20"><Flame size={12} /> {streak} Day Streak!</span>}
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-4 rounded-3xl flex items-center gap-4 ring-1 ring-slate-100 shadow-xl">
            <div className="w-14 h-14 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.2)_0%,transparent_100%)] rounded-full flex items-center justify-center border border-slate-500/30">
              <span className="text-2xl font-semibold text-slate-700">{stats.score}</span>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Performance</p>
              <div className={cn("text-sm font-medium mt-1 px-2 py-0.5 rounded-md inline-block",
                stats.label === 'Advanced' ? "bg-white/20 text-slate-700" :
                  stats.label === 'On Track' ? "bg-amber-500/20 text-slate-500" : "bg-rose-500/20 text-slate-500"
              )}>{stats.label}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. PROGRESS ANALYTICS (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/30 backdrop-blur-md bg-white/80 border-b border-slate-200 border border-slate-200 rounded-3xl p-6 ring-1 ring-slate-100">
            <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2 mb-6">
              <TrendingUp className="text-slate-700" /> Progress Analytics
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-4 rounded-3xl border border-slate-200 flex items-center gap-4">
                <Target className="text-blue-400" size={32} />
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500 tracking-wider">Avg Accuracy</p>
                  <p className="text-2xl font-semibold text-slate-700">{stats.accuracy}%</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-3xl border border-slate-200 flex items-center gap-4">
                <Zap className="text-yellow-400" size={32} />
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500 tracking-wider">Avg Speed</p>
                  <p className="text-2xl font-semibold text-slate-700">{stats.avgSpeed}s / q</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-64">
              <div className="h-full relative pl-2">
                <h4 className="absolute -top-2 left-0 text-[10px] font-medium uppercase tracking-wider text-slate-500 z-10">Accuracy Trend Over Time</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={accuracyTrend} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#0f172a', stroke: '#3b82f6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#3b82f6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="h-full relative pl-2">
                <h4 className="absolute -top-2 left-0 text-[10px] font-medium uppercase tracking-wider text-slate-500 z-10">Recent Assessment Scores</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recentAssessments} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v.substring(0, 8) + '...'} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px' }} />
                    <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* KNOWLEDGE GRAPH RADAR */}
          {knowledge?.concepts && knowledge.concepts.length > 0 && (
            <div className="bg-white/30 backdrop-blur-md bg-white/80 border-b border-slate-200 border border-slate-500/20 rounded-3xl p-6 ring-1 ring-slate-100 mt-6">
              <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2 mb-4">
                <Activity className="text-slate-900" /> AI Knowledge Profile
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={knowledge.concepts}>
                    <PolarGrid stroke="#1e293b" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 1]} tick={{ fill: '#64748b' }} axisLine={false} />
                    <Radar name="Mastery" dataKey="mastery" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-slate-500 text-center mt-2 italic">Your conceptual understanding as mapped by Native AI</p>
            </div>
          )}

          {/* MY CLASSROOMS QUICK JOIN */}
          <div className="bg-white/30 backdrop-blur-md bg-white/80 border-b border-slate-200 border border-slate-200 rounded-3xl p-6 ring-1 ring-slate-100 mt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2">
                <BookOpen className="text-blue-400" /> My Enrolled Classes
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Join Code"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  className="px-3 py-2 bg-white rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500/50 uppercase font-mono text-sm w-40"
                />
                <button
                  onClick={handleJoin}
                  className="bg-white text-slate-900 px-4 py-2 rounded-lg font-medium hover:bg-emerald-400 transition-all text-sm"
                >Join</button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {classes.map(c => (
                <div key={c.id} onClick={() => onSelectClass(c)} className="bg-white p-4 rounded-3xl border border-slate-200 hover:border-slate-500/50 cursor-pointer group transition-all flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-700 group-hover:text-slate-700 transition-colors">{c.name}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-1">Code: {c.join_code}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white group-hover:bg-white/20 flex items-center justify-center text-slate-500 group-hover:text-slate-700 transition-all">
                    <ArrowLeft className="rotate-180 w-4 h-4" />
                  </div>
                </div>
              ))}
              {classes.length === 0 && <p className="text-slate-500 text-sm italic col-span-2">You haven't joined any classes yet. Join using a code above!</p>}
            </div>
          </div>
        </div>

        {/* 3. RIGHT COLUMN: WEAK TOPICS, GAMIFICATION, RECENT ACTIVITY */}
        <div className="space-y-6">

          {/* STREAKS & BADGES */}
          <div className="bg-white/30 backdrop-blur-md bg-white/80 border-b border-slate-200 border border-slate-200 rounded-3xl p-6 ring-1 ring-slate-100">
            <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2 mb-4">
              <Award className="text-orange-400" /> Achievements
            </h3>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 bg-white p-4 rounded-3xl border border-orange-500/20 text-center relative overflow-hidden">
                <div className="absolute -bottom-4 -right-4 text-orange-500/10"><Flame size={64} /></div>
                <p className="text-xs font-medium uppercase text-slate-500 tracking-wider mb-1">Current Streak</p>
                <p className="text-3xl font-semibold text-orange-400">{streak} <span className="text-lg text-orange-500/50">Days</span></p>
              </div>
              <div className="flex-1 bg-white p-4 rounded-3xl border border-slate-200 text-center">
                <p className="text-xs font-medium uppercase text-slate-500 tracking-wider mb-1">Max Streak</p>
                <p className="text-3xl font-semibold text-slate-700">{maxStreak}</p>
              </div>
            </div>

            <p className="text-xs font-medium uppercase text-slate-500 tracking-wider mb-3">Badges</p>
            <div className="flex flex-wrap gap-2">
              {badges.map((b, i) => (
                <div key={i} className="group relative">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center border transition-all cursor-help",
                    b.condition ? "bg-slate-800 border-slate-300 hover:scale-110 shadow-lg shadow-sm shadow-slate-200" : "bg-white border-slate-200 opacity-40 grayscale"
                  )}>
                    {b.icon}
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-3 py-1.5 bg-slate-800 border border-slate-300 text-xs font-medium text-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                    {b.name} {!b.condition && "(Locked)"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* INSTRUCTOR FEEDBACK */}
          {studentFeedback && studentFeedback.length > 0 && (
            <div className="bg-white/30 backdrop-blur-md bg-white/80 border-b border-slate-200 border border-slate-500/20 rounded-3xl p-6 ring-1 ring-slate-100">
              <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2 mb-4">
                <MessageSquare className="text-slate-700" /> Instructor Feedback
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {studentFeedback.map((f: any, i: number) => (
                  <div key={i} className="bg-white p-4 rounded-3xl border border-slate-200 relative">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-2">
                      {f.instructor_name} • {f.classroom_name} {f.topic_name && <span className="text-slate-700"> • {f.topic_name}</span>}
                    </p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{f.message}</p>
                    <p className="text-[10px] text-slate-500 mt-2 text-right">
                      {new Date(f.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SMART REVISION RECOMMENDER */}
          <div className="bg-gradient-to-b from-slate-900/50 to-[#0a0a0a]/20 backdrop-blur-md bg-white/80 border-b border-slate-200 border border-slate-500/20 rounded-3xl p-6 ring-1 ring-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full filter blur-[40px] pointer-events-none" />
            <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2 mb-2 relative z-10">
              <AlertCircle className="text-slate-500" /> Smart Revision Focus
            </h3>
            <p className="text-sm text-slate-500 mb-4 relative z-10">AI detected areas where you need more support.</p>

            <div className="space-y-3 relative z-10 max-h-[250px] overflow-y-auto pr-1">
              {weakTopics.length > 0 ? weakTopics.map((t: any, i: number) => (
                <div key={i} className="bg-white p-4 rounded-3xl border border-slate-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-slate-700 text-sm pr-4 line-clamp-2">{t.title}</h4>
                    <span className={cn(
                      "text-[10px] font-medium uppercase px-2 py-0.5 rounded border whitespace-nowrap",
                      t.classification === 'Weak' ? "bg-rose-500/10 text-slate-500 border-slate-500/20" : "bg-amber-500/10 text-slate-500 border-slate-500/20"
                    )}>{Math.round(t.mastery * 100)}% {t.classification}</span>
                  </div>
                  <button
                    onClick={() => {
                      const classToRevise = classes.find(c => c.id === t.classroom_id);
                      if (classToRevise) {
                        if (onReviseNow) {
                          onReviseNow(classToRevise, t.id);
                        } else {
                          onSelectClass(classToRevise);
                        }
                      } else {
                        alert("You are no longer enrolled in this class.");
                      }
                    }}
                    className="w-full mt-2 py-2 rounded-xl text-xs font-medium bg-slate-800 text-white hover:bg-slate-700 transition-colors border border-slate-300 flex items-center justify-center gap-2">
                    <Play size={12} fill="currentColor" /> Revise Now
                  </button>
                </div>
              )) : (
                <div className="text-center p-6 bg-white rounded-3xl border border-slate-200 border-dashed">
                  <CheckCircle2 className="mx-auto text-slate-700/50 mb-2" size={32} />
                  <p className="text-slate-500 text-sm font-medium">All clear! You don't have any weak topics detected yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* RECENT ACTIVITY */}
          <div className="bg-white/30 backdrop-blur-md bg-white/80 border-b border-slate-200 border border-slate-200 rounded-3xl p-6 ring-1 ring-slate-100">
            <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2 mb-4">
              <Clock className="text-slate-700" /> Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.length > 0 ? recentActivity.map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full", a.is_correct ? "bg-white shadow-[0_0_10px_2px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_10px_2px_rgba(244,63,94,0.5)]")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{a.topic}</p>
                    <p className="text-[10px] font-mono text-slate-500">{a.is_correct ? 'Correct' : 'Incorrect'} in {a.time_spent}s</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-500">No recent activity.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function Dashboard({ user, onSelectClass }: { user: User, onSelectClass: (c: Classroom) => void }) {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    fetch('/api/classrooms').then(res => res.json()).then(setClasses);
  }, []);

  const handleCreate = async () => {
    const res = await fetch('/api/classrooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newClassName })
    });
    if (res.ok) {
      const data = await res.json();
      setClasses([...classes, data]);
      setShowCreate(false);
      setNewClassName('');
    }
  };

  const handleDeleteClass = async (id: number) => {
    if (!confirm('Are you sure you want to delete this class? This will wipe all subtopics and progress.')) return;
    const res = await fetch(`/api/classrooms/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setClasses(classes.filter(c => c.id !== id));
    }
  };

  const handleJoin = async () => {
    const res = await fetch('/api/classrooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ join_code: joinCode })
    });
    if (res.ok) {
      const data = await res.json();
      setClasses([...classes, data]);
      setJoinCode('');
    } else {
      alert("Invalid code or already joined");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-medium tracking-tight mb-2 text-slate-50">My Classrooms</h1>
          <p className="text-slate-500">Manage your learning environments</p>
        </div>
        {user.role === 'instructor' ? (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-3xl font-medium hover:bg-emerald-400 transition-all shadow-lg shadow-md shadow-slate-200"
          >
            <Plus size={20} />
            Create Class
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Join Code"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              className="px-4 py-3 bg-white rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/50 uppercase tracking-widest font-mono"
            />
            <button
              onClick={handleJoin}
              className="bg-white text-slate-900 px-6 py-3 rounded-xl font-medium hover:bg-emerald-400 transition-all shadow-lg shadow-md shadow-slate-200"
            >Join</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onSelectClass(c)}
            className="group bg-white/30 backdrop-blur-md bg-white/80 border-b border-slate-200 p-6 rounded-3xl border border-slate-200/80 ring-1 ring-slate-100 shadow-[0_0_30px_-15px_rgba(0,0,0,0.5)] hover:border-slate-500/50 hover:shadow-[0_0_40px_-15px_rgba(99,102,241,0.3)] hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-700">
              <ArrowLeft className="rotate-180" />
            </div>
            <div className="w-12 h-12 bg-slate-800 text-slate-100 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-white group-hover:text-slate-900 transition-colors">
              <BookOpen size={24} className="group-hover:text-indigo-500" />
            </div>
            <h3 className="text-xl font-medium mb-1 text-slate-800">{c.name}</h3>
            <p className="text-slate-500 text-sm font-mono uppercase tracking-widest">Code: <span className="text-slate-700 font-medium">{c.join_code}</span></p>
            {user.role === 'instructor' && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteClass(c.id); }}
                className="absolute bottom-4 right-4 p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors z-20 opacity-0 group-hover:opacity-100 shadow-sm"
              >
                <Trash2 size={16} />
              </button>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 rounded-3xl max-w-md w-full shadow-xl relative overflow-hidden"
            >

              <h2 className="text-2xl font-medium mb-6 text-slate-50">Create New Classroom</h2>
              <input
                type="text"
                placeholder="Classroom Name (e.g. Biology 101)"
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                className="w-full px-4 py-4 bg-white rounded-xl border border-slate-200 mb-6 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/50"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-4 rounded-xl font-medium text-slate-500 hover:bg-slate-800 transition-all border border-slate-200"
                >Cancel</button>
                <button
                  onClick={handleCreate}
                  className="flex-1 py-4 rounded-xl font-medium bg-indigo-500 text-white font-bold tracking-wide rounded-2xl border-b-4 border-indigo-700 hover:bg-indigo-400 active:border-b-0 active:translate-y-1 transition-all transition-all shadow-lg shadow-md shadow-slate-200"
                >Create</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ClassroomView({ classroom, user, onSelectSubtopic, onBack }: { classroom: Classroom, user: User, onSelectSubtopic: (l: Lesson, s: any) => void, onBack: () => void }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [showAddSubtopic, setShowAddSubtopic] = useState<number | null>(null);

  // Subtopic form
  const [stTitle, setStTitle] = useState('');
  const [stFile, setStFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  // Student Pre-Launch Modal State
  const [preLaunchSubtopic, setPreLaunchSubtopic] = useState<{ lesson: Lesson, subtopic: any } | null>(null);
  const [knowledge, setKnowledge] = useState<any>(null);
  const [subtopicAnalytics, setSubtopicAnalytics] = useState<any>(null);
  const [classroomMastery, setClassroomMastery] = useState<any[]>([]);

  // Instructor States
  const [activeTab, setActiveTab] = useState<'content' | 'students'>('content');
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [feedbackText, setFeedbackText] = useState<{ [key: number]: string }>({});
  const [feedbackTopic, setFeedbackTopic] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    fetch(`/api/classrooms/${classroom.id}/lessons`).then(res => res.json()).then(setLessons);
    if (user.role === 'student') {
      fetch('/api/student/knowledge').then(res => res.json()).then(data => setKnowledge(data.knowledge));
      fetch(`/api/student/classrooms/${classroom.id}/mastery`)
        .then(res => res.json())
        .then(data => {
          let padded = [...data];
          if (padded.length > 0 && padded.length < 3) {
            while (padded.length < 3) {
              padded.push({ name: '', mastery: 0, full_name: 'Upcoming' });
            }
          }
          setClassroomMastery(padded);
        });
    } else if (user.role === 'instructor') {
      fetch(`/api/classrooms/${classroom.id}/students`).then(res => res.json()).then(setEnrolledStudents);
    }
  }, [classroom.id, user.role]);

  const handleSendFeedback = async (studentId: number) => {
    const text = feedbackText[studentId];
    if (!text) return;
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, classroom_id: classroom.id, topic_name: feedbackTopic[studentId] || '', message: text })
    });
    if (res.ok) {
      alert("Feedback sent successfully.");
      setFeedbackText(prev => ({ ...prev, [studentId]: '' }));
      setFeedbackTopic(prev => ({ ...prev, [studentId]: '' }));
    } else {
      alert("Error sending feedback.");
    }
  };

  useEffect(() => {
    if (preLaunchSubtopic && user.role === 'student') {
      fetch(`/api/student/subtopic-analytics/${preLaunchSubtopic.subtopic.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.available) {
            setSubtopicAnalytics(data);
          } else {
            setSubtopicAnalytics(null);
          }
        });
    }
  }, [preLaunchSubtopic, user.role]);

  const handleAddLesson = async () => {
    const res = await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classroom_id: classroom.id, title: newLessonTitle, order_index: lessons.length })
    });
    if (res.ok) {
      const data = await res.json();
      setLessons([...lessons, { ...data, title: newLessonTitle, subtopics: [] }]);
      setShowAddLesson(false);
      setNewLessonTitle('');
    }
  };

  const handleAddSubtopic = async (lessonId: number) => {
    // Determine Sketchfab ID dynamically from title mapping
    const titleLower = stTitle.toLowerCase();
    const mappedKey = Object.keys(MODEL_MAP).find(k => titleLower.includes(k));
    const inferredSketchfabId = mappedKey ? MODEL_MAP[mappedKey] : '';

    const formData = new FormData();
    formData.append('lesson_id', lessonId.toString());
    formData.append('title', stTitle);
    formData.append('sketchfab_id', inferredSketchfabId);
    formData.append('order_index', (lessons.find(l => l.id === lessonId)?.subtopics.length || 0).toString());

    if (stFile) {
      formData.append('video', stFile);
    }

    if (questions.length > 0) {
      formData.append('questions', JSON.stringify(questions));
    }

    const res = await fetch('/api/subtopics', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      setLessons(lessons.map(l => l.id === lessonId ? { ...l, subtopics: [...l.subtopics, { ...data, title: stTitle, video_url: data.video_url || '', sketchfab_id: inferredSketchfabId, mcqs: questions }] } : l));
      setShowAddSubtopic(null);
      setStTitle(''); setStFile(null); setQuestions([]);
    }
  };

  const handleDeleteSubtopic = async (lessonId: number, subtopicId: number) => {
    if (!confirm('Are you sure you want to delete this subtopic?')) return;
    const res = await fetch(`/api/subtopics/${subtopicId}`, { method: 'DELETE' });
    if (res.ok) {
      setLessons(lessons.map(l => {
        if (l.id === lessonId) {
          return { ...l, subtopics: l.subtopics.filter((st: any) => st.id !== subtopicId) };
        }
        return l;
      }));
    }
  };

  const handleGenerateQuestions = async () => {
    if (!stTitle) return;
    setIsGeneratingQuestions(true);
    const prompt = `Based on the educational subtopic title "${stTitle}", generate exactly 15 multiple choice questions.
You must create 5 distinct "topic groups". For EACH topic group, generate exactly 3 questions:
1. A "medium" difficulty question (standard)
2. A "straightforward" difficulty question (easier, tests the same core concept as medium)
3. A "tricky" difficulty question (harder, edge cases, tests the same concept as medium)

Return ONLY a raw JSON array of 15 objects conforming securely to this interface without any markdown formatting or ticks:
[{
  "question_text": "string",
  "options": ["string", "string", "string", "string"],
  "correct_option_index": 0,
  "difficulty": "medium" | "straightforward" | "tricky",
  "topic_group_id": "string (a shared unique ID for the 3 questions in the same topic)"
}]`;

    try {
      const rawHtml = await askGemini(prompt, "");
      const cleaned = rawHtml.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        setQuestions(parsed);
      }
    } catch (e) {
      console.error("Failed to generate questions", e);
    }
    setIsGeneratingQuestions(false);
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-8 transition-colors">
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex flex-col md:flex-row md:items-center gap-8">
          <div>
            <h1 className="text-4xl font-medium tracking-tight mb-2 text-slate-50">{classroom.name}</h1>
            <p className="text-slate-500 font-mono">Join Code: <span className="text-slate-700 font-medium">{classroom.join_code}</span></p>
          </div>

          {user.role === 'student' && classroomMastery && classroomMastery.length > 0 && (
            <div className="flex items-center gap-4 bg-white/30 backdrop-blur-md bg-white/80 border-b border-slate-200 border border-slate-500/20 rounded-3xl p-4 ring-1 ring-slate-100 shadow-lg shadow-sm shadow-slate-200">
              <div className="w-24 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={classroomMastery}>
                    <PolarGrid stroke="#1e293b" />
                    <PolarAngleAxis dataKey="name" tick={false} />
                    <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
                    <Radar name="Mastery" dataKey="mastery" stroke="#10b981" fill="#10b981" fillOpacity={0.3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px', color: '#f8fafc' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="w-40">
                <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2 mb-1">
                  <Target className="text-slate-700" size={14} /> Topic Mastery
                </h3>
                <p className="text-slate-500 text-xs">Macro-view of your strengths across modules.</p>
              </div>
            </div>
          )}
        </div>

        {user.role === 'instructor' && activeTab === 'content' && (
          <button
            onClick={() => setShowAddLesson(true)}
            className="flex items-center justify-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-3xl font-medium hover:bg-emerald-400 transition-all shadow-lg shadow-md shadow-slate-200"
          >
            <Plus size={20} />
            Add Lesson
          </button>
        )}
      </div>

      {user.role === 'instructor' && (
        <div className="flex gap-4 mb-8">
          <button onClick={() => setActiveTab('content')} className={cn("px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2", activeTab === 'content' ? "bg-indigo-500 text-white" : "bg-white border border-slate-200 rounded-3xl shadow-sm text-slate-500")}><BookOpen size={18} /> Content Modules</button>
          <button onClick={() => setActiveTab('students')} className={cn("px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2", activeTab === 'students' ? "bg-indigo-500 text-white" : "bg-white border border-slate-200 rounded-3xl shadow-sm text-slate-500")}><Users size={18} /> Manage Students</button>
        </div>
      )}

      {activeTab === 'content' && (
        <div className="space-y-12">
          {lessons.map((lesson, li) => (
            <div key={lesson.id}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-medium flex items-center gap-3 text-slate-800">
                  <span className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-sm text-slate-500">{li + 1}</span>
                  {lesson.title}
                </h2>
                {user.role === 'instructor' && (
                  <button
                    onClick={() => setShowAddSubtopic(lesson.id)}
                    className="text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lesson.subtopics.map((st, si) => (
                  <motion.div
                    key={st.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: si * 0.05 }}
                    onClick={() => {
                      if (user.role === 'student') {
                        setPreLaunchSubtopic({ lesson, subtopic: st });
                      } else {
                        onSelectSubtopic(lesson, st);
                      }
                    }}
                    className="bg-white/30 backdrop-blur-md bg-white/80 border-b border-slate-200 p-6 rounded-3xl border border-slate-200/80 ring-1 ring-slate-100 shadow-[0_0_30px_-15px_rgba(0,0,0,0.5)] hover:border-slate-500/50 hover:shadow-[0_0_40px_-15px_rgba(99,102,241,0.3)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="aspect-video bg-slate-800 rounded-3xl mb-4 overflow-hidden relative border border-slate-200/80 group-hover:border-slate-500/50 transition-colors">
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/60 backdrop-blur-sm">
                        <div className="w-12 h-12 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-lg shadow-sm shadow-slate-2000">
                          <Play size={20} fill="currentColor" />
                        </div>
                      </div>
                      <img
                        src={`https://picsum.photos/seed/${st.id}/400/225`}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <h4 className="font-medium text-lg mb-1 text-slate-800">{st.title}</h4>
                    <div className="flex items-center gap-3 text-slate-500 text-xs font-medium uppercase tracking-wider">
                      <span className="flex items-center gap-1"><Play size={12} /> Video</span>
                      <span className="flex items-center gap-1"><Box size={12} /> 3D Model</span>
                    </div>
                    {user.role === 'instructor' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSubtopic(lesson.id, st.id); }}
                        className="absolute bottom-4 right-4 p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors z-20 opacity-0 group-hover:opacity-100 shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'students' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-medium text-slate-900 mb-6">Enrolled Students ({enrolledStudents.length})</h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {enrolledStudents.map(student => (
              <div key={student.id} className="bg-white/30 backdrop-blur-md bg-white/80 border-b border-slate-200 border border-slate-200 rounded-3xl p-6 ring-1 ring-slate-100">
                <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-xl font-medium text-slate-800 flex items-center gap-2"><UserIcon className="text-slate-700" /> {student.name}</h3>
                    <p className="text-sm text-slate-500">{student.email}</p>
                  </div>
                  <div className={cn("text-xs font-medium px-3 py-1 rounded-lg border",
                    student.stats?.label === 'Advanced' ? 'bg-white/10 border-slate-500/30 text-slate-700' :
                      student.stats?.label === 'On Track' ? 'bg-amber-500/10 border-slate-500/30 text-slate-500' :
                        'bg-rose-500/10 border-slate-500/30 text-slate-500'
                  )}>
                    {student.stats?.label || 'No Data'}
                  </div>
                </div>

                {student.stats?.totalAssessments > 0 && (
                  <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
                    <div className="bg-white p-3 rounded-3xl border border-slate-200 flex items-center gap-2 lg:gap-3 shrink-0">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-white/10 flex items-center justify-center border border-slate-500/20"><Target className="text-slate-700" size={16} /></div>
                      <div>
                        <p className="text-[9px] lg:text-[10px] font-medium uppercase text-slate-500 tracking-wider truncate">Avg Accuracy</p>
                        <p className="text-base lg:text-lg font-semibold text-slate-700">{student.stats?.accuracy}%</p>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-3xl border border-slate-200 flex items-center gap-2 lg:gap-3 shrink-0">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-slate-500/20"><Zap className="text-blue-400" size={16} /></div>
                      <div>
                        <p className="text-[9px] lg:text-[10px] font-medium uppercase text-slate-500 tracking-wider truncate">Avg Speed</p>
                        <p className="text-base lg:text-lg font-semibold text-slate-700">{student.stats?.avgSpeed}s / q</p>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-3xl border border-slate-200 flex items-center gap-2 lg:gap-3 shrink-0">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-slate-500/20"><Activity className="text-slate-700" size={16} /></div>
                      <div>
                        <p className="text-[9px] lg:text-[10px] font-medium uppercase text-slate-500 tracking-wider truncate">Health Score</p>
                        <p className="text-base lg:text-lg font-semibold text-slate-700">{student.stats?.score}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 bg-white border border-slate-200 rounded-3xl shadow-sm rounded-3xl p-4 flex flex-col justify-center">
                    <h4 className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-2 text-center">AI Knowledge Profile</h4>
                    {student.knowledge && student.knowledge.length > 0 ? (
                      <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={student.knowledge}>
                            <PolarGrid stroke="#1e293b" />
                            <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
                            <Radar name="Mastery" dataKey="mastery" stroke="#10b981" fill="#10b981" fillOpacity={0.3} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 4 }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-40 flex items-center justify-center text-sm text-slate-500 italic">No assessment data yet.</div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col gap-2">
                    <h4 className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1"><MessageSquare size={12} /> Send Feedback</h4>
                    <select
                      value={feedbackTopic[student.id] || ''}
                      onChange={e => setFeedbackTopic(prev => ({ ...prev, [student.id]: e.target.value }))}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500/50"
                    >
                      <option value="">General Feedback</option>
                      {lessons.flatMap(l => l.subtopics).map((st: any) => (
                        <option key={st.id} value={st.title}>{st.title}</option>
                      ))}
                    </select>
                    <textarea
                      value={feedbackText[student.id] || ''}
                      onChange={e => setFeedbackText(prev => ({ ...prev, [student.id]: e.target.value }))}
                      placeholder="E.g., Great job on Cell Division! Review Mitochondria before next class..."
                      className="w-full h-full min-h-[100px] resize-none px-4 py-3 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500/50"
                    />
                    <button
                      onClick={() => handleSendFeedback(student.id)}
                      disabled={!feedbackText[student.id]}
                      className="w-full py-2 bg-indigo-500 text-white font-bold rounded-xl text-sm hover:bg-indigo-400 shadow-md shadow-md shadow-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      Send to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {enrolledStudents.length === 0 && <p className="text-slate-500 italic col-span-2">No students have joined this class yet.</p>}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showAddLesson && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 rounded-3xl max-w-md w-full shadow-xl relative overflow-hidden">

              <h2 className="text-2xl font-medium mb-6 text-slate-50">New Lesson</h2>
              <input type="text" placeholder="Lesson Title" value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)} className="w-full px-4 py-4 bg-white rounded-xl border border-slate-200 mb-6 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all" autoFocus />
              <div className="flex gap-3">
                <button onClick={() => setShowAddLesson(false)} className="flex-1 py-4 rounded-xl font-medium text-slate-500 border border-slate-200 hover:bg-slate-800 transition-all">Cancel</button>
                <button onClick={handleAddLesson} className="flex-1 py-4 rounded-xl font-medium bg-indigo-500 text-white font-bold tracking-wide rounded-2xl border-b-4 border-indigo-700 hover:bg-indigo-400 active:border-b-0 active:translate-y-1 transition-all shadow-lg shadow-md shadow-slate-200 transition-all">Add</button>
              </div>
            </motion.div>
          </div>
        )}

        {showAddSubtopic !== null && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 rounded-3xl max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto relative overflow-hidden">

              <h2 className="text-2xl font-medium mb-6 text-slate-50">New Subtopic</h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-medium uppercase text-slate-500 mb-1">Title</label>
                  <input type="text" value={stTitle} onChange={e => setStTitle(e.target.value)} className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase text-slate-500 mb-1">Video File (MP4)</label>
                  <input type="file" accept="video/mp4,video/*" onChange={e => setStFile(e.target.files?.[0] || null)} className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-slate-700 hover:file:bg-slate-700 transition-all cursor-pointer" />
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-xs font-medium uppercase text-slate-500">Test Questions ({questions.length})</label>
                    <button onClick={handleGenerateQuestions} disabled={!stTitle || isGeneratingQuestions} className="text-xs bg-indigo-500/20 text-slate-700 hover:bg-indigo-500/30 px-3 py-1.5 rounded-lg transition-all font-medium disabled:opacity-50 flex items-center gap-1">
                      {isGeneratingQuestions ? <span className="animate-pulse">Generating...</span> : <><Box size={12} /> Auto-Generate with AI</>}
                    </button>
                  </div>
                  {questions.length > 0 && (
                    <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                      {questions.map((q, i) => (
                        <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 text-sm">
                          <p className="font-medium text-slate-700 mb-2">{q.question_text}</p>
                          {q.options.length > 1 ? (
                            <ul className="space-y-1">
                              {q.options.map((opt, oi) => (
                                <li key={oi} className={cn("px-2 py-1 rounded", q.correct_option_index === oi ? "bg-white/20 text-slate-700" : "text-slate-500")}>• {opt}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-slate-700 bg-white/20 px-2 py-1 rounded inline-block">Answer: {q.options[0]}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAddSubtopic(null)} className="flex-1 py-4 rounded-xl font-medium text-slate-500 border border-slate-200 hover:bg-slate-800 transition-all">Cancel</button>
                <button onClick={() => handleAddSubtopic(showAddSubtopic)} className="flex-1 py-4 rounded-xl font-medium bg-white text-slate-900 shadow-lg shadow-md shadow-slate-200 hover:bg-emerald-400 transition-all">Add</button>
              </div>
            </motion.div>
          </div>
        )}

        {preLaunchSubtopic && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 rounded-3xl max-w-2xl w-full shadow-xl relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-indigo-500" />
              <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center text-slate-700 mb-4 ring-1 ring-white/10 shadow-lg shadow-sm shadow-slate-200">
                <Activity size={32} />
              </div>
              <h2 className="text-3xl font-semibold mb-2 text-slate-900 text-center">{preLaunchSubtopic.subtopic.title}</h2>
              <p className="text-slate-500 mb-8 text-center text-sm">Module: {preLaunchSubtopic.lesson.title}</p>

              <div className="w-full bg-white border border-slate-200 rounded-3xl shadow-sm rounded-3xl p-6 mb-8 relative grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-widest text-slate-500 mb-4 flex justify-center items-center gap-2">
                    <Target size={16} /> Current AI Knowledge Mapping
                  </h3>
                  {knowledge?.concepts && knowledge.concepts.length > 0 ? (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={knowledge.concepts}>
                          <PolarGrid stroke="#1e293b" />
                          <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
                          <Radar name="Mastery" dataKey="mastery" stroke="#10b981" fill="#10b981" fillOpacity={0.3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-56 flex flex-col items-center justify-center text-slate-500">
                      <Zap size={32} className="mb-2 opacity-50" />
                      <p className="text-sm font-medium text-center">No AI Radar Graph available.</p>
                      <p className="text-xs text-center mt-1">Complete the adaptive assessment to gather data.</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-center space-y-4 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                  <h3 className="text-sm font-medium uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2 justify-center">
                    <History size={16} /> Past Assessment Data
                  </h3>
                  {subtopicAnalytics ? (
                    <>
                      <div className="bg-white rounded-3xl p-4 border border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-medium uppercase text-slate-500">Latest Score</span>
                        <span className="text-2xl font-semibold text-slate-700">{subtopicAnalytics.score}%</span>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1 bg-white rounded-3xl p-4 border border-slate-200 text-center">
                          <p className="text-[10px] font-medium uppercase text-slate-500 mb-1">Accuracy</p>
                          <p className="text-lg font-medium text-slate-700">{subtopicAnalytics.accuracy}%</p>
                        </div>
                        <div className="flex-1 bg-white rounded-3xl p-4 border border-slate-200 text-center">
                          <p className="text-[10px] font-medium uppercase text-slate-500 mb-1">Avg Speed</p>
                          <p className="text-lg font-medium text-slate-700">{subtopicAnalytics.avgSpeed}s</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 py-8">
                      <p className="text-sm font-medium">No previous tests recorded.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex w-full gap-4">
                <button onClick={() => setPreLaunchSubtopic(null)} className="flex-1 py-4 rounded-xl font-medium text-slate-500 bg-white border border-slate-200 rounded-3xl shadow-sm hover:bg-slate-800 transition-all">
                  Cancel
                </button>
                <button
                  onClick={() => onSelectSubtopic(preLaunchSubtopic.lesson, preLaunchSubtopic.subtopic)}
                  className="flex-[2] py-4 rounded-xl font-medium text-slate-900 bg-white hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2">
                  Launch Immersive Module <Play size={18} fill="currentColor" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LearningView({ subtopic, lesson, autoStartTest, onBack }: { subtopic: Subtopic, lesson: Lesson, autoStartTest?: boolean, onBack: () => void }) {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isHandTrackingEnabled, setIsHandTrackingEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const sfApiRef = useRef<any>(null);
  const cameraCacheRef = useRef<any>(null);

  const [studentKnowledge, setStudentKnowledge] = useState<any>(null);

  useEffect(() => {
    fetch('/api/student/knowledge').then(res => res.json()).then(data => setStudentKnowledge(data.knowledge));
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isHandTrackingEnabled) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(e => console.error("Camera access failed", e));
    } else {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isHandTrackingEnabled]);

  useEffect(() => {

    if (subtopic.sketchfab_id && iframeRef.current && window.Sketchfab) {
      const client = new window.Sketchfab(iframeRef.current);
      client.init(subtopic.sketchfab_id, {
        success: (api: any) => {
          api.start();
          api.addEventListener('viewerready', () => {
            sfApiRef.current = api;
            api.getCameraLookAt((err: any, camera: any) => {
              if (!err && camera) {
                cameraCacheRef.current = camera;
              }
            });
          });
        },
        error: () => console.error('Sketchfab API error'),
        autostart: 1,
        ui_infos: 0,
        ui_watermark: 0,
        ui_theme: 'dark',
        dnt: 1,
        transparent: 1
      });
    }

  }, [subtopic.sketchfab_id]);

  const handleGesture = (g: { rx: number, ry: number, zoom: number, px: number, py: number }) => {
    if (!sfApiRef.current || !cameraCacheRef.current) return;
    const api = sfApiRef.current;

    let [px, py, pz] = cameraCacheRef.current.position;
    let [tx, ty, tz] = cameraCacheRef.current.target;

    // Direct Pan (moving the camera pivot origin)
    if (g.px !== 0 || g.py !== 0) {
      // Tune speed
      const pSpeed = 0.05;
      tx += g.px * pSpeed;
      ty -= g.py * pSpeed;
      px += g.px * pSpeed;
      py -= g.py * pSpeed;
    }

    const dx = px - tx;
    const dy = py - ty;
    const dz = pz - tz;

    let r = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    let theta = Math.atan2(dy, dx);
    let phi = Math.acos(dz / r);

    // Map 1:1 instantaneous zoom
    r *= (1 - g.zoom * 0.05);
    r = Math.max(0.1, Math.min(1000, r));

    // Map 1:1 instantaneous rotation
    theta -= (g.rx * 0.015);
    phi -= (g.ry * 0.015);

    // Clamp vertical orbit
    phi = Math.max(0.01, Math.min(Math.PI - 0.01, phi));

    px = tx + r * Math.sin(phi) * Math.cos(theta);
    py = ty + r * Math.sin(phi) * Math.sin(theta);
    pz = tz + r * Math.cos(phi);

    // Keep camera internally synchronized so we never have to wait for iframe async response
    cameraCacheRef.current = { position: [px, py, pz], target: [tx, ty, tz] };

    api.setCameraLookAt([px, py, pz], [tx, ty, tz], 0);
  };

  const handleSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    const context = `Lesson: ${lesson.title}. Subtopic: ${subtopic.title}. Video URL: ${subtopic.video_url}. Sketchfab ID: ${subtopic.sketchfab_id}.`;
    const aiResponse = await askGemini(userMsg, context);

    setMessages(prev => [...prev, { role: 'ai', text: aiResponse || "I'm not sure about that." }]);
    setIsTyping(false);
  };

  const [showTest, setShowTest] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [activeTopicGroups, setActiveTopicGroups] = useState<string[]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentQuestionDifficulty, setCurrentQuestionDifficulty] = useState<'medium' | 'straightforward' | 'tricky'>('medium');
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [testMetrics, setTestMetrics] = useState<any[]>([]);
  const [finalDashboard, setFinalDashboard] = useState<any>(null);

  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [dynamicMcqs, setDynamicMcqs] = useState<any[]>(subtopic.mcqs || []);

  const handleEndSession = async () => {
    let mcqsToUse = dynamicMcqs;

    if (!mcqsToUse || mcqsToUse.length === 0) {
      setIsGeneratingTest(true);
      const prompt = `Based on the educational subtopic title "${subtopic.title}" from the lesson "${lesson.title}", generate exactly 15 multiple choice questions.
You must create 5 distinct "topic groups". For EACH topic group, generate exactly 3 questions:
1. A "medium" difficulty question (standard)
2. A "straightforward" difficulty question (easier, tests the same core concept as medium)
3. A "tricky" difficulty question (harder, edge cases, tests the same concept as medium)

${studentKnowledge?.concepts ? `The student's current mapped knowledge is: ${JSON.stringify(studentKnowledge.concepts)}. Use this to tailor the distractors and focus areas of these questions.` : ''}

Return ONLY a raw JSON array of 15 objects conforming securely to this interface without any markdown formatting or ticks:
[{
  "question_text": "string",
  "options": ["string", "string", "string", "string"],
  "correct_option_index": 0,
  "difficulty": "medium" | "straightforward" | "tricky",
  "topic_group_id": "string (a shared unique ID for the 3 questions in the same topic)"
}]`;
      try {
        const rawHtml = await askGemini(prompt, "");
        const cleaned = rawHtml.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          mcqsToUse = parsed;
          setDynamicMcqs(parsed);
        } else {
          alert("Could not generate questions. Please try again.");
          setIsGeneratingTest(false);
          return;
        }
      } catch (e) {
        console.error(e);
        alert("Could not generate questions. Please try again.");
        setIsGeneratingTest(false);
        return;
      }
      setIsGeneratingTest(false);
    }

    // Find all unique topic groups
    const uniqueGroups = Array.from(new Set(mcqsToUse.map((q: any) => q.topic_group_id || 'general')));
    // Take up to 5 topic groups
    const selectedGroups = uniqueGroups.slice(0, 5);

    setActiveTopicGroups(selectedGroups);
    setCurrentGroupIndex(0);
    setCurrentQuestionDifficulty('medium');
    setTestMetrics([]);
    setTestCompleted(false);
    setFinalDashboard(null);
    setShowTest(true);
    setQuestionStartTime(Date.now());
  };

  const hasAutoStartedRef = useRef(false);
  useEffect(() => {
    if (autoStartTest && !showTest && !testCompleted && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      handleEndSession();
    }
  }, [autoStartTest, subtopic.id, showTest, testCompleted]);

  const getQuestion = (groupId: string, difficulty: string) => {
    return dynamicMcqs.find((q: any) => (q.topic_group_id || 'general') === groupId && q.difficulty === difficulty)
      || dynamicMcqs.find((q: any) => (q.topic_group_id || 'general') === groupId) // fallback
      || dynamicMcqs[0];
  };

  const handleAdaptiveAnswer = async (opt: string) => {
    const groupId = activeTopicGroups[currentGroupIndex];
    const question = getQuestion(groupId, currentQuestionDifficulty);
    const isCorrect = question.options[question.correct_option_index] === opt;
    const timeSpent = (Date.now() - questionStartTime) / 1000;

    const newMetric = {
      questionId: question.id || 0,
      difficulty: currentQuestionDifficulty,
      isCorrect,
      timeSpent: timeSpent,
      groupId
    };

    const newMetrics = [...testMetrics, newMetric];
    setTestMetrics(newMetrics);

    let nextDifficulty: 'medium' | 'straightforward' | 'tricky' | null = null;
    let nextGroupIndex = currentGroupIndex;

    // ADAPTIVE LOGIC
    if (isCorrect) {
      // They got it right, move to next group
      nextGroupIndex++;
      nextDifficulty = 'medium';
    } else {
      // They got it wrong
      if (currentQuestionDifficulty === 'medium') {
        nextDifficulty = 'straightforward';
      } else if (currentQuestionDifficulty === 'straightforward') {
        nextDifficulty = 'tricky';
      } else {
        // Tricky got wrong too, move to next group
        nextGroupIndex++;
        nextDifficulty = 'medium';
      }
    }

    if (nextGroupIndex >= activeTopicGroups.length) {
      // TEST FINISHED
      await generateDashboard(newMetrics);
    } else {
      setCurrentGroupIndex(nextGroupIndex);
      setCurrentQuestionDifficulty(nextDifficulty!);
      setQuestionStartTime(Date.now());
    }
  };

  const generateDashboard = async (metrics: any[]) => {
    setShowTest(false);

    // Save metrics to backend
    try {
      await fetch('/api/student/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtopic_id: subtopic.id, metrics })
      });
    } catch (e) {
      console.error("Failed to save metrics", e);
    }

    // Calculate Scores based on spec
    let correctCount = metrics.filter(m => m.isCorrect).length;
    let totalQuestions = metrics.length;
    let accuracy = correctCount / totalQuestions;

    let totalIdealTime = metrics.length * 15; // Assume 15 seconds ideal per question
    let totalActualTime = metrics.reduce((acc, m) => acc + m.timeSpent, 0);
    let speedScore = Math.max(0, Math.min(1, totalIdealTime / totalActualTime));

    // Calculate Difficulty Mastery Weight
    let difficultyWeightSum = 0;
    metrics.forEach(m => {
      if (m.difficulty === 'medium' && m.isCorrect) difficultyWeightSum += 1.0;
      else if (m.difficulty === 'straightforward' && m.isCorrect) difficultyWeightSum += 0.7;
      else if (m.difficulty === 'tricky') difficultyWeightSum += 0.3; // Reached tricky
    });
    // Max possible weight is length of groups (since 1.0 per group max)
    let maxWeight = activeTopicGroups.length;
    let masteryScore = difficultyWeightSum / maxWeight;

    // Final Performance Score (0-100)
    let finalScore = ((0.5 * accuracy) + (0.3 * speedScore) + (0.2 * masteryScore)) * 100;

    let label = finalScore >= 80 ? 'Advanced' : (finalScore >= 50 ? 'On Track' : 'Needs Support');

    // Generate AI Feedback via Gemini
    setIsTyping(true);
    const feedbackPrompt = `A student just finished an adaptive assessment.
Metrics:
- Final Score: ${Math.round(finalScore)}/100
- Accuracy: ${Math.round(accuracy * 100)}%
- Time spent avg per question: ${Math.round(totalActualTime / totalQuestions)}s
- Difficulties faced: ${JSON.stringify(metrics.map(m => m.difficulty))}
Write a human-like feedback focusing on strengths, weak areas, speed analysis. Additionally, explicitly tell them how they can improve more for their weak areas or in general. KEEP IT SHORT (max 4 sentences).`;

    const aiFeedback = await askGemini(feedbackPrompt, "");

    // Master RAG Profile Update Loop
    let updatedMetricsProfile = studentKnowledge;
    try {
      const updatePrompt = `A student took an assessment on subtopic: "${subtopic.title}".
Scores: ${Math.round(finalScore)}/100.
Their previously mapped AI Knowledge Profile: ${studentKnowledge ? JSON.stringify(studentKnowledge) : "None"}.
Update their knowledge profile mapping based on this new test score. Return a raw JSON object with a "concepts" array. Each concept must have:
"name" (string, short core concept name), "mastery" (float 0.0 to 1.0). Keep it to 3 to 6 major core concepts. 
Ensure the output is ONLY a raw JSON object, no markdown or comments.`;

      const rawK = await askGemini(updatePrompt, "");
      const cleanedK = rawK.replace(/```json/g, '').replace(/```/g, '').trim();
      updatedMetricsProfile = JSON.parse(cleanedK);

      // Save their new AI Profile Back to the Backend Server!
      await fetch('/api/student/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knowledge: updatedMetricsProfile })
      });
      setStudentKnowledge(updatedMetricsProfile);
    } catch (e) {
      console.error("AI Knowledge RAG Error", e);
    }

    setIsTyping(false);

    setFinalDashboard({
      score: Math.round(finalScore),
      accuracy: Math.round(accuracy * 100),
      label,
      timeAvg: Math.round(totalActualTime / totalQuestions),
      feedback: aiFeedback,
      metrics
    });
    setTestCompleted(true);
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 text-slate-500 hover:text-slate-800 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-medium text-slate-50">{subtopic.title}</h1>
            <p className="text-slate-500 text-sm">{lesson.title}</p>
          </div>
        </div>
        <button
          onClick={handleEndSession}
          disabled={isGeneratingTest}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-5 py-2.5 rounded-xl font-medium text-sm tracking-wide transition-all shadow-lg shadow-red-500/10 flex items-center gap-2 relative z-20 disabled:opacity-50"
        >
          {isGeneratingTest ? <span className="animate-pulse">Generating Test...</span> : 'End Session & Test'}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 pb-6"
      >
        <div className="flex flex-col gap-6 lg:col-span-1 h-full min-h-0">
          <div className="bg-white rounded-3xl overflow-hidden shadow-[0_0_40px_-15px_rgba(0,0,0,1)] border border-slate-200/80 ring-1 ring-slate-100 relative group shrink-0">
            {(() => {
              const url = subtopic.video_url || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
              const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
              if (ytMatch) {
                return (
                  <iframe
                    src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                    className="w-full aspect-video border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                );
              }
              return (
                <video
                  src={url}
                  controls
                  className="w-full aspect-video object-contain"
                />
              );
            })()}
          </div>

          <div className="bg-white/40 backdrop-blur-2xl rounded-3xl border border-slate-200/80 ring-1 ring-slate-100 flex flex-col shadow-[0_0_40px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex-1 min-h-0 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
            <div className="p-4 border-b border-slate-200/80 bg-white/40 backdrop-blur-md bg-white/80 border-b border-slate-200 flex items-center gap-2 relative z-10">
              <MessageSquare size={18} className="text-slate-700" />
              <span className="font-medium text-sm text-slate-800">AI Tutor</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-12 h-12 bg-slate-800 rounded-3xl flex items-center justify-center mb-4 border border-slate-200">
                    <MessageSquare className="text-slate-500" />
                  </div>
                  <p className="text-slate-500 text-sm">Ask me anything about this lesson!</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] p-3 rounded-3xl text-sm transition-all",
                    m.role === 'user' ? "bg-white text-slate-900 rounded-tr-none shadow-lg shadow-md shadow-slate-200" : "bg-slate-800 text-slate-700 rounded-tl-none border border-slate-300"
                  )}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-300 p-3 rounded-3xl rounded-tl-none flex gap-1 items-center h-10 shadow-sm">
                    <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-white/30">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type your question..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  className="w-full pl-4 pr-12 py-3 rounded-xl bg-white border border-slate-200 rounded-3xl shadow-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all text-sm"
                />
                <button
                  onClick={handleSend}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-500 text-white font-bold tracking-wide rounded-2xl border-b-4 border-blue-700 hover:bg-blue-400 active:border-b-0 active:translate-y-1 transition-all border-none shadow-md shadow-sm shadow-slate-200 hover:bg-blue-500 rounded-lg hover:bg-slate-200 transition-all shadow-sm shadow-md shadow-slate-200"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6 h-full min-h-0 overflow-y-auto">
          <div className="flex-1 bg-white rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200 relative min-h-[400px] border border-slate-200/80 ring-1 ring-slate-100 flex items-center justify-center group">
            <div className="absolute inset-0 z-10 pointer-events-none [background:radial-gradient(circle_at_center,transparent_45%,black_100%)]" />
            <div className="absolute inset-0 z-10 pointer-events-none backdrop-blur-sm [mask-image:radial-gradient(circle_at_center,transparent_60%,black_100%)]" />

            {subtopic.sketchfab_id ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={cn("absolute inset-0 w-full h-full object-cover z-0 opacity-80", !isHandTrackingEnabled && "hidden")}
                  style={{ transform: 'scaleX(-1)' }}
                />
                <HandTracker videoRef={videoRef} onGesture={handleGesture} isActive={isHandTrackingEnabled}>
                  <iframe
                    ref={iframeRef}
                    title="Sketchfab"
                    className="w-full h-full border-0 absolute inset-0 z-10"
                    allow="autoplay; fullscreen; xr-spatial-tracking"
                  />
                </HandTracker>

                <button
                  onClick={() => setIsHandTrackingEnabled(!isHandTrackingEnabled)}
                  className={cn(
                    "absolute top-4 left-4 z-[70] px-4 py-2 rounded-full font-medium text-xs uppercase tracking-widest flex items-center gap-2 border backdrop-blur-md transition-all",
                    isHandTrackingEnabled
                      ? "bg-white/20 text-slate-700 border-slate-500/50 shadow-sm shadow-sm shadow-slate-200"
                      : "bg-white/80 text-slate-500 border-slate-300 hover:bg-slate-800"
                  )}
                >
                  <Hand size={14} className={isHandTrackingEnabled ? "text-slate-700" : "text-slate-500"} />
                  {isHandTrackingEnabled ? "AR Hands: ON" : "AR Hands: OFF"}
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mb-4 border border-slate-200 shadow-xl shadow-sm shadow-slate-200">
                  <Box className="text-slate-500" size={24} />
                </div>
                <h3 className="text-slate-700 font-medium text-lg mb-2">No 3D Model Available</h3>
                <p className="text-slate-500 text-sm max-w-sm">
                  There is no interactive 3D model assigned to this lesson yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showTest && activeTopicGroups.length > 0 && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 rounded-3xl max-w-3xl w-full shadow-xl relative overflow-hidden flex flex-col min-h-[400px]">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-100 to-cyan-50" />

              {(() => {
                const question = getQuestion(activeTopicGroups[currentGroupIndex], currentQuestionDifficulty);
                return (
                  <>
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h2 className="text-2xl font-medium text-slate-900 flex items-center gap-2">
                          <Activity className="text-slate-900" />
                          Adaptive Assessment
                        </h2>
                        <p className="text-slate-500 text-sm font-mono mt-1 uppercase">
                          Topic {currentGroupIndex + 1} of {activeTopicGroups.length} • Difficulty: <span className="text-slate-700">{currentQuestionDifficulty}</span>
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {activeTopicGroups.map((_, i) => (
                          <div key={i} className={cn("w-3 h-3 rounded-full", i < currentGroupIndex ? "bg-white" : i === currentGroupIndex ? "bg-white animate-pulse" : "bg-slate-800")} />
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 pr-2 pb-6">
                      <h3 className="text-2xl font-medium text-slate-700 mb-8 leading-relaxed">
                        {question.question_text}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(Array.isArray(question?.options) ? question.options : []).map((opt: string, i: number) => (
                          <button
                            key={i}
                            onClick={() => handleAdaptiveAnswer(opt)}
                            className="group w-full text-left p-6 rounded-3xl border bg-white border-slate-200 text-slate-700 hover:border-slate-500/50 hover:bg-slate-800 hover:text-white hover:shadow-sm shadow-sm shadow-slate-200 hover:-translate-y-1 transition-all duration-200"
                          >
                            <span className="inline-block w-8 h-8 rounded-lg bg-slate-100 text-center leading-8 font-medium text-slate-500 mr-3 group-hover:bg-white/20 group-hover:text-white">{String.fromCharCode(65 + i)}</span>
                            <span className="text-lg">{opt}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}

        {testCompleted && finalDashboard && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto pt-24 pb-12">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-4xl w-full">

              <div className="text-center mb-10">
                <h1 className="text-5xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-4 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                  Performance Genome
                </h1>
                <p className="text-slate-500 text-lg">Your adaptive intelligence profile for this session</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

                {/* Score Card */}
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden ring-1 ring-slate-100 shadow-xl shadow-sm shadow-slate-200">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_100%)] pointer-events-none" />
                  <div className="relative z-10 text-center">
                    <span className="text-7xl font-semibold text-slate-900 tracking-tighter drop-shadow-lg">{finalDashboard.score}</span>
                    <div className={cn(
                      "mt-4 px-4 py-1.5 rounded-full text-sm font-medium uppercase tracking-widest inline-block mx-auto border backdrop-blur-md",
                      finalDashboard.label === 'Advanced' ? "bg-white/20 text-slate-700 border-slate-500/50" :
                        finalDashboard.label === 'On Track' ? "bg-amber-500/20 text-slate-500 border-slate-500/50" :
                          "bg-rose-500/20 text-slate-500 border-slate-500/50"
                    )}>
                      {finalDashboard.label}
                    </div>
                  </div>
                </div>

                {/* Sub Metrics */}
                <div className="md:col-span-2 grid grid-cols-2 gap-6">
                  <div className="bg-white border border-slate-200 rounded-3xl shadow-sm rounded-3xl p-6 flex flex-col justify-center ring-1 ring-slate-100">
                    <Target className="text-slate-500 mb-4" size={28} />
                    <h4 className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">Precision Accuracy</h4>
                    <span className="text-3xl font-semibold text-slate-800">{finalDashboard.accuracy}%</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-3xl shadow-sm rounded-3xl p-6 flex flex-col justify-center ring-1 ring-slate-100">
                    <Zap className="text-slate-500 mb-4" size={28} />
                    <h4 className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">Avg Response Speed</h4>
                    <span className="text-3xl font-semibold text-slate-800">{finalDashboard.timeAvg}s <span className="text-sm font-medium text-slate-500">/ question</span></span>
                  </div>
                </div>

              </div>

              {/* AI Insight */}
              <div className="bg-white border border-slate-500/30 rounded-3xl p-8 mb-6 relative overflow-hidden shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-screen filter blur-[50px] pointer-events-none" />
                <h3 className="text-slate-700 font-medium uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                  <Activity size={16} /> AI Intelligence Analysis
                </h3>
                <p className="text-lg text-slate-700 leading-relaxed max-w-3xl relative z-10">
                  {finalDashboard.feedback}
                </p>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm rounded-3xl p-6 ring-1 ring-slate-100 h-80">
                  <h4 className="text-slate-500 font-medium uppercase tracking-wider text-xs mb-6">Response Speed Trend (s)</h4>
                  <ResponsiveContainer width="100%" height="80%">
                    <LineChart data={finalDashboard.metrics.map((m: any, i: number) => ({ name: `Q${i + 1}`, time: m.timeSpent }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                      <Line type="monotone" dataKey="time" stroke="#10b981" strokeWidth={3} dot={{ fill: '#0f172a', stroke: '#10b981', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#10b981' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm rounded-3xl p-6 ring-1 ring-slate-100 h-80">
                  <h4 className="text-slate-500 font-medium uppercase tracking-wider text-xs mb-6">Difficulty Breakdown</h4>
                  <ResponsiveContainer width="100%" height="80%">
                    <BarChart data={[
                      { name: 'Medium', attempts: finalDashboard.metrics.filter((m: any) => m.difficulty === 'medium').length },
                      { name: 'Straightfwrd', attempts: finalDashboard.metrics.filter((m: any) => m.difficulty === 'straightforward').length },
                      { name: 'Tricky', attempts: finalDashboard.metrics.filter((m: any) => m.difficulty === 'tricky').length }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                      <Bar dataKey="attempts" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setFinalDashboard(null);
                    setTestCompleted(false);
                    setShowTest(false);
                    // Force the app back to the root student dashboard
                    window.dispatchEvent(new CustomEvent('ReturnToStudentDashboard'));
                    onBack(); // Just close LearningView
                  }}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-300 text-white px-12 py-4 rounded-3xl font-medium tracking-wide transition-all shadow-lg"
                >
                  Return to Dashboard
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LandingView({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen flex flex-col relative z-10 w-full">
      {/* Navbar for Landing */}
      <nav className="w-full px-8 py-6 flex items-center justify-between backdrop-blur-md bg-white/50 border-b border-slate-200/50 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Box className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-900">GraspIQ</span>
        </div>
        <div className="flex gap-4">
          <button onClick={onGetStarted} className="px-6 py-2.5 rounded-full font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all">Sign In</button>
          <button onClick={onGetStarted} className="px-6 py-2.5 rounded-full font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20">Get Started</button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full filter blur-[100px] pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-4xl relative z-10">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-700 font-semibold text-sm tracking-wide shadow-sm">
            🚀 The Future of 3D Learning
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-slate-900 mb-8 leading-tight">
            Master complex concepts in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Immersive 3D</span>
          </h1>
          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            GraspIQ is an adaptive AI-powered Learning Management System that uses interactive 3D models and real-time personalized intelligence to accelerate your understanding.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={onGetStarted} className="w-full sm:w-auto px-8 py-4 rounded-full font-semibold text-lg text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-3 group">
              Start Learning Now
              <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={onGetStarted} className="w-full sm:w-auto px-8 py-4 rounded-full font-semibold text-lg text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm">
              View Demo
            </button>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div className="w-full max-w-6xl mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {[
            { icon: <Box className="w-8 h-8 text-indigo-500" />, title: 'Interactive 3D Models', desc: 'Explore concepts naturally with spatial intelligence and hands-on manipulation.' },
            { icon: <Zap className="w-8 h-8 text-amber-500" />, title: 'Adaptive AI Assessments', desc: 'Questions that adapt to your knowledge level in real-time, pinpointing your exact weak spots.' },
            { icon: <TrendingUp className="w-8 h-8 text-emerald-500" />, title: 'Performance Genome', desc: 'Deep analytics on your cognitive load, guess probability, and conceptual mastery.' }
          ].map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-200/60 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] text-left group hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">{f.title}</h3>
              <p className="text-slate-600 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="w-full py-8 text-center text-slate-500 text-sm border-t border-slate-200/50 relative z-10">
        <p>© 2026 GraspIQ. All rights reserved. Designed for the future of education.</p>
      </footer>
    </div>
  );
}
