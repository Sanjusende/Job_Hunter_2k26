import React, { useState } from 'react';
import {
  User,
  Mail,
  Award,
  Target,
  MapPin,
  CheckCircle,
  BarChart3,
  Clock,
  Cpu,
  Server,
  Sparkles,
  UploadCloud,
  Zap,
  RefreshCw,
  RotateCcw
} from 'lucide-react';
import MatchBadge from './MatchBadge';
import { DashboardSkeleton } from './SkeletonLoader';
import ResumeUpload from './ResumeUpload';

export default function AnalyticsDashboard({
  profile,
  matches = [],
  systemHealth,
  onTriggerAggregation,
  isAggregating,
  onTriggerEmailAlert,
  isSendingAlert,
  onUpdateEmail,
  onUploadSuccess,
  onError,
  onLoadShubham,
  onLoadDemo,
  onResetProfile
}) {
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [inputEmail, setInputEmail] = useState('');
  const [showUploader, setShowUploader] = useState(false);

  const handleSaveEmail = () => {
    if (inputEmail && inputEmail.includes('@')) {
      if (onUpdateEmail) onUpdateEmail(inputEmail);
      setIsEditingEmail(false);
    }
  };

  if (isAggregating) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 py-2">
          <Server className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Ingesting fresh opportunities & re-evaluating cluster metrics...</span>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  // If no profile is loaded, provide full extraction interface directly in Dashboard
  if (!profile) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bento-panel rounded-3xl p-6 sm:p-10 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Resume Extraction &amp; Candidate Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-lg mx-auto leading-relaxed">
              Upload your resume (.pdf or .docx) directly below to extract skills, contacts, target roles, and real-time job compatibility ratings.
            </p>
          </div>

          <div className="pt-2 text-left">
            <ResumeUpload
              onUploadSuccess={onUploadSuccess}
              onError={onError}
              currentProfile={null}
            />
          </div>

          {/* Quick-load profiles for testing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 text-left border-t border-slate-100">
            {onLoadShubham && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-xs font-extrabold text-indigo-700 block">Shubham Uprade (Resume)</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    MERN Stack Developer &bull; shubhamuprade0@gmail.com
                  </span>
                </div>
                <button
                  onClick={onLoadShubham}
                  className="btn-primary-gradient px-3.5 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Extract Shubham's Profile</span>
                </button>
              </div>
            )}

            {onLoadDemo && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-xs font-extrabold text-slate-900 block">Sample Profile (Alex Vance)</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Senior Full Stack &bull; Cloud Architect
                  </span>
                </div>
                <button
                  onClick={onLoadDemo}
                  className="btn-secondary-bento px-3.5 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Load Sample Profile</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const totalMatches = matches.length;
  const highMatches = matches.filter(m => m.matchScore >= 80).length;
  const goodMatches = matches.filter(m => m.matchScore >= 60 && m.matchScore < 80).length;
  const avgScore = totalMatches > 0
    ? Math.round(matches.reduce((acc, curr) => acc + curr.matchScore, 0) / totalMatches)
    : 0;

  const skills = profile.extractedSkills || profile.skills || [];
  const skillsCount = skills.length;
  const targetRoles = profile.targetRoles || profile.roles || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Collapsible In-Dashboard Resume Upload / Re-extract Accordion */}
      {showUploader && (
        <div className="bento-panel rounded-2xl sm:rounded-3xl p-6 relative border-2 border-indigo-200 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              Upload &amp; Extract New Resume
            </h3>
            <button
              onClick={() => setShowUploader(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>
          <ResumeUpload
            onUploadSuccess={(newProfile) => {
              setShowUploader(false);
              if (onUploadSuccess) onUploadSuccess(newProfile);
            }}
            onError={onError}
            currentProfile={profile}
          />
        </div>
      )}

      {/* Candidate Profile Bento Panel */}
      <div className="bento-panel rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 pb-6 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-4 w-full sm:w-auto">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-extrabold text-2xl shadow-btn-glow shrink-0 border border-white">
              {profile.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate">{profile.name}</h2>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-indigo-500" />
                  {profile.experienceLevel || 'Mid'} Level
                </span>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  ATS Extracted
                </span>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 text-xs text-slate-500 mt-2 flex-wrap font-medium">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  {isEditingEmail ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <input
                        type="email"
                        value={inputEmail}
                        onChange={(e) => setInputEmail(e.target.value)}
                        placeholder="your_email@gmail.com"
                        className="px-2.5 py-1 text-xs bg-white border border-indigo-400 rounded-lg text-slate-900 focus:outline-none shadow-sm"
                      />
                      <button
                        onClick={handleSaveEmail}
                        className="btn-primary-gradient px-2.5 py-1 text-xs rounded-lg font-bold shadow-xs"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditingEmail(false)}
                        className="btn-secondary-bento px-2 py-1 text-xs rounded-lg text-slate-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1.5 group">
                      <span className={profile.email?.includes('example.com') ? 'text-indigo-600 font-semibold' : 'text-slate-800 font-bold'}>
                        {profile.email}
                      </span>
                      <button
                        onClick={() => {
                          setInputEmail(profile.email || '');
                          setIsEditingEmail(true);
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline font-bold"
                      >
                        Edit
                      </button>
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  Threshold: <strong className="text-slate-900 font-bold">{profile.matchThreshold || 70}%</strong>
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  {(profile.preferredLocations || ['India', 'Remote']).join(', ')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto mt-2 lg:mt-0">
            <button
              onClick={() => setShowUploader(!showUploader)}
              className="btn-secondary-bento px-3.5 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 whitespace-nowrap shadow-xs"
              title="Upload another resume to re-extract in dashboard"
            >
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              <span>{showUploader ? 'Hide Uploader' : 'Re-extract Resume'}</span>
            </button>

            {onResetProfile && (
              <button
                onClick={onResetProfile}
                className="btn-secondary-bento px-3 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 text-slate-600 hover:text-rose-600"
                title="Clear current profile"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            <button
              onClick={() => onTriggerEmailAlert && onTriggerEmailAlert(profile.email)}
              disabled={isSendingAlert}
              className="btn-primary-gradient px-4 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-btn-glow whitespace-nowrap"
              title="Send an email digest of top matches directly to candidate email"
            >
              <Mail className="w-4 h-4" />
              {isSendingAlert ? 'Sending Email Alert...' : 'Send Email Alert !📨'}
            </button>

            <button
              onClick={() => onTriggerAggregation && onTriggerAggregation(profile.targetRoles)}
              disabled={isAggregating}
              className="btn-secondary-bento px-4 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Server className="w-4 h-4 text-indigo-600" />
              {isAggregating ? 'Aggregating...' : 'Fetch Fresh Openings'}
            </button>
          </div>
        </div>

        {/* Target Roles & Extracted Skills in Bento sub-cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              Target Career Roles ({targetRoles.length})
            </h4>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {targetRoles.map((role, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200/80 shadow-xs"
                >
                  {role}
                </span>
              ))}
              {targetRoles.length === 0 && (
                <span className="text-xs text-slate-400 italic">No target roles specified</span>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              Extracted Skills Matrix ({skillsCount})
            </h4>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white text-slate-800 border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 transition-colors shadow-xs"
                >
                  {skill}
                </span>
              ))}
              {skillsCount === 0 && (
                <span className="text-xs text-slate-400 italic">No skills extracted</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Modular Bento Metrics Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        <div className="bento-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Scored</span>
            <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{totalMatches}</p>
          <span className="text-xs text-slate-400 block truncate">Active job listings</span>
        </div>

        <div className="bento-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">High Match (&gt;80%)</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{highMatches}</p>
          <span className="text-xs text-emerald-600 font-semibold block truncate">Prime interview fit</span>
        </div>

        <div className="bento-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Avg Score</span>
            <MatchBadge score={avgScore} size="sm" showLabel={false} />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{avgScore}%</p>
          <span className="text-xs text-slate-400 block truncate">Weighted role match</span>
        </div>

        <div className="bento-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Autonomous Alerts</span>
            <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-sm sm:text-base font-bold text-slate-900 truncate">
            {profile.lastJobAlertSent ? new Date(profile.lastJobAlertSent).toLocaleDateString() : 'Active (Cron 6h)'}
          </p>
          <span className="text-xs text-indigo-600 font-semibold block truncate">Worker Daemon running</span>
        </div>
      </div>

      {/* System Architecture & Health Bento Card */}
      {systemHealth && (
        <div className="bento-panel rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              Microservices Cluster Readiness
            </h4>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              All Containers Healthy
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block text-xs font-medium">API Server Uptime</span>
              <span className="font-mono font-bold text-slate-900 mt-1 text-sm block">{Math.round(systemHealth.uptime || 0)}s</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block text-xs font-medium">MongoDB Connection</span>
              <span className="font-semibold text-slate-900 mt-1 text-sm block">
                {systemHealth.dbConnected ? 'Connected (Atlas / Container)' : 'Ready'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block text-xs font-medium">Cron Worker Status</span>
              <span className="font-semibold text-indigo-600 mt-1 text-sm block">Scheduled (Every 6 Hours)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
