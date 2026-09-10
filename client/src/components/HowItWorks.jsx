import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Sparkles,
  Cpu,
  Mail,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Zap,
  Globe,
  Briefcase,
  ShieldCheck,
  Search,
  Code2,
  Layers,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  BarChart3,
  Bot
} from 'lucide-react';

/**
 * Fully Responsive HowItWorks Component
 * Supports all viewports: Mobile (<640px), Tablet (640-1024px), Desktop (>1024px)
 * Features:
 * - Interactive Step Simulator with touch-friendly thumb navigation (Prev / Next)
 * - Complete 4-Step Architecture Roadmap (Vertical timeline on mobile, grid on desktop)
 * - Interactive Mockup Terminal & Output simulator
 * - Mobile-friendly Accordion FAQ section
 * - High-converting Call-to-Actions
 */
export default function HowItWorks({ onStartUpload, onExploreJobs, onLoadDemo }) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(null);

  const steps = [
    {
      id: 1,
      stepNumber: '01',
      badge: 'Step 1: Smart ATS Ingestion',
      title: 'Drop Resume & Extract ATS Skills via Gemini AI',
      subtitle: 'Zero tedious forms. Multi-engine parsing in under 2 seconds.',
      icon: Sparkles,
      iconBg: 'from-indigo-500 to-violet-600',
      description:
        'Upload your PDF, DOCX, or text document. Our multi-engine ATS parser powered by Google Gemini AI analyzes your entire profile, extracting 20+ technical competencies, seniority levels, target developer roles, and contact info.',
      features: [
        'Multi-format parsing (.pdf, .docx, .txt) with magic byte security',
        'Automatic candidate email extraction directly from resume',
        'Deep tech taxonomy (React, Node, Python, Docker, AWS)',
        'Zero-trust sandbox against corrupted or oversized files'
      ],
      interactivePreview: {
        type: 'resume',
        filename: 'candidate_resume.pdf',
        size: '274 KB',
        skills: ['React.js', 'Node.js', 'TypeScript', 'MongoDB', 'AWS', 'Docker', 'REST APIs', 'PostgreSQL'],
        level: 'Mid-Senior • 3+ Years Exp',
        role: 'Full Stack Engineer'
      }
    },
    {
      id: 2,
      stepNumber: '02',
      badge: 'Step 2: Real-Time Aggregation',
      title: 'Autonomous Multi-Portal Tech Job Ingestion',
      subtitle: 'Continuous background crawling across Indian tech hubs.',
      icon: Layers,
      iconBg: 'from-blue-500 to-indigo-600',
      description:
        'Our background crawlers continuously scan and aggregate verified software openings across LinkedIn India, Naukri, Indeed, and leading tech companies. Every job is localized to Indian tech hubs and remote openings with direct links.',
      features: [
        'Localized tech hubs: Bengaluru, Pune, Hyderabad, Noida, Remote',
        'Direct company career portal links (zero spam / redirects)',
        'Automatic deduplication and schema normalization',
        'Fresher, Junior, and Senior engineering tracks'
      ],
      interactivePreview: {
        type: 'portals',
        portals: [
          { name: 'LinkedIn India', count: '1,250+ Roles', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { name: 'Naukri Tech', count: '940+ Roles', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
          { name: 'Direct Startups', count: '480+ Roles', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { name: 'Remote Hubs', count: '320+ Roles', color: 'bg-purple-50 text-purple-700 border-purple-200' }
        ]
      }
    },
    {
      id: 3,
      stepNumber: '03',
      badge: 'Step 3: Algorithmic Match',
      title: 'Deterministic Compatibility Scoring (0–100%)',
      subtitle: 'Transparent skill breakdown and missing skill gap analysis.',
      icon: Cpu,
      iconBg: 'from-emerald-500 to-teal-600',
      description:
        'Unlike black-box algorithms, our matching engine compares your candidate skills against job requirements deterministically. You see exact matched skills, missing requirement gaps, and role alignment bonuses.',
      features: [
        '0% to 100% mathematical compatibility score',
        'Color-coded chips: Matched Skills vs Missing Requirement Gaps',
        'Seniority & domain specialization bonuses',
        'Instant sorting: High Match (80%+), Good Match (60%+)'
      ],
      interactivePreview: {
        type: 'match',
        jobTitle: 'Senior Full Stack Engineer',
        company: 'PhonePe Technologies • Bengaluru',
        score: 92,
        matched: ['React.js', 'Node.js', 'TypeScript', 'MongoDB', 'Docker'],
        missing: ['Kubernetes']
      }
    },
    {
      id: 4,
      stepNumber: '04',
      badge: 'Step 4: Instant Email Alert',
      title: 'Autonomous 70%+ Candidate Email Digest',
      subtitle: 'High-match openings sent strictly to candidate resume email.',
      icon: Mail,
      iconBg: 'from-rose-500 to-indigo-600',
      description:
        'Whenever a job matches 70% or higher with your candidate profile, an immediate executive summary is dispatched directly to your personal email with 1-click apply links. Never miss an interview deadline again.',
      features: [
        'Strict 70%+ qualification threshold (zero irrelevant spam)',
        'Directly addressed to candidate extracted email',
        'Responsive mobile-friendly HTML email digest',
        '1-Click apply links to original company hiring portals'
      ],
      interactivePreview: {
        type: 'email',
        subject: '🎯 3 High-Match Developer Openings (70%+ Match)',
        deliveredTo: 'candidate@resume-email.com',
        time: 'Dispatched in Background'
      }
    }
  ];

  const faqs = [
    {
      q: 'How does the 0-100% ATS match score work?',
      a: 'The engine compares your extracted skills against the requirements specified in each job listing. It computes a base keyword similarity score, applies bonuses for target role and title alignment, and highlights missing skill gaps.'
    },
    {
      q: 'Which resume file formats and sizes are supported?',
      a: 'We support PDF (.pdf), Microsoft Word (.docx, .doc), and plain text (.txt) files up to 10 MB with automated file signature verification to protect against corrupted files.'
    },
    {
      q: 'How do candidate email alerts work?',
      a: 'When you upload your resume, our ATS extracts your contact email directly from the document. Any job with a compatibility score of 70% or higher triggers an instant, non-blocking email alert sent strictly to that address.'
    },
    {
      q: 'Is Real Job Hunter 2K26 free to use?',
      a: 'Yes, 100% free for developers and software engineers. You can upload resumes, inspect compatibility scores, browse aggregated tech openings, and trigger email alerts at zero cost.'
    }
  ];

  const nextStep = () => {
    setActiveStepIndex((prev) => (prev + 1) % steps.length);
  };

  const prevStep = () => {
    setActiveStepIndex((prev) => (prev - 1 + steps.length) % steps.length);
  };

  return (
    <section className="space-y-8 sm:space-y-12 py-2 sm:py-6 w-full overflow-hidden" id="how-it-works-section">
      {/* 1. Header Banner with Responsive Typography */}
      <div className="text-center max-w-3xl mx-auto space-y-3 px-2 sm:px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs">
          <Zap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>Architecture &bull; Autonomous Pipeline</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          How Real Job Hunter 2K26 Works
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl mx-auto">
          Built for software engineers, developers, and freshers. Explore how our autonomous engine extracts ATS skills, crawls verified tech openings, calculates compatibility scores, and alerts you.
        </p>
      </div>

      {/* 2. Responsive Step Selector (Touch-Scrollable on Mobile, Centered on Tablet/Desktop) */}
      <div className="w-full px-2">
        <div className="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-1. overflow-x-auto pb-2 scrollbar-none w-full max-w-3xl mx-auto">
          {steps.map((s, idx) => {
            const StepIcon = s.icon;
            const isActive = activeStepIndex === idx;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStepIndex(idx)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3 py-2 rounded-xl sm:rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 btn-animated ${isActive
                  ? 'bg-indigo-600 text-white shadow-btn-glow'
                  : 'bg-white/80 text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200/80 shadow-2xs'
                  }`}
              >
                <span className={`w-4 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {s.stepNumber}
                </span>
                <span className="text-[11px] sm:text-xs">{s.badge.split(':')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Interactive Step Card (Fully Responsive Bento Box) */}
      <div className="bento-panel rounded-2xl sm:rounded-3xl p-4 sm:p-7 lg:p-10 border border-indigo-100/80 shadow-bento relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          {/* Left Column: Detailed Step Explanation */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-left">
            {/* Step Header Badge & Title */}
            <div className="flex items-start sm:items-center gap-3">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr ${steps[activeStepIndex].iconBg} text-white flex items-center justify-center shadow-md shrink-0`}>
                {React.createElement(steps[activeStepIndex].icon, { className: 'w-5 h-5 sm:w-6 sm:h-6' })}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] font-mono font-extrabold uppercase tracking-wider text-indigo-600 block">
                  {steps[activeStepIndex].badge}
                </span>
                <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 leading-snug">
                  {steps[activeStepIndex].title}
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {steps[activeStepIndex].description}
            </p>

            {/* Checklist of highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {steps[activeStepIndex].features.map((feat, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] sm:text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="leading-tight">{feat}</span>
                </div>
              ))}
            </div>

            {/* Thumb-friendly Previous / Next Navigation for Mobile & Desktop */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 sm:border-0 sm:pt-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={prevStep}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="Previous Step"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Prev Step</span>
                </button>
                <button
                  onClick={nextStep}
                  className="px-3 py-1.5 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="Next Step"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-[11px] font-mono text-slate-400 font-bold">
                {activeStepIndex + 1} of {steps.length}
              </span>
            </div>

            {/* Responsive Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
              <button
                onClick={onStartUpload}
                className="btn-primary-gradient w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-btn-glow"
              >
                <span>Try ATS Parser Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onExploreJobs}
                className="btn-secondary-bento w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 text-center"
              >
                <span>View Live Tech Jobs</span>
              </button>
            </div>
          </div>

          {/* Right Column: Visual Interactive Mockup Terminal */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-xl border border-slate-800 space-y-3 font-sans w-full max-w-full overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 ml-1.5 truncate">
                    pipeline.simulate({steps[activeStepIndex].stepNumber})
                  </span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-mono uppercase bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-700/50 shrink-0">
                  Step {steps[activeStepIndex].stepNumber}
                </span>
              </div>

              {/* Step 1 Visual Output */}
              {activeStepIndex === 0 && (
                <div className="space-y-2.5 text-left">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-bold flex items-center gap-1.5 text-indigo-400 truncate">
                      <FileText className="w-4 h-4 shrink-0" />
                      <span className="truncate">{steps[0].interactivePreview.filename}</span>
                    </span>
                    <span className="text-emerald-400 font-mono text-[10px] sm:text-[11px] shrink-0">✓ Gemini 100%</span>
                  </div>
                  <div className="bg-slate-800/90 rounded-xl p-2.5 sm:p-3 border border-slate-700 space-y-2">
                    <span className="text-[10px] font-mono text-slate-400 block">EXTRACTED_DEVELOPER_SKILLS:</span>
                    <div className="flex flex-wrap gap-1">
                      {steps[0].interactivePreview.skills.map((sk, i) => (
                        <span key={i} className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 flex items-center justify-between px-1">
                    <span>Track: Full Stack / MERN</span>
                    <span className="text-slate-300 font-mono">India / Remote</span>
                  </div>
                </div>
              )}

              {/* Step 2 Visual Output */}
              {activeStepIndex === 1 && (
                <div className="space-y-2.5 text-left">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-bold text-blue-400 flex items-center gap-1.5 truncate">
                      <Globe className="w-4 h-4 shrink-0" /> Tech Hubs (India &amp; Remote)
                    </span>
                    <span className="text-emerald-400 font-mono text-[10px] sm:text-[11px] shrink-0">● Live Sync</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {steps[1].interactivePreview.portals.map((p, i) => (
                      <div key={i} className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-2 sm:p-2.5">
                        <span className="text-[11px] sm:text-xs font-bold text-slate-200 block truncate">{p.name}</span>
                        <span className="text-[10px] font-mono text-indigo-400 font-bold">{p.count}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-2 text-center text-[10px] sm:text-[11px] text-indigo-300 font-mono">
                    Bengaluru &bull; Pune &bull; Hyderabad &bull; Remote
                  </div>
                </div>
              )}

              {/* Step 3 Visual Output */}
              {activeStepIndex === 2 && (
                <div className="space-y-2.5 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-100 block truncate">Senior Full Stack Engineer</span>
                      <span className="text-[10px] sm:text-[11px] text-slate-400 truncate block">PhonePe &bull; Bengaluru</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex flex-col items-center justify-center text-emerald-400 font-extrabold font-mono shrink-0">
                      <span className="text-sm leading-none">92%</span>
                      <span className="text-[8px] uppercase font-sans">Match</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-mono block">MATCHED SKILLS (5/6):</span>
                    <div className="flex flex-wrap gap-1">
                      {steps[2].interactivePreview.matched.map((sk, i) => (
                        <span key={i} className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          ✓ {sk}
                        </span>
                      ))}
                      <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        ✕ Kubernetes
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4 Visual Output */}
              {activeStepIndex === 3 && (
                <div className="space-y-2.5 text-left">
                  <div className="bg-indigo-950/60 border border-indigo-700/50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" /> 70%+ Candidate Digest
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-mono text-emerald-400">Delivered</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-100">
                      🎯 3 High-Match Developer Openings (92%, 85%, 78%)
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                      Sent strictly to candidate's resume email address
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 pt-0.5">
                    <span>Direct 1-Click Apply</span>
                    <span className="text-emerald-400 font-mono">100% Free</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Complete 4-Step Pipeline Roadmap (Responsive Flowchart) */}
      <div className="space-y-4 text-left">
        <div className="text-center sm:text-left space-y-1">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            End-to-End Autonomous Pipeline Architecture
          </h3>
          <p className="text-xs text-slate-500">
            How data flows securely from document parsing to real-time opportunity dispatch.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {steps.map((s, idx) => {
            const StepIcon = s.icon;
            return (
              <div
                key={s.id}
                onClick={() => setActiveStepIndex(idx)}
                className={`bento-card rounded-2xl p-4 sm:p-5 space-y-2.5 cursor-pointer transition-all border ${activeStepIndex === idx
                  ? 'border-indigo-500 bg-white ring-2 ring-indigo-100 shadow-md'
                  : 'border-slate-200/80 bg-white/70 hover:bg-white hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${s.iconBg} text-white flex items-center justify-center font-bold text-xs shadow-xs`}>
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono font-extrabold text-slate-400">
                    {s.stepNumber}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                  {s.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {s.subtitle}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Four Pillar Value Cards (SEO Friendly & Responsive) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-left">
        <div className="bento-card rounded-2xl p-4 sm:p-5 space-y-2 border border-slate-200/80 bg-white/70">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Code2 className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900">AI Developer Job Finder</h4>
          <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
            Tailored specifically for software engineers, MERN developers, full stack, and cloud engineers.
          </p>
        </div>

        <div className="bento-card rounded-2xl p-4 sm:p-5 space-y-2 border border-slate-200/80 bg-white/70">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900">Resume Matcher for Devs</h4>
          <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
            Deterministic math algorithm scoring 0-100% with matched and missing skill breakdown.
          </p>
        </div>

        <div className="bento-card rounded-2xl p-4 sm:p-5 space-y-2 border border-slate-200/80 bg-white/70">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Briefcase className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900">Fresher &amp; Senior Tracks</h4>
          <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
            From entry-level fresher job opportunities to lead architect roles across Indian hubs and remote.
          </p>
        </div>

        <div className="bento-card rounded-2xl p-4 sm:p-5 space-y-2 border border-slate-200/80 bg-white/70">
          <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
            <Mail className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900">Instant 70%+ Email Alerts</h4>
          <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
            Zero spam. Only high-compatibility opportunities dispatched directly to your inbox.
          </p>
        </div>
      </div>

      {/* 6. Responsive FAQ Accordion */}
      <div className="bento-panel rounded-2xl sm:rounded-3xl p-5 sm:p-8 space-y-4 text-left border border-slate-200/80">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900">Frequently Asked Questions</h3>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isExpanded = expandedFaqIndex === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200/80 rounded-xl bg-white overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-slate-900 hover:text-indigo-600"
                >
                  <span>{faq.q}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-3.5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2.5">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
