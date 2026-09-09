import React from 'react';

/**
 * MatchBadge: Color-coded visual indicator for ATS match scores
 * - Green > 80% (Exceptional Match)
 * - Amber 60 - 80% (Strong Match)
 * - Indigo / Slate < 60% (Moderate Match)
 */
export default function MatchBadge({ score, size = 'md', showLabel = true }) {
  const numericScore = typeof score === 'number' ? Math.round(score) : parseInt(score, 10) || 0;

  let colorClasses = '';
  let glowStyle = '';
  let textLabel = 'Match';
  let dotColor = '';

  if (numericScore >= 80) {
    colorClasses = 'bg-emerald-50 border-emerald-200 text-emerald-800';
    glowStyle = 'shadow-[0_2px_8px_rgba(16,185,129,0.15)]';
    textLabel = 'High Match';
    dotColor = 'bg-emerald-500';
  } else if (numericScore >= 60) {
    colorClasses = 'bg-indigo-50 border-indigo-200 text-indigo-800';
    glowStyle = 'shadow-[0_2px_8px_rgba(99,102,241,0.12)]';
    textLabel = 'Good Match';
    dotColor = 'bg-indigo-500';
  } else {
    colorClasses = 'bg-slate-100 border-slate-200 text-slate-600';
    glowStyle = '';
    textLabel = 'Fair Match';
    dotColor = 'bg-slate-400';
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5 font-semibold',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-bold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-extrabold'
  }[size] || 'text-xs px-2.5 py-1 gap-1.5 font-bold';

  return (
    <div
      className={`inline-flex items-center rounded-full border backdrop-blur-md transition-all duration-200 ${colorClasses} ${sizeClasses} ${glowStyle}`}
      title={`${numericScore}% Compatibility Score`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {numericScore >= 80 && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B0AEFF] opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
      </span>
      <span className="font-mono tracking-tight font-bold">{numericScore}%</span>
      {showLabel && <span className="opacity-95 font-medium text-[0.85em]">{textLabel}</span>}
    </div>
  );
}


