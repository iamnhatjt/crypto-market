import { SortDirection, SortField } from '../types/coin';
import { CONTROL_SELECT } from './controlStyles';

interface SortControlsProps {
  field: SortField;
  direction: SortDirection;
  onFieldChange: (field: SortField) => void;
  onDirectionChange: (direction: SortDirection) => void;
  disabled?: boolean;
}

/**
 * Only fields CoinGecko's `order` parameter honours. Price and 24h change are
 * absent on purpose: the API returns 200 with market-cap ordering when asked
 * for them, so offering them would ship sorts that silently do nothing.
 */
const FIELD_OPTIONS: Array<{ value: SortField; label: string }> = [
  { value: 'market_cap', label: 'Market cap' },
  { value: 'volume', label: 'Volume (24h)' },
];

const DIRECTION_OPTIONS: Array<{ value: SortDirection; label: string; hint: string }> = [
  { value: 'desc', label: 'High → low', hint: 'Sort descending' },
  { value: 'asc', label: 'Low → high', hint: 'Sort ascending' },
];

function SortControls({
  field,
  direction,
  onFieldChange,
  onDirectionChange,
  disabled = false,
}: SortControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="sort-field" className="sr-only">
        Sort by
      </label>

      <select
        id="sort-field"
        data-testid="sort-field"
        value={field}
        disabled={disabled}
        onChange={(event) => onFieldChange(event.target.value as SortField)}
        className={CONTROL_SELECT}
      >
        {FIELD_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div
        role="group"
        aria-label="Sort direction"
        className="inline-flex overflow-hidden rounded-lg border border-slate-300 dark:border-slate-600"
      >
        {DIRECTION_OPTIONS.map((option) => {
          const active = direction === option.value;

          return (
            <button
              key={option.value}
              type="button"
              data-testid={`sort-direction-${option.value}`}
              aria-pressed={active}
              title={option.hint}
              disabled={disabled}
              onClick={() => onDirectionChange(option.value)}
              className={`px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                active
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

    </div>
  );
}

export default SortControls;
