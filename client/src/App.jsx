import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Sparkles,
  Layers,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Filter,
  Search,
  SlidersHorizontal,
  Bot,
  ExternalLink,
  Zap,
  Mail
} from 'lucide-react';
import ResumeUpload from './components/ResumeUpload';
import JobCard from './components/JobCard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { JobListSkeleton } from './components/SkeletonLoader';
import { fetchJobMatches, checkHealth, triggerJobAggregation, triggerEmailAlert, updateProfileEmail } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'feed' | 'analytics'
  const [currentProfile, setCurrentProfile] = useState(() => {
    const saved = localStorage.getItem('job_hunter_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [matches, setMatches] = useState([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);
  const [isAggregating, setIsAggregating] = useState(false);

  // Filters for Live Job Feed
  const [searchQuery, setSearchQuery] = useState('');
  const [minScoreFilter, setMinScoreFilter] = useState(0); // 0, 60, 80
  const [remoteOnly, setRemoteOnly] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  const addToast = (type, message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Poll system health once on mount
  useEffect(() => {
    checkHealth()
      .then(data => setSystemHealth(data))
      .catch(() => setSystemHealth({ status: 'offline', uptime: 0, dbConnected: false }));
  }, []);

  // Fetch job matches whenever candidate profile updates
  useEffect(() => {
    if (currentProfile) {
      localStorage.setItem('job_hunter_profile', JSON.stringify(currentProfile));
      loadMatches(currentProfile.email || currentProfile._id);
    }
  }, [currentProfile]);

  const loadMatches = async (userId) => {
    if (!userId) return;
    setIsLoadingMatches(true);
    try {
      const data = await fetchJobMatches(userId);
      setMatches(data.matches || []);
    } catch (err) {
      console.error('Failed to load job matches:', err);
      addToast('error', 'Unable to fetch real-time job matches.');
    } finally {
      setIsLoadingMatches(false);
    }
  };

  // Self-healing: if localStorage holds a stale/empty profile from an earlier failed parse, upgrade to Shubham's profile
  useEffect(() => {
    if (
      currentProfile &&
      (currentProfile.name === 'Unknown' ||
        currentProfile.email?.includes('example.com') ||
        (!(currentProfile.extractedSkills?.length || currentProfile.skills?.length)))
    ) {
      loadShubhamCandidate();
    }
  }, []);

  const handleUploadSuccess = (profile) => {
    setCurrentProfile(profile);
    addToast('success', `Resume parsed successfully! Welcome, ${profile.name || 'Candidate'}.`);
    if (activeTab === 'upload') {
      setActiveTab('feed');
    }
  };

  const handleResetProfile = () => {
    localStorage.removeItem('job_hunter_profile');
    setCurrentProfile(null);
    setMatches([]);
    addToast('info', 'Profile cleared. You can now upload or extract a new resume.');
  };

  const handleTriggerAggregation = async (roles) => {
    setIsAggregating(true);
    addToast('info', 'Triggering autonomous job aggregation across providers...');
    try {
      await triggerJobAggregation(roles);
      addToast('success', 'Fresh job listings ingested successfully.');
      if (currentProfile) {
        await loadMatches(currentProfile.email || currentProfile._id);
      }
    } catch (err) {
      addToast('error', 'Job aggregation pipeline failed to update.');
    } finally {
      setIsAggregating(false);
    }
  };

  const [isSendingAlert, setIsSendingAlert] = useState(false);

  const handleTriggerEmailAlert = async (targetEmail) => {
    const emailToUse = targetEmail || currentProfile?.email || 'shubhamuprade0@gmail.com';
    if (!emailToUse || !emailToUse.includes('@')) {
      addToast('error', 'Please provide a valid recipient email address.');
      return;
    }

    setIsSendingAlert(true);
    addToast('info', `Dispatching high-match job alert email to ${emailToUse}...`);

    try {
      const res = await triggerEmailAlert(emailToUse, currentProfile || {});
      addToast('success', `🎯 Email alert successfully sent to ${emailToUse}! Check your inbox.`);
      if (currentProfile) {
        setCurrentProfile(prev => ({
          ...prev,
          email: emailToUse,
          lastJobAlertSent: new Date().toISOString()
        }));
      }
    } catch (err) {
      console.error('Email alert trigger error:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to dispatch email alert.';
      addToast('error', `Email alert failed: ${msg}`);
    } finally {
      setIsSendingAlert(false);
    }
  };

  const handleUpdateEmail = async (newEmail) => {
    if (!newEmail || !newEmail.includes('@')) {
      addToast('error', 'Invalid email address.');
      return;
    }

    try {
      await updateProfileEmail(currentProfile?.email, newEmail, currentProfile?._id);
      setCurrentProfile(prev => ({ ...prev, email: newEmail }));
      addToast('success', `Updated alert email to ${newEmail}`);
    } catch (err) {
      addToast('error', 'Failed to update email in profile.');
    }
  };

  // Quick Shubham Uprade profile loader
  const loadShubhamCandidate = () => {
    const shubham = {
      _id: 'shubham-uprade-profile',
      name: 'Shubham Uprade',
      email: 'shubhamuprade0@gmail.com',
      experienceLevel: 'Entry',
      extractedSkills: [
        'react.js', 'node.js', 'express.js', 'mongodb', 'javascript',
        'typescript', 'python', 'java', 'html', 'tailwind css',
        'rest apis', 'postgresql', 'mysql', 'git', 'github',
        'jenkins', 'docker', 'postman', 'jwt', 'chakra ui', 'vercel'
      ],
      skills: [
        'react.js', 'node.js', 'express.js', 'mongodb', 'javascript',
        'typescript', 'python', 'java', 'html', 'tailwind css',
        'rest apis', 'postgresql', 'mysql', 'git', 'github',
        'jenkins', 'docker', 'postman', 'jwt', 'chakra ui', 'vercel'
      ],
      targetRoles: ['Full Stack Developer (MERN)', 'Frontend Developer', 'Node.js Developer', 'React Developer'],
      preferredLocations: ['Bhopal, India', 'Bengaluru, India', 'Pune, India', 'Remote (India)'],
      matchThreshold: 70,
      lastJobAlertSent: null
    };
    setCurrentProfile(shubham);
    addToast('success', 'Loaded Shubham Uprade (MERN Stack Developer) profile.');
  };

  // Quick Demo profile for instant testing without resume upload
  const loadDemoCandidate = () => {
    const demo = {
      _id: 'demo-candidate-1',
      name: 'Alex Vance',
      email: 'alex.vance.engineer@example.com',
      experienceLevel: 'Senior',
      extractedSkills: [
        'React', 'Node.js', 'TypeScript', 'Docker', 'Kubernetes',
        'AWS', 'MongoDB', 'PostgreSQL', 'Tailwind CSS', 'CI/CD', 'Microservices'
      ],
      skills: [
        'React', 'Node.js', 'TypeScript', 'Docker', 'Kubernetes',
        'AWS', 'MongoDB', 'PostgreSQL', 'Tailwind CSS', 'CI/CD', 'Microservices'
      ],
      targetRoles: ['Senior Full Stack Engineer', 'Cloud Architect', 'DevOps Engineer'],
      preferredLocations: ['Bengaluru, India', 'Pune, India', 'Remote (India)'],
      matchThreshold: 70,
      lastJobAlertSent: null
    };
    setCurrentProfile(demo);
    addToast('info', 'Loaded Senior Full Stack sample candidate profile.');
  };

  // Filtered Job Listings
  const filteredMatches = matches.filter(({ job, matchScore }) => {
    if (minScoreFilter > 0 && matchScore < minScoreFilter) return false;
    if (remoteOnly && !job.location.toLowerCase().includes('remote')) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchInTitle = (job.title || '').toLowerCase().includes(q);
      const matchInCompany = (job.company || '').toLowerCase().includes(q);
      const matchInDesc = (job.description || '').toLowerCase().includes(q);
      if (!matchInTitle && !matchInCompany && !matchInDesc) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-mesh text-slate-900 flex flex-col selection:bg-indigo-100 selection:text-indigo-900 relative pb-16 sm:pb-0">
      {/* Floating Curved Pill Header Navigation */}
      <header className="sticky top-0 z-40 bento-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 flex items-center justify-center shadow-btn-glow shrink-0 border border-white text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 truncate">Job Hunter Agent</span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                  ATS v2.5
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block truncate font-medium">
                Autonomous Career Agent &bull; Continuous Matching Engine
              </p>
            </div>
          </div>

          {/* Desktop Bento Navigation Tabs */}
          <nav className="hidden sm:flex items-center gap-1.5 p-1.5 bg-slate-100/80 border border-slate-200/80 rounded-2xl backdrop-blur-md">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 btn-animated ${activeTab === 'upload'
                ? 'bg-white text-indigo-700 shadow-bento'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
            >
              <Sparkles className={`w-4 h-4 ${activeTab === 'upload' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>ATS Resume</span>
            </button>

            <button
              onClick={() => setActiveTab('feed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative btn-animated ${activeTab === 'feed'
                ? 'bg-white text-indigo-700 shadow-bento'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
            >
              <Briefcase className={`w-4 h-4 ${activeTab === 'feed' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Live Matches</span>
              {matches.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white shadow-xs">
                  {matches.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 btn-animated ${activeTab === 'analytics'
                ? 'bg-white text-indigo-700 shadow-bento'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
            >
              <BarChart3 className={`w-4 h-4 ${activeTab === 'analytics' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Dashboard</span>
            </button>
          </nav>

          {/* Cluster Status Indicator */}
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Cluster Live
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Tab 1: Resume Upload & ATS Parsing */}
        {activeTab === 'upload' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2.5 mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs mb-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Next-Gen Career Intelligence</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Autonomous Job Matching &amp; ATS Parser
              </h1>
              <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
                Powered by Google Gemini AI, MongoDB, and scheduled background workers. Drop your resume to trigger continuous opportunity tracking.
              </p>
            </div>

            <ResumeUpload
              onUploadSuccess={handleUploadSuccess}
              onError={(msg) => addToast('error', msg)}
              currentProfile={currentProfile}
            />

            {/* Quick Demo Bento Card */}
            <div className="bento-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-left space-y-0.5">
                <span className="text-sm font-bold text-slate-900 block">Want to test without a file?</span>
                <span className="text-xs text-slate-500">Load a pre-configured Senior Full Stack &amp; Cloud Architect profile.</span>
              </div>
              <button
                onClick={loadDemoCandidate}
                className="btn-primary-gradient w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 whitespace-nowrap shadow-btn-glow"
              >
                <Zap className="w-4 h-4 text-white" />
                <span>Load Sample Candidate</span>
              </button>
            </div>
          </div>
        )}


        {/* Tab 2: Live Job Matching Feed */}
        {activeTab === 'feed' && (
          <div className="space-y-6">
            {/* Header & Filter Controls Bento Panel */}
            <div className="bento-panel rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                    Live Job Matching Feed
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentProfile
                      ? `Scoring job openings against ${currentProfile.name}'s extracted skills.`
                      : 'Upload a resume to see personalized ATS scores.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                  <button
                    onClick={() => handleTriggerEmailAlert(currentProfile?.email)}
                    disabled={isSendingAlert}
                    className="btn-primary-gradient flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-btn-glow whitespace-nowrap"
                    title="Send top job matches directly to your Gmail inbox"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{isSendingAlert ? 'Sending...' : 'Email Alert Bhejo 📨'}</span>
                  </button>
                  <button
                    onClick={() => currentProfile && loadMatches(currentProfile.email || currentProfile._id)}
                    disabled={isLoadingMatches}
                    className="btn-secondary-bento p-2.5 text-xs rounded-xl"
                    title="Refresh Matches"
                  >
                    <RefreshCw className={`w-4 h-4 text-indigo-600 ${isLoadingMatches ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Filters row with Bento styling */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3.5 border-t border-slate-100">
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search title, company, skills..."
                    className="w-full pl-10 pr-9 py-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Score threshold buttons */}
                <div className="flex items-center gap-1 bg-slate-100/80 border border-slate-200 rounded-xl p-1">
                  <span className="text-[11px] text-indigo-700 pl-2 pr-1 font-bold">Match:</span>
                  <button
                    onClick={() => setMinScoreFilter(0)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all btn-animated ${minScoreFilter === 0 ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setMinScoreFilter(60)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all btn-animated ${minScoreFilter === 60 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                    &gt;60%
                  </button>
                  <button
                    onClick={() => setMinScoreFilter(80)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all btn-animated ${minScoreFilter === 80 ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                    &gt;80%
                  </button>
                </div>

                {/* Remote toggle */}
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl">
                  <span className="text-xs text-slate-700 font-bold">Remote Roles Only</span>
                  <input
                    type="checkbox"
                    checked={remoteOnly}
                    onChange={(e) => setRemoteOnly(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Skeleton Loading State or Real Listings Grid */}
            {isLoadingMatches || isAggregating ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 py-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>
                    {isAggregating
                      ? 'Aggregating fresh jobs across microservice portals...'
                      : 'Calculating real-time ATS match scores...'}
                  </span>
                </div>
                {/* High-fidelity Skeleton Loaders ("scalatne") */}
                <JobListSkeleton count={4} />
              </div>
            ) : filteredMatches.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:gap-5">
                {filteredMatches.map((matchItem, idx) => (
                  <JobCard key={matchItem.job?.jobId || idx} matchItem={matchItem} />
                ))}
              </div>
            ) : (
              <div className="bento-panel rounded-2xl sm:rounded-3xl p-8 sm:p-14 text-center space-y-3.5">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <Briefcase className="w-7 h-7" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">No Job Openings Matched Your Filter</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                  Try lowering the match threshold or clearing search keywords to view all roles.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setMinScoreFilter(0);
                    setRemoteOnly(false);
                  }}
                  className="btn-secondary-bento px-5 py-2 text-xs font-bold rounded-xl shadow-xs"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Analytics & Cluster Telemetry */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            profile={currentProfile}
            matches={matches}
            systemHealth={systemHealth}
            onTriggerAggregation={handleTriggerAggregation}
            isAggregating={isAggregating}
            onTriggerEmailAlert={handleTriggerEmailAlert}
            isSendingAlert={isSendingAlert}
            onUpdateEmail={handleUpdateEmail}
            onUploadSuccess={handleUploadSuccess}
            onError={(msg) => addToast('error', msg)}
            onLoadShubham={loadShubhamCandidate}
            onLoadDemo={loadDemoCandidate}
            onResetProfile={handleResetProfile}
          />
        )}
      </main>

      {/* Mobile Floating Bottom Navigation Dock (Thumb-friendly & tactile) */}
      <nav className="sm:hidden fixed bottom-3 left-3 right-3 z-40 bg-white/95 border border-indigo-100 rounded-2xl p-1.5 flex items-center justify-around backdrop-blur-2xl shadow-xl">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all btn-animated ${activeTab === 'upload' ? 'text-indigo-600 font-bold bg-indigo-50/80' : 'text-slate-400 hover:text-slate-700'
            }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px]">Resume</span>
        </button>

        <button
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all relative btn-animated ${activeTab === 'feed' ? 'text-indigo-600 font-bold bg-indigo-50/80' : 'text-slate-400 hover:text-slate-700'
            }`}
        >
          <Briefcase className="w-4 h-4" />
          <span className="text-[10px]">Matches</span>
          {matches.length > 0 && (
            <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all btn-animated ${activeTab === 'analytics' ? 'text-indigo-600 font-bold bg-indigo-50/80' : 'text-slate-400 hover:text-slate-700'
            }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-[10px]">Dashboard</span>
        </button>
      </nav>

      {/* Footer in Soft Lavender Theme */}
      <footer className="mt-auto border-t border-indigo-100 bg-white/70 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            <span>Micro-architecture: 3 Containers &bull; Node 20 &bull; Nginx &bull; MongoDB</span>
          </div>
          <div>
            <span>Continuous ATS Pipeline &bull; Gemini AI</span>
          </div>
        </div>
      </footer>

      {/* Toast Notification Stack */}
      <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-50 flex flex-col gap-2.5 max-w-[calc(100vw-24px)] sm:max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-xl transition-all transform translate-y-0 ${toast.type === 'success'
              ? 'bg-white/95 border-emerald-200 text-slate-900 shadow-emerald-500/10'
              : toast.type === 'error'
                ? 'bg-rose-50/95 border-rose-300 text-rose-950 shadow-rose-500/10'
                : 'bg-white/95 border-indigo-200 text-slate-900 shadow-indigo-500/10'
              }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />}

            <div className="flex-1 text-xs leading-relaxed font-bold">
              {toast.message}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}

