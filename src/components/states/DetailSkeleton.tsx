import React from 'react';

/** Mirrors the detail layout so the page does not jump when data lands. */
function DetailSkeleton() {
  return (
    <div data-testid="detail-skeleton" aria-busy="true" aria-label="Loading coin" className="space-y-6">
      <div className="flex animate-pulse items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-2">
          <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-2 h-5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default DetailSkeleton;
