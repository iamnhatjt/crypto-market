import { GRID_CLASSES } from '../CoinGrid';

interface SkeletonGridProps {
  count?: number;
}

/**
 * Mirrors CoinCard's dimensions so the layout does not jump when real data
 * replaces the placeholders.
 */
function SkeletonGrid({ count = 20 }: SkeletonGridProps) {
  return (
    <div data-testid="skeleton-grid" aria-busy="true" aria-label="Loading market data" className={GRID_CLASSES}>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          data-testid="skeleton-card"
          className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-2 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="h-6 w-24 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-6 w-16 rounded bg-slate-200 dark:bg-slate-700" />
          </div>

          <div className="mt-4 h-2 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      ))}
    </div>
  );
}

export default SkeletonGrid;
