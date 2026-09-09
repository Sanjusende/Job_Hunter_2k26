import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck,
  Mail,
  MapPin,
  Sparkles,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Send,
  Check,
  RefreshCw,
  Briefcase,
  Target
} from 'lucide-react';

/**
 * Parsed Profile Summary Ribbon & Candidate HUD
 * Provides interactive skill tweaking, email editing, and candidate metadata
 */
export default function CandidateHeader({
  profile,
  onUpdateSkills,
  onTriggerEmailAlert,
  isSendingAlert,
  onUpdateEmail,
  matchesCount = 0
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState(profile?.email || '');

  if (!profile) return null;

  const skills = profile.extractedSkills || profile.skills || [];
  const targetRoles = profile.targetRoles || [];
  const locations = profile.preferredLocations || ['India & Remote'];

  const handleAddSkill = (e) => {
    e.preventDefault();
    const clean = newSkillInput.trim().toLowerCase();
    if (clean && !skills.includes(clean)) {
      const updated = [...skills, clean];
      if (onUpdateSkills) onUpdateSkills(updated);
      setNewSkillInput('');
      setIsAddingSkill(false);
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updated = skills.filter(s => s !== skillToRemove);
    if (onUpdateSkills) onUpdateSkills(updated);
  };

  const handleSaveEmail = () => {
    if (emailInput && emailInput.includes('@')) {
      if (onUpdateEmail) onUpdateEmail(emailInput.trim());
      setIsEditingEmail(false);
    }
  };

  // Compute initials for sleek CSS avatar badge (no broken image urls)
  const initials = (profile.name || 'Candidate')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('');

  return (
    <div className="w-full glass-panel rounded-2xl border border-white/10 p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Background radial gradient accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Primary Ribbon Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

        {/* Candidate Identity */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-emerald-500/25 border border-white/20">
            {initials || 'JS'}
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-extrabold text-white tracking-tight">{profile.name || 'Candidate Profile'}</h2>

              {/* Level Badge */}
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                {profile.experienceLevel || 'Mid'} Level
              </span>

              {/* Verified ATS Badge */}
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-400" />
                ATS Parsed
              </span>
            </div>

            {/* Sub-meta: Email & Target Market */}
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1.5 flex-wrap">
              {/* Interactive Email Pill */}
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                {isEditingEmail ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="your.email@gmail.com"
                      className="px-2 py-0.5 text-xs bg-slate-900 border border-emerald-500/50 rounded text-white focus:outline-none"
                    />
                    <button
                      onClick={handleSaveEmail}
                      className="px-2 py-0.5 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingEmail(false)}
                      className="px-1.5 py-0.5 text-[11px] text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <span className="group flex items-center gap-1.5 font-mono text-slate-300">
                    {profile.email || 'No email configured'}
                    <button
                      onClick={() => {
                        setEmailInput(profile.email || '');
                        setIsEditingEmail(true);
                      }}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 underline ml-1"
                    >
                      Edit
                    </button>
                  </span>
                )}
              </div>

              {/* Location Preference */}
              <span className="flex items-center gap-1 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                🎯 Target Market: <span className="text-slate-200 font-medium">{locations.join(', ')}</span>
              </span>

              {/* Matched count indicator */}
              <span className="text-emerald-400 font-semibold font-mono">
                {matchesCount} Openings (70%+ Match)
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start lg:self-auto flex-wrap">
          {/* Dispatch Email Alert Button */}
          <button
            onClick={() => onTriggerEmailAlert && onTriggerEmailAlert(profile.email)}
            disabled={isSendingAlert}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 transform active:scale-95 disabled:opacity-50"
            title="Dispatch 70%+ job alert digest to candidate email"
          >
            <Send className="w-3.5 h-3.5" />
            {isSendingAlert ? 'Dispatching...' : 'Email Digest 📨'}
          </button>

          {/* Toggle Expand */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors flex items-center gap-1"
            title={isExpanded ? 'Collapse profile details' : 'Expand profile details'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Skills and Roles Ribbon */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-5 pt-4 border-t border-white/10 space-y-3"
          >
            {/* Target Roles */}
            {targetRoles.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1 mr-1">
                  <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                  Target Roles:
                </span>
                {targetRoles.map((role, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 text-xs font-medium rounded-lg bg-cyan-950/40 text-cyan-200 border border-cyan-800/40"
                  >
                    {role}
                  </span>
                ))}
              </div>
            )}

            {/* Interactive Skills Matrix */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1 mr-1">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                Detected Skills ({skills.length}):
              </span>

              {/* Skills Chips */}
              <div className="flex flex-wrap gap-1.5 items-center">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="group inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-200 border border-slate-700/80 hover:border-emerald-500/50 hover:bg-slate-800 transition-all"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="opacity-40 group-hover:opacity-100 hover:text-rose-400 transition-opacity ml-0.5"
                      title={`Remove ${skill}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {/* Add New Skill Tag */}
                {isAddingSkill ? (
                  <form onSubmit={handleAddSkill} className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      autoFocus
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      placeholder="e.g. docker"
                      className="px-2 py-0.5 text-xs bg-slate-900 border border-emerald-500/60 rounded-md text-white focus:outline-none w-28"
                    />
                    <button
                      type="submit"
                      className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingSkill(false)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingSkill(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 hover:text-emerald-300 border border-dashed border-white/20 hover:border-emerald-500/50 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add Skill
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
