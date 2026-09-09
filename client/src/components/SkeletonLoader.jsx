import React from 'react';

/**
 * High-fidelity Skeleton Loaders for Job Cards and Bento Dashboards
 * Provides shimmering animated placeholder blocks ("scalettne")
 */
export function JobCardSkeleton() {
  return (
    <div className="bento-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-indigo-100/80 shadow-bento space-y-4">
      {/* Top Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {/* Avatar Icon Skeleton */}
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl skeleton-shimmer shrink-0" />

          {/* Job Title & Company */}
          <div className="flex-1 space-y-2 py-0.5">
            <div className="h-4 w-3/5 rounded-lg skeleton-shimmer" />
            <div className="flex items-center gap-2">
              <div className="h-3 w-24 rounded-md skeleton-shimmer" />
              <div className="h-3 w-3 rounded-full skeleton-shimmer" />
              <div className="h-3 w-28 rounded-md skeleton-shimmer" />
            </div>
          </div>
        </div>

        {/* Circular Dial Placeholder */}
        <div className="w-12 h-12 rounded-2xl skeleton-shimmer shrink-0" />
      </div>

      {/* Skills Row Placeholder */}
      <div className="pt-2 border-t border-indigo-50 flex items-center gap-2 flex-wrap">
        <div className="h-3 w-16 rounded-md skeleton-shimmer" />
        <div className="h-6 w-20 rounded-lg skeleton-shimmer" />
        <div className="h-6 w-24 rounded-lg skeleton-shimmer" />
        <div className="h-6 w-16 rounded-lg skeleton-shimmer" />
      </div>

      {/* Description lines */}
      <div className="space-y-1.5 pt-1">
        <div className="h-3 w-full rounded-md skeleton-shimmer" />
        <div className="h-3 w-4/5 rounded-md skeleton-shimmer" />
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-indigo-50 flex items-center justify-between gap-3">
        <div className="h-5 w-24 rounded-md skeleton-shimmer" />
        <div className="h-8 w-32 rounded-xl skeleton-shimmer" />
      </div>
    </div>
  );
}

export function JobListSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      {/* Profile Card Skeleton */}
      <div className="bento-panel rounded-3xl p-6 border border-indigo-100/80 shadow-bento space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl skeleton-shimmer shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-48 rounded-lg skeleton-shimmer" />
            <div className="h-3.5 w-64 rounded-md skeleton-shimmer" />
          </div>
        </div>
      </div>

      {/* 4 Metric Bento Skeletons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bento-card rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="h-3.5 w-20 rounded-md skeleton-shimmer" />
            <div className="h-7 w-16 rounded-lg skeleton-shimmer" />
            <div className="h-3 w-28 rounded-md skeleton-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default JobListSkeleton;
