import React from 'react';

interface SkeletonProps {
  type?: 'form' | 'cards' | 'table';
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({ type = 'form' }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 space-y-6 animate-pulse">
      {/* Title Header Skeleton */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-100">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 rounded-md" />
          <div className="h-4 w-72 bg-slate-100 rounded-md" />
        </div>
        <div className="h-9 w-28 bg-slate-200 rounded-xl" />
      </div>

      {type === 'form' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <div className="h-4 w-28 bg-slate-200 rounded" />
              <div className="h-11 w-full bg-slate-100 rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-11 w-full bg-slate-100 rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-11 w-full bg-slate-100 rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-36 bg-slate-200 rounded" />
              <div className="h-11 w-full bg-slate-100 rounded-xl" />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
            <div className="h-5 w-40 bg-slate-200 rounded" />
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-3/4 bg-slate-100 rounded" />
          </div>

          <div className="flex gap-4 pt-2">
            <div className="h-12 w-full bg-slate-200 rounded-xl" />
            <div className="h-12 w-full bg-slate-200 rounded-xl" />
          </div>
        </div>
      )}

      {type === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-5 w-36 bg-slate-200 rounded" />
                <div className="h-6 w-20 bg-slate-200 rounded-lg" />
              </div>
              <div className="h-16 w-full bg-slate-200/60 rounded-xl" />
              <div className="h-16 w-full bg-slate-200/60 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {type === 'table' && (
        <div className="space-y-3">
          <div className="h-10 w-full bg-slate-100 rounded-xl" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full bg-slate-50 border border-slate-100 rounded-xl" />
          ))}
        </div>
      )}
    </div>
  );
};
