import { formatPercent, trendOf } from '../lib/format';

const TREND_STYLES: Record<string, string> = {
  up: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
  down: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10',
  flat: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/40',
};

const TREND_GLYPH: Record<string, string> = { up: '▲', down: '▼', flat: '' };

interface TrendBadgeProps {
  percent: number | null;
  /** Test id for the value itself, so the card and the detail page can differ. */
  testId: string;
  showGlyph?: boolean;
}

function TrendBadge({ percent, testId, showGlyph = false }: TrendBadgeProps) {
  const trend = trendOf(percent);
  const glyph = TREND_GLYPH[trend];

  return (
    <span
      title="Change over the last 24 hours"
      className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold tabular-nums ${TREND_STYLES[trend]}`}
    >
      {showGlyph && glyph !== '' && (
        <span aria-hidden="true" className="text-[0.65rem] leading-none">
          {glyph}
        </span>
      )}
      <span data-testid={testId} data-trend={trend}>
        {formatPercent(percent)}
      </span>
    </span>
  );
}

export default TrendBadge;
