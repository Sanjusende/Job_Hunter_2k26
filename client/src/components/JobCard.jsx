import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  MapPin,
  ExternalLink,
  CheckCircle2,
  CircleDashed,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Clock,
  Zap,
  Bookmark,
  Sparkles
} from 'lucide-react';

/**
 * Premium Job Card Component
 * Fully responsive across mobile, tablet, and desktop viewports.
 * Features circular match dial, company avatar initials, matching vs missing skills,
 * and direct source portal CTA button with modern Cyber Obsidian & Indigo theme.
 */
export default function JobCard({ matchItem, candidateSkills = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const { job, matchScore, score, matchedSkills = [] } = matchItem || {};
  if (!job) return null;

  const finalScore = typeof matchScore === 'number'
    ? matchScore
    : (typeof score === 'number' ? score : (job.matchScore || 75));

  // Determine High Match (>=80%), Good Match (60-79%), or Fair Match
  const isHighMatch = finalScore >= 80;
  const isGoodMatch = finalScore >= 60 && finalScore < 80;

  // Format posted time
  const formatTime = (dateStr) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const hours = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
  };

  // Company avatar initial letter icon with sleek Periwinkle & White gradient
  const companyName = job.company || 'Confidential';
  const companyInitial = companyName.charAt(0).toUpperCase();

  const gradients = [
    'from-[#7975FF] via-[#9592FF] to-[#B0AEFF] text-[#070814]',
    'from-white via-[#DCDAFF] to-[#B0AEFF] text-[#070814]',
    'from-[#5E58F5] via-[#7975FF] to-[#B0AEFF] text-white',
    'from-[#9592FF] via-[#B0AEFF] to-white text-[#070814]'
  ];
  const gradientIndex = (companyName.charCodeAt(0) || 0) % gradients.length;
  const companyGradient = gradients[gradientIndex];

  // Identify missing skills / skills gap for candidate guidance
  const commonTech = ['react', 'node.js', 'typescript', 'docker', 'aws', 'mongodb', 'kubernetes', 'python', 'graphql', 'sql'];
  const jobTextLower = `${job.title} ${job.description}`.toLowerCase();
  const missingSkills = commonTech.filter(tech =>
    jobTextLower.includes(tech) && !matchedSkills.map(s => s.toLowerCase()).includes(tech)
  ).slice(0, 3);

  // Fallback direct URL if applyUrl is missing or example.com
  let applyUrl = job.applyUrl || '#';
  if (!applyUrl || applyUrl === '#' || applyUrl.includes('example.com')) {
    applyUrl = `https://www.google.com/search?q=${encodeURIComponent(`${job.title || ''} ${companyName} jobs`)}&ibp=htl;jobs`;
  }

  // Calculate SVG circular score dial
  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (finalScore / 100) * circumference;

  // Dynamic dial colors with Royal Indigo & Periwinkle
  const dialBorderColor = isHighMatch
    ? 'border-indigo-200 bg-indigo-50/70 text-indigo-700'
    : isGoodMatch
      ? 'border-blue-200 bg-blue-50/70 text-blue-700'
      : 'border-slate-200 bg-slate-50 text-slate-600';

  const dialGlowColor = isHighMatch
    ? 'shadow-[0_4px_16px_rgba(99,102,241,0.18)]'
    : isGoodMatch
      ? 'shadow-[0_4px_12px_rgba(59,130,246,0.15)]'
      : '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bento-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between relative group"
    >
      {/* Top Card Row */}
      <div>
        <div className="flex items-start justify-between gap-3 sm:gap-4 mb-3.5">

          {/* Company Initial Badge & Job Info */}
          <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr ${companyGradient} flex items-center justify-center font-extrabold text-base sm:text-lg shadow-sm border border-white/80 shrink-0`}>
              {companyInitial}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 sm:line-clamp-1 leading-snug">
                {job.title || 'Untitled Role'}
              </h3>

              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                <span className="font-bold text-slate-800 truncate max-w-[130px] sm:max-w-none">{companyName}</span>
                <span className="text-slate-300">&bull;</span>
                <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate max-w-[110px] sm:max-w-none">{job.location || 'Remote'}</span>
                </span>
                {job.salary && (
                  <>
                    <span className="text-slate-300 hidden sm:inline">&bull;</span>
                    <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md text-[11px]">{job.salary}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Match Score Circular SVG Dial & Bookmark */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border backdrop-blur-md transition-all ${dialBorderColor} ${dialGlowColor}`}
              title={`${finalScore}% ATS Match Score`}
            >
              <svg className="w-10 h-10 sm:w-11 sm:h-11 transform -rotate-90">
                <circle
                  cx="22"
                  cy="22"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="opacity-15"
                  fill="transparent"
                />
                <circle
                  cx="22"
                  cy="22"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out text-indigo-600"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] sm:text-xs font-extrabold text-slate-900">
                {finalScore}%
              </div>
            </div>

            <button
              onClick={() => setIsSaved(!isSaved)}
              className={`p-2 rounded-xl transition-all btn-animated active:scale-90 ${isSaved ? 'text-indigo-600 bg-indigo-50 border border-indigo-200' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              title={isSaved ? 'Saved to bookmarks' : 'Save job'}
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>

        {/* Skills Section: Matched vs Skills Gap with Pastel Chips */}
        <div className="my-3.5 space-y-2 pt-2.5 border-t border-slate-100">
          {/* Matched Skills */}
          {matchedSkills.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mr-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Matched:
              </span>
              {matchedSkills.slice(0, 5).map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs lowercase"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Missing Skills (Skills Gap Guidance) */}
          {missingSkills.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 mr-1 flex items-center gap-1">
                <CircleDashed className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                Skills Gap:
              </span>
              {missingSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs lowercase"
                  title="Suggested skill for this role"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Description snippet */}
        <div className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
          <p className={isExpanded ? '' : 'line-clamp-2'}>
            {job.description || 'No detailed description provided for this opening.'}
          </p>
        </div>
      </div>

      {/* Card Footer: Metadata & Actions */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">

        {/* Source Badge & Posted Time */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-bold px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 uppercase text-[10px] tracking-wide">
            {job.source || 'Portal'}
          </span>
          <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            {formatTime(job.postedAt)}
          </span>
        </div>

        {/* Right CTA Button & Toggle with smooth animations */}
        <div className="flex items-center gap-2.5 ml-auto sm:ml-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors inline-flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-indigo-50"
          >
            {isExpanded ? (
              <>Less <ChevronUp className="w-3.5 h-3.5" /></>
            ) : (
              <>Details <ChevronDown className="w-3.5 h-3.5" /></>
            )}
          </button>

          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary-gradient inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl shadow-btn-glow whitespace-nowrap"
          >
            <span>Apply on Portal</span>
            <ExternalLink className="w-3.5 h-3.5 text-white" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}


