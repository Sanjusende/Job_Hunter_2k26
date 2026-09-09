import React from 'react';
import { Search, Filter, Sparkles, MapPin, Globe, Zap, X } from 'lucide-react';

/**
 * Match Statistics & Filter Toolbar Component
 * Provides instant search, quick filter pills, and live count ticker
 */
export default function JobFilterBar({
  searchQuery,
  onSearchChange,
  activeFilterTab,
  onFilterTabChange,
  totalCount,
  filteredCount,
  onResetFilters
}) {
  const filterTabs = [
    { id: 'all-70', label: 'All Matched (70-100%)', icon: Zap },
    { id: 'high-85', label: 'High Match (85%+)', icon: Sparkles },
    { id: 'remote', label: 'Remote Only', icon: Globe },
    { id: 'tech-hubs', label: 'Bengaluru / Pune / Hyderabad', icon: MapPin },
  ];

  const hasActiveFilters = searchQuery.trim() !== '' || activeFilterTab !== 'all-70';

  return (
    <div className="w-full glass-panel rounded-2xl p-3.5 sm:p-4 border border-white/10 shadow-xl backdrop-blur-xl space-y-3">

      {/* Top Row: Search Input & Match Count Ticker */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3">

        {/* Search Bar */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by job title, company, skills, or tech stack..."
            className="w-full pl-10 pr-9 py-2 text-xs bg-slate-900/90 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/80 focus:ring-1 focus:ring-brand-500/40 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Count Ticker */}
        <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Showing <strong className="text-emerald-300 font-mono text-xs sm:text-sm">{filteredCount}</strong> compatible roles</span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="text-[11px] text-brand-400 hover:text-brand-300 underline transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Quick Filter Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 pt-1 border-t border-white/10 no-scrollbar">
        <span className="text-[10px] sm:text-[11px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1 shrink-0 mr-1">
          <Filter className="w-3 h-3 text-slate-500" />
          Filters:
        </span>

        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeFilterTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onFilterTabChange(tab.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${isActive
                ? 'bg-gradient-to-r from-brand-600/30 to-cyber-violet/30 text-brand-200 border-brand-500/50 shadow-sm shadow-brand-500/20'
                : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border-white/5'
                }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-400' : 'text-slate-500'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>

  );
}
