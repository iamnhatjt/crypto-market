import { CHART_RANGES } from '../api/coinChart';
import { ChartRange } from '../types/coin';

interface ChartRangeSelectProps {
  value: ChartRange;
  onChange: (range: ChartRange) => void;
  disabled?: boolean;
}

const LABELS: Record<ChartRange, string> = {
  1: '24H',
  7: '7D',
  30: '30D',
  90: '90D',
  365: '1Y',
};

function ChartRangeSelect({ value, onChange, disabled = false }: ChartRangeSelectProps) {
  return (
    <div
      role="group"
      aria-label="Chart range"
      className="inline-flex overflow-hidden rounded-lg border border-slate-300 dark:border-slate-600"
    >
      {CHART_RANGES.map((range) => {
        const active = range === value;

        return (
          <button
            key={range}
            type="button"
            data-testid={`chart-range-${range}`}
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange(range)}
            className={`px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              active
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {LABELS[range]}
          </button>
        );
      })}
    </div>
  );
}

export default ChartRangeSelect;
