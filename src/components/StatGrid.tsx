
export interface Stat {
  /** Becomes `data-testid="stat-{id}"`. */
  id: string;
  label: string;
  value: string;
  /** Optional second line, e.g. the date an all-time high was set. */
  detail?: string | null;
}

function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.id}
          data-testid={`stat-${stat.id}`}
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
        >
          <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</dt>
          <dd className="mt-1 break-words text-base font-semibold tabular-nums text-slate-900 dark:text-slate-50">
            {stat.value}
          </dd>
          {stat.detail && (
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{stat.detail}</p>
          )}
        </div>
      ))}
    </dl>
  );
}

export default StatGrid;
